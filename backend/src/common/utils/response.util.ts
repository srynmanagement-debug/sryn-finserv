import { Response } from 'express';

export interface ApiResponseEnvelope<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code?: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Operation successful',
  statusCode = 200,
  meta?: ApiResponseEnvelope['meta']
) {
  const envelope: ApiResponseEnvelope<T> = {
    success: true,
    message,
    data,
    meta,
  };
  return res.status(statusCode).json(envelope);
}

export function sendError(
  res: Response,
  message = 'An error occurred',
  statusCode = 500,
  details?: any
) {
  const envelope: ApiResponseEnvelope = {
    success: false,
    message,
    error: {
      details,
    },
  };
  return res.status(statusCode).json(envelope);
}
