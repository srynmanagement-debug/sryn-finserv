import { Request, Response, NextFunction } from 'express';
import { AppError } from '../common/errors/app-error';
import { sendError } from '../common/utils/response.util';
import { logger } from '../common/utils/logger';

export function errorMiddleware(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    logger.warn(`AppError (${err.statusCode}): ${err.message}`);
    return sendError(res, err.message, err.statusCode);
  }

  logger.error('Unhandled Application Exception:', err);
  return sendError(res, 'Internal Server Error', 500);
}
