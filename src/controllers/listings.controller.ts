import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../lib/apiError.js";
import { sendSuccess } from "../lib/envelope.js";
import { listingCreateSchema, listingIdSchema, listingListQuerySchema, listingUpdateSchema } from "../schemas/listings.schema.js";
import type { ListingsService } from "../services/listings.service.js";
import type { RequestUser } from "../types/index.js";

type RequestWithUser = Request & {
  user?: RequestUser;
};

function respond<T>(res: Response, data: T): void {
  sendSuccess(res, data);
}

export function createListingsController(listingsService: ListingsService) {
  return {
    list: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const request = req as RequestWithUser;
        const input = listingListQuerySchema.parse(req.query);
        respond(res, await listingsService.list(input, request.user));
      } catch (error) {
        next(error);
      }
    },

    getById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { id } = listingIdSchema.parse(req.params);
        respond(res, await listingsService.getById(id));
      } catch (error) {
        next(error);
      }
    },

    create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const request = req as RequestWithUser;
        const input = listingCreateSchema.parse(req.body);
        if (!request.user) {
          throw new ApiError(401, "unauthorized", "Missing authenticated user");
        }
        respond(res, await listingsService.create(request.user, input));
      } catch (error) {
        next(error);
      }
    },

    update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const request = req as RequestWithUser;
        const { id } = listingIdSchema.parse(req.params);
        const input = listingUpdateSchema.parse(req.body);
        if (!request.user) {
          throw new ApiError(401, "unauthorized", "Missing authenticated user");
        }
        respond(res, await listingsService.update(request.user, id, input));
      } catch (error) {
        next(error);
      }
    },

    delete: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const request = req as RequestWithUser;
        const { id } = listingIdSchema.parse(req.params);
        if (!request.user) {
          throw new ApiError(401, "unauthorized", "Missing authenticated user");
        }
        await listingsService.delete(request.user, id);
        respond(res, { status: "deleted" });
      } catch (error) {
        next(error);
      }
    },
  };
}
