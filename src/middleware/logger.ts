import type { RequestHandler } from "express";
import { logger } from "../lib/logger.js";

export const requestLogger: RequestHandler = (req, res, next) => {
  const startedAt = Date.now();

  logger.info("request_started", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
  });

  res.on("finish", () => {
    logger.info("request_finished", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      userId: req.user?.id,
    });
  });

  next();
};
