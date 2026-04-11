import type { RequestHandler } from "express";
import { sendSuccess } from "../lib/envelope.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import type { AuthenticatedRequest } from "../types/index.js";
import type { AuthService } from "../services/auth.service.js";

function send<T>(res: Parameters<RequestHandler>[1], statusCode: number, data: T) {
  return sendSuccess(res, data, statusCode);
}

export function createAuthController(authService: AuthService) {
  return {
    signup: asyncHandler(async (req, res) => {
      const result = await authService.signup(req.body.email, req.body.password);
      send(res, 201, result);
    }),

    verifyEmail: asyncHandler(async (req, res) => {
      const result = await authService.verifyEmail(req.body.email, req.body.token);
      send(res, 200, result);
    }),

    sendPhoneOtp: asyncHandler(async (req, res) => {
      const result = await authService.sendPhoneOtp({
        accessToken: req.auth?.accessToken ?? "",
        phone: req.body.phone,
      });
      send(res, 200, result);
    }),

    verifyPhone: asyncHandler(async (req, res) => {
      const result = await authService.verifyPhone(req.body.phone, req.body.token);
      send(res, 200, result);
    }),

    login: asyncHandler(async (req, res) => {
      const result = await authService.login(req.body.email, req.body.password);
      send(res, 200, result);
    }),

    logout: asyncHandler(async (req, res) => {
      const result = await authService.logout(req.auth?.accessToken ?? "");
      send(res, 200, result);
    }),

    resendEmailOtp: asyncHandler(async (req, res) => {
      const result = await authService.resendEmailOtp(req.body.email);
      send(res, 200, result);
    }),

    resendPhoneOtp: asyncHandler(async (req, res) => {
      const result = await authService.resendPhoneOtp(req.body.phone);
      send(res, 200, result);
    }),

    me: asyncHandler(async (req, res) => {
      send(res, 200, { user: (req as AuthenticatedRequest).user });
    }),
  };
}
