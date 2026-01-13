import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let code = 'INTERNAL_SERVER_ERROR';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code || code;
  } else {
    console.error('Unexpected Error:', err);
  }

  res.status(statusCode).json({
    status: statusCode,
    message,
    code,
    data: null,
    // Only send stack in dev
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    ...(err instanceof AppError && err.details && { details: err.details }),
  });
};
