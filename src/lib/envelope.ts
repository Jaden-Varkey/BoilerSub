import type { Response } from 'express';

export type SuccessEnvelope<T> = {
  success: true;
  data: T;
};

export type ErrorEnvelope = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function successEnvelope<T>(data: T): SuccessEnvelope<T> {
  return { success: true, data };
}

export function errorEnvelope(code: string, message: string, details?: unknown): ErrorEnvelope {
  const error: ErrorEnvelope['error'] = { code, message };
  if (details !== undefined) {
    error.details = details;
  }
  return { success: false, error };
}

export function sendSuccess<T>(res: Response, data: T, status = 200): Response {
  return res.status(status).json(successEnvelope(data));
}

export function sendError(res: Response, code: string, message: string, status = 500, details?: unknown): Response {
  return res.status(status).json(errorEnvelope(code, message, details));
}
