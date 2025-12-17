import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { ERROR_CODES } from '../constants/errorCodes';

/**
 * Validation middleware factory
 * Creates a middleware that validates request body against a Zod schema
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate and parse the request body
      const validated = schema.parse(req.body);

      // Replace req.body with validated data (typed)
      req.body = validated;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors into a readable format
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        // Create a custom error with validation details
        const validationError = new AppError({
          ...ERROR_CODES.VALIDATION_ERROR,
          message: 'Validation failed',
          details: errors,
        });
        next(validationError);
      } else {
        next(error);
      }
    }
  };
};
