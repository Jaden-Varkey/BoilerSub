import type { RequestHandler } from "express";
import { sendSuccess } from "../lib/envelope.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import type { UsersService } from "../services/users.service.js";

function send<T>(res: Parameters<RequestHandler>[1], statusCode: number, data: T) {
  return sendSuccess(res, data, statusCode);
}

export function createUsersController(usersService: UsersService) {
  return {
    getUser: asyncHandler(async (req, res) => {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await usersService.getUserById(id);
      send(res, 200, result);
    }),

    updateMe: asyncHandler(async (req, res) => {
      const result = await usersService.updateMe(req.user!.id, req.body);
      send(res, 200, result);
    }),
  };
}
