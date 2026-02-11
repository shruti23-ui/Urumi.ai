import pool from '../config/database';
import k8sProvisioner from '../k8s/provisioner';

interface Store {
  id: string;
  name: string;
  engine: 'woocommerce' | 'medusa';
  status: string;
  namespace: string;
  urls?: string;
}

const RECONCILIATION_LOCK_ID = 123456;

export class Reconciler {
  async reconcile(): Promise<boolean> {
    const client = await pool.connect();
    let hasWork = false;

    try {
      // Try to acquire advisory lock (non-blocking)
      const lockResult = await client.query(
        'SELECT pg_try_advisory_lock($1) as acquired',
        [RECONCILIATION_LOCK_ID]
      );

      if (!lockResult.rows[0].acquired) {
        console.log('Another orchestrator is reconciling, skipping this cycle');
        return false;
      }

      // We have the lock, proceed with reconciliation
      hasWork = await this.reconcileProvisioning(client);
      await this.reconcileDeleting(client);

      return hasWork;
    } catch (error: any) {
      console.error('Reconciliation error:', error.message);
      return false;
    } finally {
      // Always release the lock
      try {
        await client.query('SELECT pg_advisory_unlock($1)', [RECONCILIATION_LOCK_ID]);
      } catch (err) {
        console.error('Failed to release advisory lock:', err);
      }
      client.release();
    }
  }

  private async reconcileProvisioning(client: any): Promise<boolean> {
    const result = await client.query(
      "SELECT * FROM stores WHERE status = 'provisioning' ORDER BY created_at ASC LIMIT 1"
    );

    if (result.rows.length === 0) {
      return false; // No work to do
    }

    const store: Store = result.rows[0];

    try {
      console.log(`Reconciling store: ${store.id} (${store.name})`);

      const namespaceExists = await k8sProvisioner.namespaceExists(store.namespace);

      if (!namespaceExists) {
        console.log(`Creating namespace and resources for ${store.namespace}...`);

        await k8sProvisioner.createNamespace(store.namespace);
        await k8sProvisioner.createResourceQuota(store.namespace);
        await k8sProvisioner.createLimitRange(store.namespace);

        await this.addEvent(client, store.id, 'namespace_created', `Namespace ${store.namespace} created`);

        console.log(`Installing Helm chart for ${store.engine}...`);
        await k8sProvisioner.helmInstall({
          storeId: store.id,
          storeName: store.name,
          namespace: store.namespace,
          engine: store.engine,
        });

        await this.addEvent(client, store.id, 'helm_installed', `Helm chart installed for ${store.engine}`);
      }

      const isReady = await k8sProvisioner.checkDeploymentReady(store.namespace);

      if (isReady) {
        const urls = await k8sProvisioner.getStoreUrls(store.namespace);
        const urlsString = urls.length > 0 ? JSON.stringify(urls) : null;

        await client.query(
          "UPDATE stores SET status = 'ready', urls = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
          [urlsString, store.id]
        );

        await this.addEvent(client, store.id, 'store_ready', `Store is ready at ${urls.join(', ')}`);
        console.log(`Store ${store.id} is now ready`);
        return false; // Work completed for this store
      } else {
        console.log(`Store ${store.id} is still provisioning...`);
        return true; // Still has work in progress
      }
    } catch (error: any) {
      console.error(`Failed to provision store ${store.id}:`, error);

      await client.query(
        "UPDATE stores SET status = 'failed', error_message = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [error.message, store.id]
      );

      await this.addEvent(client, store.id, 'provisioning_failed', `Failed: ${error.message}`);
      return false; // Failed, no more work for this store
    }
  }

  private async reconcileDeleting(client: any): Promise<void> {
    const result = await client.query(
      "SELECT * FROM stores WHERE status = 'deleting' ORDER BY updated_at ASC"
    );

    const stores: Store[] = result.rows;

    for (const store of stores) {
      try {
        console.log(`Deleting store: ${store.id} (${store.name})`);

        const namespaceExists = await k8sProvisioner.namespaceExists(store.namespace);

        if (namespaceExists) {
          await k8sProvisioner.deleteNamespace(store.namespace);
          await this.addEvent(client, store.id, 'namespace_deleted', `Namespace ${store.namespace} deleted`);
        }

        await client.query('DELETE FROM stores WHERE id = $1', [store.id]);
        console.log(`Store ${store.id} fully deleted`);
      } catch (error: any) {
        console.error(`Failed to delete store ${store.id}:`, error);

        await client.query(
          "UPDATE stores SET status = 'failed', error_message = $1 WHERE id = $2",
          [`Delete failed: ${error.message}`, store.id]
        );
      }
    }
  }

  private async addEvent(client: any, storeId: string, eventType: string, message: string): Promise<void> {
    try {
      await client.query(
        'INSERT INTO store_events (store_id, event_type, message) VALUES ($1, $2, $3)',
        [storeId, eventType, message]
      );
    } catch (error) {
      console.error('Failed to add event:', error);
    }
  }
}

export default new Reconciler();
