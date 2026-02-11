import dotenv from 'dotenv';
import reconciler from './services/reconciler';
import pool from './config/database';

dotenv.config();

const MIN_POLL_INTERVAL = parseInt(process.env.MIN_POLL_INTERVAL_MS || '5000');
const MAX_POLL_INTERVAL = parseInt(process.env.MAX_POLL_INTERVAL_MS || '30000');

let currentPollInterval = MIN_POLL_INTERVAL;
let pollTimeout: NodeJS.Timeout | null = null;
let isShuttingDown = false;

async function poll() {
  if (isShuttingDown) {
    console.log('Shutdown in progress, skipping poll');
    return;
  }

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

  if (!isShuttingDown) {
    pollTimeout = setTimeout(poll, currentPollInterval);
  }
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

const gracefulShutdown = async (signal: string) => {
  console.log(`${signal} received, shutting down gracefully...`);
  isShuttingDown = true;

  // Clear pending poll timeout
  if (pollTimeout) {
    clearTimeout(pollTimeout);
    console.log('Stopped poll loop');
  }

  try {
    // Close database connections
    await pool.end();
    console.log('Database connections closed');
    process.exit(0);
  } catch (error: any) {
    console.error('Error during shutdown:', error.message);
    process.exit(1);
  }

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
