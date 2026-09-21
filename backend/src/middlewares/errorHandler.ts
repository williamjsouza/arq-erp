import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode = 400, code = 'BAD_REQUEST') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  if (err instanceof AppError) {
    logger.warn(`AppError [${err.code}]: ${err.message} - Path: ${req.originalUrl}`);
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }

  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: 'Dados de entrada inválidos',
      code: 'VALIDATION_ERROR',
      errors: formattedErrors,
    });
  }

  logger.error(`InternalServerError: ${err.message}`, { stack: err.stack, path: req.originalUrl, body: req.body });

  return res.status(500).json({
    success: false,
    message: 'Ocorreu um erro interno no servidor. Tente novamente mais tarde.',
    code: 'INTERNAL_SERVER_ERROR',
    ...(env.NODE_ENV === 'development' ? { detail: err.message, stack: err.stack } : {}),
  });
}
