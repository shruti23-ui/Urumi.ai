import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateCreateStore = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Store name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z0-9-_ ]+$/)
    .withMessage('Store name can only contain letters, numbers, spaces, hyphens, and underscores'),
  body('engine')
    .isIn(['woocommerce', 'medusa'])
    .withMessage('Engine must be either woocommerce or medusa'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
