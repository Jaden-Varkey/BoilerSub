import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodTypeAny } from 'zod';
import { ApiError } from './apiError.js';
import { sendError, sendSuccess } from './envelope.js';

export function requestIdFrom(req: Request): string {
  return (req as Request & { requestId?: string }).requestId ?? 'unknown';
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',').at(0)?.trim() ?? 'unknown';
  }

  return req.ip || req.socket.remoteAddress || 'unknown';
}

export function createRequestLogger(req: Request) {
  return {
    requestId: requestIdFrom(req),
    method: req.method,
    path: req.originalUrl,
  };
}

export function validateBody<T extends ZodTypeAny>(schema: T, body: unknown) {
  return schema.parse(body) as ReturnType<T['parse']>;
}

export function asyncHandler(handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    void handler(req, res, next).catch(next);
  };
}

export function errorMiddleware(error: unknown, req: Request, res: Response, _next: NextFunction) {
  const requestId = requestIdFrom(req);

  if (error instanceof ApiError) {
    const apiError = error as ApiError;
    return sendError(res, apiError.code, apiError.message, apiError.statusCode);
  }

  if (error instanceof ZodError) {
    return sendError(res, 'VALIDATION_ERROR', 'Validation failed', 400, error.flatten());
  }

  return sendError(res, 'INTERNAL_SERVER_ERROR', 'Internal server error', 500, { requestId });
}

export { sendError, sendSuccess };
