import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { initDatabase } from './config/database';
import storeController from './controllers/storeController';
import { globalRateLimiter, createStoreRateLimiter } from './middleware/rateLimiter';
import { validateCreateStore } from './middleware/validation';
import { errorHandler } from './middleware/errorHandler';
import logger from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Correlation ID middleware
app.use((req, res, next) => {
  const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();
  req.headers['x-correlation-id'] = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      correlationId: req.headers['x-correlation-id'],
      userAgent: req.headers['user-agent']
    });
  });
  next();
});

// Global rate limiter
app.use(globalRateLimiter);

// Health checks (before other routes)
app.get('/health', storeController.healthCheck.bind(storeController));
app.get('/health/live', storeController.livenessCheck.bind(storeController));
app.get('/health/ready', storeController.readinessCheck.bind(storeController));

// API routes
app.post('/api/stores', createStoreRateLimiter, validateCreateStore,
  storeController.createStore.bind(storeController));

app.get('/api/stores', storeController.getStores.bind(storeController));

app.get('/api/stores/:id', storeController.getStore.bind(storeController));

app.delete('/api/stores/:id', storeController.deleteStore.bind(storeController));

app.get('/api/stores/:id/events', storeController.getStoreEvents.bind(storeController));

// Error handler (must be last!)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      logger.info('Platform API started', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version
      });
    });
  } catch (error: any) {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();
