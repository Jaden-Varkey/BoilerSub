import type { RequestHandler } from "express";
import { ApiError } from "../lib/apiError.js";

export const requireVerified: RequestHandler = (req, _res, next) => {
  if (!req.user) {
    next(new ApiError(401, "unauthorized", "Authentication required"));
    return;
  }

  if (!req.user.fully_verified) {
    next(new ApiError(403, "verification_required", "Fully verified account required"));
    return;
  }

  next();
};
