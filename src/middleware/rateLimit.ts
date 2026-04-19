import type { Request, RequestHandler } from "express";
import { ApiError } from "../lib/apiError.js";
import { rateLimiter } from "../lib/rateLimiter.js";

export function createRateLimit(options: {
  key: (req: Request) => string | undefined | null;
  maxRequests: number;
  windowMs: number;
  code: string;
  message: string;
}): RequestHandler {
  return (req, _res, next) => {
    const key = options.key(req) || req.ip || "unknown";
    const allowed = rateLimiter.checkLimit(key, options.maxRequests, options.windowMs);

    if (!allowed) {
      next(new ApiError(429, options.code, options.message));
      return;
    }

    next();
  };
}
