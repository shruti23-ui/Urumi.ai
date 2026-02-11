import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const correlationId = req.headers['x-correlation-id'] as string;

  if (err instanceof AppError) {
    logger.error('Application error', {
      correlation_id: correlationId,
      error_code: err.code,
      message: err.message,
      status_code: err.statusCode,
      details: err.details,
      path: req.path,
      method: req.method
    });

    res.status(err.statusCode).json(err.toJSON());
    return;
  }

  logger.error('Unexpected error', {
    correlation_id: correlationId,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message
    }
  });
};
