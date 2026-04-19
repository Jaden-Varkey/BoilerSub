import type { SupabaseClient } from "@supabase/supabase-js";
import type { RequestHandler } from "express";
import { ApiError } from "../lib/apiError.js";
import type { UserRepository } from "../repositories/user.repository.js";

export function createRequireAuth(deps: {
  supabase: SupabaseClient;
  userRepository: UserRepository;
}): RequestHandler {
  return async (req, _res, next) => {
    try {
      const header = req.headers.authorization;
      const accessToken = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

      if (!accessToken) {
        throw new ApiError(401, "unauthorized", "Missing authorization token");
      }

      const { data, error } = await deps.supabase.auth.getUser(accessToken);
      if (error || !data.user) {
        throw new ApiError(401, "unauthorized", error?.message ?? "Invalid token");
      }

      const user = await deps.userRepository.upsertAuthUser({
        id: data.user.id,
        email: data.user.email ?? "",
        phone: data.user.phone ?? null,
      });

      req.auth = { accessToken, userId: data.user.id };
      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
}
