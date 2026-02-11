import dotenv from 'dotenv';
import reconciler from './services/reconciler';
import pool from './config/database';

dotenv.config();

const MIN_POLL_INTERVAL = parseInt(process.env.MIN_POLL_INTERVAL_MS || '5000');
const MAX_POLL_INTERVAL = parseInt(process.env.MAX_POLL_INTERVAL_MS || '30000');

let currentPollInterval = MIN_POLL_INTERVAL;

async function poll() {
  try {
    const hasWork = await reconciler.reconcile();

    // Adaptive polling: back off if no work, speed up if work found
    if (!hasWork) {
      currentPollInterval = Math.min(currentPollInterval * 1.5, MAX_POLL_INTERVAL);
    } else {
      currentPollInterval = MIN_POLL_INTERVAL;
    }

    console.log(`Next poll in ${Math.round(currentPollInterval / 1000)}s`);
  } catch (error: any) {
    console.error('Reconciliation loop error:', error);
    // Slow down on errors
    currentPollInterval = Math.min(currentPollInterval * 1.2, MAX_POLL_INTERVAL);
  }

  setTimeout(poll, currentPollInterval);
}

async function main() {
  console.log('Store Platform Orchestrator starting...');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Poll interval: ${MIN_POLL_INTERVAL}ms - ${MAX_POLL_INTERVAL}ms (adaptive)`);

  // Test database connection
  try {
    await pool.query('SELECT NOW()');
    console.log('Database connection successful');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }

  // Start reconciliation loop with adaptive polling
  console.log('Starting reconciliation loop...');
  poll();
}

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  pool.end().then(() => {
    console.log('Database connections closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  pool.end().then(() => {
    console.log('Database connections closed');
    process.exit(0);
  });
});

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
