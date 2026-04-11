import { Router } from "express";
import { createAuthController } from "../controllers/auth.controller.js";
import { createRateLimit } from "../middleware/rateLimit.js";
import { createValidator } from "../middleware/validate.js";
import {
  loginSchema,
  resendEmailOtpSchema,
  resendPhoneOtpSchema,
  sendPhoneOtpSchema,
  signupSchema,
  verifyEmailSchema,
  verifyPhoneSchema,
} from "../schemas/auth.schema.js";
import type { AuthService } from "../services/auth.service.js";

export function createAuthRouter(deps: {
  authService: AuthService;
  requireAuthMiddleware: import("express").RequestHandler;
}) {
  const router = Router();
  const controller = createAuthController(deps.authService);

  router.post(
    "/signup",
    createRateLimit({
      key: (req) => req.ip,
      maxRequests: 10,
      windowMs: 60 * 60 * 1000,
      code: "signup_rate_limited",
      message: "Too many signup attempts",
    }),
    createValidator(signupSchema),
    controller.signup,
  );

  router.post(
    "/verify-email",
    createRateLimit({
      key: (req) => req.body.email,
      maxRequests: 5,
      windowMs: 10 * 60 * 1000,
      code: "email_verify_rate_limited",
      message: "Too many email verification attempts",
    }),
    createValidator(verifyEmailSchema),
    controller.verifyEmail,
  );

  router.post(
    "/phone/send-otp",
    deps.requireAuthMiddleware,
    createRateLimit({
      key: (req) => req.body.phone,
      maxRequests: 3,
      windowMs: 10 * 60 * 1000,
      code: "phone_otp_rate_limited",
      message: "Too many phone OTP requests",
    }),
    createValidator(sendPhoneOtpSchema),
    controller.sendPhoneOtp,
  );

  router.post(
    "/verify-phone",
    createRateLimit({
      key: (req) => req.body.phone,
      maxRequests: 5,
      windowMs: 10 * 60 * 1000,
      code: "phone_verify_rate_limited",
      message: "Too many phone verification attempts",
    }),
    createValidator(verifyPhoneSchema),
    controller.verifyPhone,
  );

  router.post(
    "/login",
    createRateLimit({
      key: (req) => req.ip,
      maxRequests: 10,
      windowMs: 5 * 60 * 1000,
      code: "login_rate_limited",
      message: "Too many login attempts",
    }),
    createValidator(loginSchema),
    controller.login,
  );

  router.post("/logout", deps.requireAuthMiddleware, controller.logout);

  router.post(
    "/resend-email-otp",
    createRateLimit({
      key: (req) => req.body.email,
      maxRequests: 3,
      windowMs: 10 * 60 * 1000,
      code: "email_otp_resend_rate_limited",
      message: "Too many email OTP resend attempts",
    }),
    createValidator(resendEmailOtpSchema),
    controller.resendEmailOtp,
  );

  router.post(
    "/resend-phone-otp",
    createRateLimit({
      key: (req) => req.body.phone,
      maxRequests: 3,
      windowMs: 10 * 60 * 1000,
      code: "phone_otp_resend_rate_limited",
      message: "Too many phone OTP resend attempts",
    }),
    createValidator(resendPhoneOtpSchema),
    controller.resendPhoneOtp,
  );

  router.get("/me", deps.requireAuthMiddleware, controller.me);

  return router;
}
