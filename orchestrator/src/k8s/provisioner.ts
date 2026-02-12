import * as k8s from '@kubernetes/client-node';
import { coreApi, appsApi, networkingApi } from './client';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as yaml from 'js-yaml';
import * as crypto from 'crypto';

const execAsync = promisify(exec);

export interface ProvisionOptions {
  storeId: string;
  storeName: string;
  namespace: string;
  engine: 'woocommerce' | 'medusa';
}

export class K8sProvisioner {
  async createNamespace(namespace: string): Promise<void> {
    const namespaceManifest: k8s.V1Namespace = {
      metadata: {
        name: namespace,
        labels: {
          'app.kubernetes.io/managed-by': 'store-platform',
          'store-platform/type': 'store-namespace',
        },
      },
    };

    try {
      await coreApi.createNamespace(namespaceManifest);
      console.log(`Created namespace: ${namespace}`);
    } catch (error: any) {
      if (error.response?.statusCode === 409) {
        console.log(`Namespace ${namespace} already exists`);
      } else {
        throw error;
      }
    }
  }

  async createResourceQuota(namespace: string): Promise<void> {
    const quota: k8s.V1ResourceQuota = {
      metadata: {
        name: 'store-quota',
        namespace,
      },
      spec: {
        hard: {
          'requests.cpu': '2',
          'requests.memory': '4Gi',
          'limits.cpu': '4',
          'limits.memory': '8Gi',
          'persistentvolumeclaims': '5',
          'requests.storage': '20Gi',
        },
      },
    };

    try {
      await coreApi.createNamespacedResourceQuota(namespace, quota);
      console.log(`Created resource quota for namespace: ${namespace}`);
    } catch (error: any) {
      if (error.response?.statusCode === 409) {
        console.log(`Resource quota already exists in ${namespace}`);
      } else {
        console.error(`Failed to create resource quota:`, error.message);
      }
    }
  }

  async createLimitRange(namespace: string): Promise<void> {
    const limitRange: k8s.V1LimitRange = {
      metadata: {
        name: 'store-limits',
        namespace,
      },
      spec: {
        limits: [
          {
            type: 'Container',
            _default: {
              cpu: '500m',
              memory: '512Mi',
            },
            defaultRequest: {
              cpu: '100m',
              memory: '128Mi',
            },
            max: {
              cpu: '2',
              memory: '2Gi',
            },
          },
          {
            type: 'PersistentVolumeClaim',
            max: {
              storage: '10Gi',
            },
          },
        ],
      },
    };

    try {
      await coreApi.createNamespacedLimitRange(namespace, limitRange);
      console.log(`Created limit range for namespace: ${namespace}`);
    } catch (error: any) {
      if (error.response?.statusCode === 409) {
        console.log(`Limit range already exists in ${namespace}`);
      } else {
        console.error(`Failed to create limit range:`, error.message);
      }
    }
  }

  async createMySQLSecret(namespace: string, storeName: string): Promise<{ dbPassword: string; rootPassword: string }> {
    // Generate secure random passwords (alphanumeric only for MySQL compatibility)
    const dbPassword = crypto.randomBytes(24).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
    const rootPassword = crypto.randomBytes(24).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);

    const secret: k8s.V1Secret = {
      metadata: {
        name: `${storeName}-mysql-secret`,
        namespace,
        labels: {
          'app.kubernetes.io/managed-by': 'store-platform',
          'app': `${storeName}-mysql`,
        },
      },
      type: 'Opaque',
      stringData: {
        // Use stringData instead of data - Kubernetes will handle base64 encoding
        'mysql-password': dbPassword,
        'mysql-root-password': rootPassword,
      },
    };

    try {
      await coreApi.createNamespacedSecret(namespace, secret);
      console.log(`Created MySQL secret for namespace: ${namespace}`);
    } catch (error: any) {
      if (error.response?.statusCode === 409) {
        console.log(`MySQL secret already exists in ${namespace}`);
      } else {
        console.error(`Failed to create MySQL secret:`, error.message);
        throw error;
      }
    }

    return { dbPassword, rootPassword };
  }

  async helmInstall(options: ProvisionOptions): Promise<void> {
    const { namespace, engine, storeName, storeId } = options;
    const chartPath = `./helm-charts/${engine}-store`;
    const releaseName = `store-${storeId.substring(0, 8)}`;
    const domainSuffix = process.env.DEFAULT_DOMAIN_SUFFIX || '.local.stores.dev';
    const domain = `${storeName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}${domainSuffix}`;

    // Sanitize storeName for Kubernetes (lowercase, no spaces, only alphanumeric and dashes)
    const sanitizedStoreName = storeName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '');

    // Create MySQL secret with secure random passwords
    const { dbPassword, rootPassword } = await this.createMySQLSecret(namespace, sanitizedStoreName);
    console.log(`Generated secure MySQL passwords for ${sanitizedStoreName}`);

    // Create values file instead of using --set (prevents injection)
    const valuesContent = {
      storeName: sanitizedStoreName,
      storeId: storeId,
      storeUrl: `http://${domain}`,
      wordpress: {
        adminPassword: 'Admin@123!',
        adminEmail: 'admin@example.com'
      },
      ingress: {
        host: domain,
        enabled: true
      },
      mysql: {
        auth: {
          existingSecret: `${sanitizedStoreName}-mysql-secret`,
          username: 'woocommerce',
          database: 'woocommerce',
        }
      }
    };

    const tmpDir = process.platform === 'win32' ? process.env.TEMP || 'C:\\tmp' : '/tmp';
    const valuesFilePath = `${tmpDir}/helm-values-${storeId}.yaml`;

    try {
      await fs.writeFile(valuesFilePath, yaml.dump(valuesContent));

      // Sanitize inputs for shell command
      const safeReleaseName = releaseName.replace(/[^a-z0-9-]/g, '');
      const safeNamespace = namespace.replace(/[^a-z0-9-]/g, '');

      const helmCommand = `helm install ${safeReleaseName} ${chartPath} --namespace ${safeNamespace} --create-namespace -f ${valuesFilePath} --wait --timeout 10m`;

      console.log(`Executing: ${helmCommand}`);

      const { stdout, stderr } = await execAsync(helmCommand);
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);

      console.log(`Helm chart installed successfully for ${namespace}`);
    } catch (error: any) {
      console.error(`Helm install failed:`, error.message);
      throw new Error(`Helm installation failed: ${error.message}`);
    } finally {
      // Clean up values file
      try {
        await fs.unlink(valuesFilePath);
      } catch (err) {
        console.warn(`Failed to clean up values file: ${valuesFilePath}`);
      }
    }
  }

  async checkDeploymentReady(namespace: string): Promise<boolean> {
    try {
      const { body } = await appsApi.listNamespacedDeployment(namespace);
      const deployments = body.items;

      if (deployments.length === 0) {
        return false;
      }

      for (const deployment of deployments) {
        const readyReplicas = deployment.status?.readyReplicas || 0;
        const desiredReplicas = deployment.spec?.replicas || 0;

        if (readyReplicas < desiredReplicas) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error(`Error checking deployment status:`, error);
      return false;
    }
  }

  async getStoreUrls(namespace: string): Promise<string[]> {
    try {
      const { body } = await networkingApi.listNamespacedIngress(namespace);
      const urls: string[] = [];

      for (const ingress of body.items) {
        const rules = ingress.spec?.rules || [];
        for (const rule of rules) {
          if (rule.host) {
            const protocol = ingress.spec?.tls?.some(t => t.hosts?.includes(rule.host!)) ? 'https' : 'http';
            urls.push(`${protocol}://${rule.host}`);
          }
        }
      }

      return urls;
    } catch (error) {
      console.error(`Error fetching ingress URLs:`, error);
      return [];
    }
  }

  async deleteNamespace(namespace: string): Promise<void> {
    try {
      await coreApi.deleteNamespace(namespace);
      console.log(`Deleted namespace: ${namespace}`);
    } catch (error: any) {
      if (error.response?.statusCode === 404) {
        console.log(`Namespace ${namespace} not found`);
      } else {
        throw error;
      }
    }
  }

  async namespaceExists(namespace: string): Promise<boolean> {
    try {
      await coreApi.readNamespace(namespace);
      return true;
    } catch (error: any) {
      if (error.response?.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }
}

export default new K8sProvisioner();
