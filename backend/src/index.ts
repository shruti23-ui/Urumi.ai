import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { initDatabase } from './config/database';
import storeController from './controllers/storeController';
import { globalRateLimiter, createStoreRateLimiter } from './middleware/rateLimiter';
import { validateCreateStore, validateStoreId, validateRequestSize } from './middleware/validation';
import { errorHandler } from './middleware/errorHandler';
import logger from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-user-id', 'x-correlation-id'],
}));

app.use(express.json({ limit: '1mb' }));
app.use(validateRequestSize);

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

// Health checks (MUST be before rate limiter to avoid 429 errors from probes)
app.get('/health', storeController.healthCheck.bind(storeController));
app.get('/health/live', storeController.livenessCheck.bind(storeController));
app.get('/health/ready', storeController.readinessCheck.bind(storeController));

// Global rate limiter (applied to all routes except health checks above)
app.use(globalRateLimiter);

// API routes
app.post('/api/stores', createStoreRateLimiter, validateCreateStore,
  storeController.createStore.bind(storeController));

app.get('/api/stores', storeController.getStores.bind(storeController));

app.get('/api/stores/:id', validateStoreId, storeController.getStore.bind(storeController));

app.delete('/api/stores/:id', validateStoreId, storeController.deleteStore.bind(storeController));

app.get('/api/stores/:id/events', validateStoreId, storeController.getStoreEvents.bind(storeController));

// Error handler (must be last!)
app.use(errorHandler);

// Start server
let server: any;
const startServer = async () => {
  try {
    await initDatabase();
    server = app.listen(PORT, () => {
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

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');

      try {
        // Close database connections
        const pool = (await import('./config/database')).default;
        await pool.end();
        logger.info('Database connections closed');
        process.exit(0);
      } catch (error: any) {
        logger.error('Error during shutdown', { error: error.message });
        process.exit(1);
      }
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
