import { Pool } from 'pg';
import logger from '../utils/logger';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'store_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  query_timeout: 30000,
  statement_timeout: 30000,
});

pool.on('error', (err) => {
  logger.error('Unexpected database error', {
    error: err.message,
    stack: err.stack,
    code: err.code
  });
  // DO NOT call process.exit() - let the service continue running
});

export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      return true;
    } finally {
      client.release();
    }
  } catch (error: any) {
    logger.error('Database health check failed', {
      error: error.message,
      code: error.code
    });
    return false;
  }
};

const runMigrations = async (client: any): Promise<void> => {
  // Create migrations table
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Check current version
  const versionResult = await client.query(
    'SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1'
  );
  const currentVersion = versionResult.rows[0]?.version || 0;

  logger.info('Current database schema version', { version: currentVersion });

  // Migration 1: Initial schema
  if (currentVersion < 1) {
    logger.info('Running migration 1: Initial schema');

    await client.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        engine VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        namespace VARCHAR(255) UNIQUE NOT NULL,
        urls TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_id VARCHAR(255) DEFAULT 'default-user',
        error_message TEXT
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS store_events (
        id SERIAL PRIMARY KEY,
        store_id VARCHAR(36) REFERENCES stores(id) ON DELETE CASCADE,
        event_type VARCHAR(100) NOT NULL,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      INSERT INTO schema_migrations (version) VALUES (1)
      ON CONFLICT (version) DO NOTHING
    `);
  }

  // Migration 2: Add idempotency and correlation tracking
  if (currentVersion < 2) {
    logger.info('Running migration 2: Idempotency and correlation tracking');

    await client.query(`
      ALTER TABLE stores
      ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255),
      ADD COLUMN IF NOT EXISTS correlation_id VARCHAR(255)
    `);

    await client.query(`
      ALTER TABLE store_events
      ADD COLUMN IF NOT EXISTS correlation_id VARCHAR(255)
    `);

    await client.query(`
      INSERT INTO schema_migrations (version) VALUES (2)
      ON CONFLICT (version) DO NOTHING
    `);
  }

  // Migration 3: Add constraints and indexes
  if (currentVersion < 3) {
    logger.info('Running migration 3: Constraints and indexes');

    // Add unique constraint for idempotency (ignore if exists)
    try {
      await client.query(`
        ALTER TABLE stores
        ADD CONSTRAINT unique_user_idempotency
        UNIQUE (user_id, idempotency_key)
      `);
    } catch (err: any) {
      if (err.code !== '42P07') throw err; // Ignore if constraint exists
    }

    // Add CHECK constraints (ignore if exists)
    try {
      await client.query(`
        ALTER TABLE stores
        ADD CONSTRAINT stores_engine_check
        CHECK (engine IN ('woocommerce', 'medusa'))
      `);
    } catch (err: any) {
      if (err.code !== '42P07') throw err;
    }

    try {
      await client.query(`
        ALTER TABLE stores
        ADD CONSTRAINT stores_status_check
        CHECK (status IN ('provisioning', 'ready', 'failed', 'deleting'))
      `);
    } catch (err: any) {
      if (err.code !== '42P07') throw err;
    }

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_stores_user_id ON stores(user_id);
      CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status);
      CREATE INDEX IF NOT EXISTS idx_stores_created_at ON stores(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_stores_idempotency_key
        ON stores(user_id, idempotency_key)
        WHERE idempotency_key IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_store_events_store_id ON store_events(store_id);
      CREATE INDEX IF NOT EXISTS idx_store_events_created_at ON store_events(created_at DESC);
    `);

    await client.query(`
      INSERT INTO schema_migrations (version) VALUES (3)
      ON CONFLICT (version) DO NOTHING
    `);
  }

  logger.info('Database migrations completed successfully');
};

export const initDatabase = async (maxRetries: number = 5): Promise<void> => {
  let retries = 0;
  let lastError: Error | null = null;

  while (retries < maxRetries) {
    try {
      const client = await pool.connect();
      try {
        await runMigrations(client);
        logger.info('Database initialized successfully');
        return;
      } finally {
        client.release();
      }
    } catch (error: any) {
      lastError = error;
      retries++;
      const waitTime = Math.min(1000 * Math.pow(2, retries), 10000);

      logger.warn('Database initialization failed, retrying', {
        attempt: retries,
        maxRetries,
        waitTime,
        error: error.message
      });

      if (retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  logger.error('Database initialization failed after max retries', {
    maxRetries,
    error: lastError?.message,
    stack: lastError?.stack
  });

  throw new Error(`Failed to initialize database after ${maxRetries} attempts`);
};

export default pool;
