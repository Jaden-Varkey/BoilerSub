import type { RequestHandler } from "express";
import { ApiError } from "../lib/apiError.js";

type Permission = "read" | "write" | "delete" | "admin";

const permissions: Record<"admin" | "user", Permission[]> = {
  admin: ["read", "write", "delete", "admin"],
  user: ["read", "write"],
};

export function createRequirePermission(permission: Permission): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(new ApiError(401, "unauthorized", "Authentication required"));
      return;
    }

    if (!permissions[req.user.role].includes(permission)) {
      next(new ApiError(403, "forbidden", "Insufficient permissions"));
      return;
    }

    next();
  };
}
