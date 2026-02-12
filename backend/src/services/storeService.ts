import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { Store, CreateStoreRequest, StoreEvent } from '../models/Store';
import logger from '../utils/logger';

export class StoreService {
  async createStore(data: CreateStoreRequest): Promise<Store> {
    const id = uuidv4();
    const namespace = `store-${data.name.toLowerCase().replace(/[^a-z0-9-]/g, '-')}-${id.substring(0, 8)}`;
    const userId = data.user_id || 'default-user';

    const result = await pool.query(
      `INSERT INTO stores (id, name, engine, status, namespace, user_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, data.name, data.engine, 'provisioning', namespace, userId]
    );

    await this.addEvent(id, 'created', `Store creation initiated`);

    return result.rows[0];
  }

  async createStoreWithTransaction(data: CreateStoreRequest & {
    idempotency_key?: string,
    correlation_id?: string
  }): Promise<Store> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check idempotency
      if (data.idempotency_key) {
        const existing = await client.query(
          'SELECT * FROM stores WHERE user_id = $1 AND idempotency_key = $2',
          [data.user_id || 'default-user', data.idempotency_key]
        );
        if (existing.rows.length > 0) {
          await client.query('COMMIT');
          logger.info('Returning existing store from idempotency key', {
            storeId: existing.rows[0].id,
            idempotencyKey: data.idempotency_key,
            correlationId: data.correlation_id
          });
          return existing.rows[0];
        }
      }

      const id = uuidv4();
      const namespace = `store-${data.name.toLowerCase().replace(/[^a-z0-9-]/g, '-')}-${id.substring(0, 8)}`;

      const result = await client.query(
        `INSERT INTO stores (id, name, engine, status, namespace, user_id, idempotency_key, correlation_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [id, data.name, data.engine, 'provisioning', namespace, data.user_id || 'default-user', data.idempotency_key, data.correlation_id]
      );

      await client.query(
        'INSERT INTO store_events (store_id, event_type, message, correlation_id) VALUES ($1, $2, $3, $4)',
        [id, 'created', 'Store creation initiated', data.correlation_id]
      );

      await client.query('COMMIT');

      logger.info('Store created successfully', {
        storeId: id,
        name: data.name,
        engine: data.engine,
        userId: data.user_id,
        correlationId: data.correlation_id
      });

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Store creation failed, transaction rolled back', {
        error: error instanceof Error ? error.message : 'Unknown error',
        name: data.name,
        correlationId: data.correlation_id
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async getStores(userId: string = 'default-user'): Promise<Store[]> {
    const result = await pool.query(
      'SELECT * FROM stores WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  async getStoresWithPagination(
    userId: string = 'default-user',
    limit: number = 50,
    offset: number = 0
  ): Promise<{ stores: Store[]; total: number; hasMore: boolean }> {
    const [storesResult, countResult] = await Promise.all([
      pool.query(
        'SELECT * FROM stores WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [userId, limit, offset]
      ),
      pool.query('SELECT COUNT(*) FROM stores WHERE user_id = $1', [userId])
    ]);

    const total = parseInt(countResult.rows[0].count, 10);

    return {
      stores: storesResult.rows,
      total,
      hasMore: offset + limit < total
    };
  }

  async getStoreById(id: string): Promise<Store | null> {
    const result = await pool.query('SELECT * FROM stores WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async updateStoreStatus(
    id: string,
    status: Store['status'],
    urls?: string,
    errorMessage?: string
  ): Promise<Store> {
    const result = await pool.query(
      `UPDATE stores
       SET status = $1, urls = $2, error_message = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [status, urls, errorMessage, id]
    );

    await this.addEvent(id, 'status_change', `Status changed to ${status}`);

    return result.rows[0];
  }

  async deleteStore(id: string): Promise<void> {
    await this.addEvent(id, 'deleting', 'Store deletion initiated');
    await pool.query('UPDATE stores SET status = $1 WHERE id = $2', ['deleting', id]);
  }

  async removeStore(id: string): Promise<void> {
    await pool.query('DELETE FROM stores WHERE id = $1', [id]);
  }

  async addEvent(storeId: string, eventType: string, message?: string, correlationId?: string): Promise<void> {
    await pool.query(
      'INSERT INTO store_events (store_id, event_type, message, correlation_id) VALUES ($1, $2, $3, $4)',
      [storeId, eventType, message, correlationId]
    );
  }

  async getStoreEvents(storeId: string): Promise<StoreEvent[]> {
    const result = await pool.query(
      'SELECT * FROM store_events WHERE store_id = $1 ORDER BY created_at DESC LIMIT 50',
      [storeId]
    );
    return result.rows;
  }

  async getStoreCountByUser(userId: string): Promise<number> {
    const result = await pool.query(
      "SELECT COUNT(*) as count FROM stores WHERE user_id = $1 AND status NOT IN ('failed', 'deleting')",
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  }
}

export default new StoreService();
