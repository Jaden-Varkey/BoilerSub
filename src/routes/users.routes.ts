import { Router } from "express";
import { createUsersController } from "../controllers/users.controller.js";
import { createValidator } from "../middleware/validate.js";
import { updateMeSchema, userIdParamSchema } from "../schemas/users.schema.js";
import type { UsersService } from "../services/users.service.js";

export function createUsersRouter(deps: {
  usersService: UsersService;
  requireAuthMiddleware: import("express").RequestHandler;
  requireVerifiedMiddleware: import("express").RequestHandler;
}) {
  const router = Router();
  const controller = createUsersController(deps.usersService);

  router.get("/:id", deps.requireAuthMiddleware, createValidator(userIdParamSchema, "params"), controller.getUser);
  router.patch(
    "/me",
    deps.requireAuthMiddleware,
    deps.requireVerifiedMiddleware,
    createValidator(updateMeSchema),
    controller.updateMe,
  );

  return router;
}
