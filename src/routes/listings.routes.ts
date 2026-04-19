import { Router } from "express";
import { createListingsController } from "../controllers/listings.controller.js";
import { createValidator } from "../middleware/validate.js";
import { listingCreateSchema, listingIdSchema, listingListQuerySchema, listingUpdateSchema } from "../schemas/listings.schema.js";
import type { ListingsService } from "../services/listings.service.js";

export function createListingsRouter(deps: {
  listingsService: ListingsService;
  requireAuthMiddleware: import("express").RequestHandler;
  requireVerifiedMiddleware: import("express").RequestHandler;
}): Router {
  const router = Router();
  const controller = createListingsController(deps.listingsService);

  router.get("/", deps.requireAuthMiddleware, createValidator(listingListQuerySchema, "query"), controller.list);
  router.get("/:id", deps.requireAuthMiddleware, createValidator(listingIdSchema, "params"), controller.getById);
  router.post(
    "/",
    deps.requireAuthMiddleware,
    deps.requireVerifiedMiddleware,
    createValidator(listingCreateSchema),
    controller.create,
  );
  router.patch(
    "/:id",
    deps.requireAuthMiddleware,
    deps.requireVerifiedMiddleware,
    createValidator(listingIdSchema, "params"),
    createValidator(listingUpdateSchema),
    controller.update,
  );
  router.delete(
    "/:id",
    deps.requireAuthMiddleware,
    deps.requireVerifiedMiddleware,
    createValidator(listingIdSchema, "params"),
    controller.delete,
  );

  return router;
}
