import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import storeService from '../services/storeService';
import logger from '../utils/logger';
import { AppError, ValidationError, NotFoundError, RateLimitError, ErrorCode } from '../utils/errors';

const MAX_STORES_PER_USER = parseInt(process.env.MAX_STORES_PER_USER || '10');

export class StoreController {
  async createStore(req: Request, res: Response, next: NextFunction) {
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
    const idempotencyKey = req.headers['idempotency-key'] as string;

    try {
      const { name, engine } = req.body;
      const userId = req.headers['x-user-id'] as string || 'default-user';

      logger.info('Store creation request received', {
        correlationId,
        userId,
        name,
        engine,
        idempotencyKey
      });

      // Check store limit
      const storeCount = await storeService.getStoreCountByUser(userId);
      if (storeCount >= MAX_STORES_PER_USER) {
        throw new RateLimitError(`Maximum store limit (${MAX_STORES_PER_USER}) reached`);
      }

      const store = await storeService.createStoreWithTransaction({
        name,
        engine,
        user_id: userId,
        idempotency_key: idempotencyKey,
        correlation_id: correlationId
      });

      res.setHeader('x-correlation-id', correlationId);
      res.status(201).json({
        message: 'Store creation initiated',
        store,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getStores(req: Request, res: Response, next: NextFunction) {
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();

    try {
      const userId = req.headers['x-user-id'] as string || 'default-user';
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      logger.debug('Fetching stores', {
        correlationId,
        userId,
        limit,
        offset
      });

      // Validate pagination parameters
      if (limit < 1 || limit > 100) {
        throw new ValidationError('Limit must be between 1 and 100');
      }

      if (offset < 0) {
        throw new ValidationError('Offset must be non-negative');
      }

      const result = await storeService.getStoresWithPagination(userId, limit, offset);

      res.setHeader('x-correlation-id', correlationId);
      res.json({
        stores: result.stores,
        pagination: {
          total: result.total,
          limit,
          offset,
          hasMore: result.hasMore
        }
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getStore(req: Request, res: Response, next: NextFunction) {
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();

    try {
      const { id } = req.params;

      logger.debug('Fetching store', {
        correlationId,
        storeId: id
      });

      const store = await storeService.getStoreById(id);

      if (!store) {
        throw new NotFoundError('Store not found');
      }

      res.setHeader('x-correlation-id', correlationId);
      res.json({ store });
    } catch (error: any) {
      next(error);
    }
  }

  async deleteStore(req: Request, res: Response, next: NextFunction) {
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();

    try {
      const { id } = req.params;

      logger.info('Store deletion request received', {
        correlationId,
        storeId: id
      });

      const store = await storeService.getStoreById(id);

      if (!store) {
        throw new NotFoundError('Store not found');
      }

      await storeService.deleteStore(id);

      res.setHeader('x-correlation-id', correlationId);
      res.json({
        message: 'Store deletion initiated',
        store_id: id
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getStoreEvents(req: Request, res: Response, next: NextFunction) {
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();

    try {
      const { id } = req.params;

      logger.debug('Fetching store events', {
        correlationId,
        storeId: id
      });

      const events = await storeService.getStoreEvents(id);

      res.setHeader('x-correlation-id', correlationId);
      res.json({ events });
    } catch (error: any) {
      next(error);
    }
  }

  async healthCheck(req: Request, res: Response) {
    try {
      const dbHealthy = await import('../config/database').then(m => m.checkDatabaseHealth());

      if (dbHealthy) {
        res.json({
          status: 'healthy',
          database: 'connected',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(503).json({
          status: 'unhealthy',
          database: 'disconnected',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error: any) {
      res.status(503).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async livenessCheck(req: Request, res: Response) {
    res.json({
      status: 'alive',
      timestamp: new Date().toISOString()
    });
  }

  async readinessCheck(req: Request, res: Response) {
    try {
      const dbHealthy = await import('../config/database').then(m => m.checkDatabaseHealth());

      if (dbHealthy) {
        res.json({
          status: 'ready',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(503).json({
          status: 'not ready',
          reason: 'database unavailable',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error: any) {
      res.status(503).json({
        status: 'not ready',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

export default new StoreController();
