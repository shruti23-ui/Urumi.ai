import { v4 as uuidv4 } from 'uuid';
import pool from '../../config/database';
import { StoreService } from '../../services/storeService';

describe('StoreService', () => {
  let storeService: StoreService;
  const testUserId = 'test-user-' + uuidv4();

  beforeAll(async () => {
    storeService = new StoreService();
    // Initialize test database
    await pool.query('DELETE FROM stores WHERE user_id LIKE $1', ['test-user-%']);
  });

  afterAll(async () => {
    // Cleanup
    await pool.query('DELETE FROM stores WHERE user_id LIKE $1', ['test-user-%']);
    await pool.end();
  });

  describe('createStore', () => {
    it('should create a store successfully', async () => {
      const store = await storeService.createStore({
        name: 'Test Store',
        engine: 'woocommerce',
        user_id: testUserId,
      });

      expect(store).toBeDefined();
      expect(store.id).toBeDefined();
      expect(store.name).toBe('Test Store');
      expect(store.engine).toBe('woocommerce');
      expect(store.status).toBe('provisioning');
      expect(store.namespace).toMatch(/^store-test-store-[a-z0-9]{8}$/);
      expect(store.user_id).toBe(testUserId);
    });

    it('should sanitize store name in namespace', async () => {
      const store = await storeService.createStore({
        name: 'Test Store With Spaces!',
        engine: 'woocommerce',
        user_id: testUserId,
      });

      expect(store.namespace).toMatch(/^store-test-store-with-spaces-[a-z0-9]{8}$/);
    });

    it('should enforce idempotency with idempotency key', async () => {
      const idempotencyKey = uuidv4();

      const store1 = await storeService.createStoreWithTransaction({
        name: 'Idempotent Store',
        engine: 'woocommerce',
        user_id: testUserId,
        idempotency_key: idempotencyKey,
      });

      const store2 = await storeService.createStoreWithTransaction({
        name: 'Different Store',
        engine: 'medusa',
        user_id: testUserId,
        idempotency_key: idempotencyKey,
      });

      expect(store1.id).toBe(store2.id);
      expect(store2.name).toBe('Idempotent Store'); // Should return first store
    });
  });

  describe('getStoreCountByUser', () => {
    it('should return correct count', async () => {
      const userId = 'count-test-' + uuidv4();

      // Create 3 stores
      await Promise.all([
        storeService.createStore({ name: 'Store 1', engine: 'woocommerce', user_id: userId }),
        storeService.createStore({ name: 'Store 2', engine: 'woocommerce', user_id: userId }),
        storeService.createStore({ name: 'Store 3', engine: 'woocommerce', user_id: userId }),
      ]);

      const count = await storeService.getStoreCountByUser(userId);
      expect(count).toBe(3);
    });

    it('should not count failed stores', async () => {
      const userId = 'failed-test-' + uuidv4();

      const store = await storeService.createStore({
        name: 'Failed Store',
        engine: 'woocommerce',
        user_id: userId,
      });

      await storeService.updateStoreStatus(store.id, 'failed', undefined, 'Test error');

      const count = await storeService.getStoreCountByUser(userId);
      expect(count).toBe(0);
    });
  });

  describe('getStoresWithPagination', () => {
    it('should paginate results correctly', async () => {
      const userId = 'pagination-test-' + uuidv4();

      // Create 5 stores
      for (let i = 0; i < 5; i++) {
        await storeService.createStore({
          name: `Paginated Store ${i}`,
          engine: 'woocommerce',
          user_id: userId,
        });
      }

      const page1 = await storeService.getStoresWithPagination(userId, 2, 0);
      expect(page1.stores.length).toBe(2);
      expect(page1.total).toBe(5);
      expect(page1.hasMore).toBe(true);

      const page2 = await storeService.getStoresWithPagination(userId, 2, 2);
      expect(page2.stores.length).toBe(2);
      expect(page2.hasMore).toBe(true);

      const page3 = await storeService.getStoresWithPagination(userId, 2, 4);
      expect(page3.stores.length).toBe(1);
      expect(page3.hasMore).toBe(false);
    });
  });

  describe('deleteStore', () => {
    it('should set status to deleting', async () => {
      const store = await storeService.createStore({
        name: 'To Delete',
        engine: 'woocommerce',
        user_id: testUserId,
      });

      await storeService.deleteStore(store.id);

      const updated = await storeService.getStoreById(store.id);
      expect(updated?.status).toBe('deleting');
    });
  });

  describe('addEvent', () => {
    it('should add event with correlation ID', async () => {
      const store = await storeService.createStore({
        name: 'Event Test',
        engine: 'woocommerce',
        user_id: testUserId,
      });

      const correlationId = uuidv4();
      await storeService.addEvent(store.id, 'test_event', 'Test message', correlationId);

      const events = await storeService.getStoreEvents(store.id);
      const event = events.find(e => e.event_type === 'test_event');

      expect(event).toBeDefined();
      expect(event?.message).toBe('Test message');
      expect(event?.correlation_id).toBe(correlationId);
    });
  });

  describe('input validation', () => {
    it('should reject invalid engine', async () => {
      await expect(
        pool.query(
          `INSERT INTO stores (id, name, engine, status, namespace, user_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [uuidv4(), 'Test', 'invalid' as any, 'provisioning', 'test-ns', testUserId]
        )
      ).rejects.toThrow();
    });

    it('should reject invalid status', async () => {
      await expect(
        pool.query(
          `INSERT INTO stores (id, name, engine, status, namespace, user_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [uuidv4(), 'Test', 'woocommerce', 'invalid' as any, 'test-ns', testUserId]
        )
      ).rejects.toThrow();
    });

    it('should reject duplicate namespace', async () => {
      const namespace = 'duplicate-ns-' + uuidv4();

      await pool.query(
        `INSERT INTO stores (id, name, engine, status, namespace, user_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [uuidv4(), 'Test 1', 'woocommerce', 'provisioning', namespace, testUserId]
      );

      await expect(
        pool.query(
          `INSERT INTO stores (id, name, engine, status, namespace, user_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [uuidv4(), 'Test 2', 'woocommerce', 'provisioning', namespace, testUserId]
        )
      ).rejects.toThrow();
    });
  });
});
