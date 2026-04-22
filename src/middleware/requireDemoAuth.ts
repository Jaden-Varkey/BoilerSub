import type { RequestHandler } from "express";
import { getDemoData } from "../data/demoStore.js";
import { ApiError } from "../lib/apiError.js";
import type { UserRepository } from "../repositories/user.repository.js";

export function createRequireDemoAuth(deps: {
  userRepository: UserRepository;
}): RequestHandler {
  return async (req, _res, next) => {
    try {
      const header = req.headers.authorization;
      const accessToken = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

      if (!accessToken) {
        throw new ApiError(401, "unauthorized", "Missing authorization token");
      }

      const session = getDemoData().sessions.find((entry) => entry.access_token === accessToken);
      if (!session) {
        throw new ApiError(401, "unauthorized", "Invalid token");
      }

      const user = await deps.userRepository.findById(session.user_id);
      if (!user) {
        throw new ApiError(401, "unauthorized", "User not found for session");
      }

      req.auth = { accessToken, userId: user.id };
      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
}
