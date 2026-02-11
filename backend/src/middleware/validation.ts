import { body, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// Validation error handler middleware
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation failed', {
      path: req.path,
      method: req.method,
      errors: errors.array(),
      correlationId: req.headers['x-correlation-id']
    });
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

export const validateCreateStore = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Store name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z0-9-_ ]+$/)
    .withMessage('Store name can only contain letters, numbers, spaces, hyphens, and underscores')
    .customSanitizer((value) => {
      // Prevent XSS and SQL injection attempts
      return value.replace(/[<>'"]/g, '');
    }),
  body('engine')
    .isIn(['woocommerce', 'medusa'])
    .withMessage('Engine must be either woocommerce or medusa'),
  handleValidationErrors,
];

export const validateStoreId = [
  param('id')
    .isUUID(4)
    .withMessage('Store ID must be a valid UUID'),
  handleValidationErrors,
];

// Generic request body size validator
export const validateRequestSize = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = req.headers['content-length'];
  const maxSize = 1024 * 1024; // 1MB

  if (contentLength && parseInt(contentLength) > maxSize) {
    logger.warn('Request body too large', {
      contentLength,
      maxSize,
      path: req.path,
      correlationId: req.headers['x-correlation-id']
    });
    return res.status(413).json({
      error: 'Request body too large',
      maxSize: '1MB'
    });
  }
  next();
};
