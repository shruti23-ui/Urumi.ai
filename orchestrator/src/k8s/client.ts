import * as k8s from '@kubernetes/client-node';

const kc = new k8s.KubeConfig();

if (process.env.KUBECONFIG) {
  kc.loadFromFile(process.env.KUBECONFIG);
} else {
  try {
    kc.loadFromDefault();
  } catch (error) {
    console.error('Failed to load kubeconfig:', error);
    throw error;
  }
}

export const coreApi = kc.makeApiClient(k8s.CoreV1Api);
export const appsApi = kc.makeApiClient(k8s.AppsV1Api);
export const networkingApi = kc.makeApiClient(k8s.NetworkingV1Api);
export const rbacApi = kc.makeApiClient(k8s.RbacAuthorizationV1Api);

export default kc;
