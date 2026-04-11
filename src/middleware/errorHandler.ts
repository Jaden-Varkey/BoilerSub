import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { ApiError } from "../lib/apiError.js";
import { logger } from "../lib/logger.js";

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.toBody(),
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: "validation_failed",
        message: "Validation failed",
        details: error.flatten(),
      },
    });
    return;
  }

  logger.error("unhandled_error", {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

  res.status(500).json({
    success: false,
    error: {
      code: "internal_server_error",
      message: "Internal server error",
    },
  });
};
