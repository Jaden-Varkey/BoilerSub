import {
  forgotPasswordSchema,
  changePasswordSchema,
  loginSchema,
  resetPasswordSchema,
  resendEmailOtpSchema,
  resendPhoneOtpSchema,
  sendPhoneOtpSchema,
  signupSchema,
  verifyEmailSchema,
  verifyPhoneSchema,
} from "../schemas/auth.schema";
import { listingCreateSchema, listingIdSchema, listingListQuerySchema, listingUpdateSchema } from "../schemas/listings.schema";
import { updateMeSchema, userIdParamSchema } from "../schemas/users.schema";
import { authService, listingsService, usersService } from "./container";
import {
  assertVerified,
  authenticate,
  checkRateLimit,
  errorResponse,
  getClientIp,
  handleRequest,
  readJsonBody,
  successResponse,
} from "./http";

type RouteResult = Response;

function notFound(requestId: string): RouteResult {
  return errorResponse(requestId, 404, "not_found", "Route not found");
}

async function handleAuth(
  request: Request,
  requestId: string,
  context: { userId?: string },
  segments: string[],
): Promise<RouteResult> {
  const action = segments[1];

  switch (action) {
    case "signup": {
      if (request.method !== "POST") {
        return notFound(requestId);
      }

      checkRateLimit({
        key: getClientIp(request),
        maxRequests: 10,
        windowMs: 60 * 60 * 1000,
        code: "signup_rate_limited",
        message: "Too many signup attempts",
      });

      const body = signupSchema.parse(await readJsonBody(request));
      const result = await authService.signup(body.email, body.password);
      return successResponse(requestId, 201, result);
    }

    case "verify-email": {
      if (request.method !== "POST") {
        return notFound(requestId);
      }

      const body = await readJsonBody(request);
      checkRateLimit({
        key: String((body as { email?: string }).email ?? ""),
        maxRequests: 5,
        windowMs: 10 * 60 * 1000,
        code: "email_verify_rate_limited",
        message: "Too many email verification attempts",
      });
      const input = verifyEmailSchema.parse(body);
      return successResponse(requestId, 200, await authService.verifyEmail(input.email, input.token));
    }

    case "phone": {
      if (request.method !== "POST") {
        return notFound(requestId);
      }

      const nested = segments[2];
      if (nested !== "send-otp") {
        return notFound(requestId);
      }

      const auth = await authenticate(request);
      context.userId = auth.user.id;
      const body = await readJsonBody(request);
      checkRateLimit({
        key: String((body as { phone?: string }).phone ?? ""),
        maxRequests: 3,
        windowMs: 10 * 60 * 1000,
        code: "phone_otp_rate_limited",
        message: "Too many phone OTP requests",
      });
      const input = sendPhoneOtpSchema.parse(body);
      const result = await authService.sendPhoneOtp({
        accessToken: auth.accessToken,
        phone: input.phone,
      });
      return successResponse(requestId, 200, result);
    }

    case "verify-phone": {
      if (request.method !== "POST") {
        return notFound(requestId);
      }

      const body = await readJsonBody(request);
      checkRateLimit({
        key: String((body as { phone?: string }).phone ?? ""),
        maxRequests: 5,
        windowMs: 10 * 60 * 1000,
        code: "phone_verify_rate_limited",
        message: "Too many phone verification attempts",
      });
      const input = verifyPhoneSchema.parse(body);
      return successResponse(requestId, 200, await authService.verifyPhone(input.phone, input.token));
    }

    case "login": {
      if (request.method !== "POST") {
        return notFound(requestId);
      }

      checkRateLimit({
        key: getClientIp(request),
        maxRequests: 10,
        windowMs: 5 * 60 * 1000,
        code: "login_rate_limited",
        message: "Too many login attempts",
      });

      const input = loginSchema.parse(await readJsonBody(request));
      return successResponse(requestId, 200, await authService.login(input.email, input.password));
    }

    case "logout": {
      if (request.method !== "POST") {
        return notFound(requestId);
      }

      const auth = await authenticate(request);
      context.userId = auth.user.id;
      return successResponse(requestId, 200, await authService.logout(auth.accessToken));
    }

    case "change-password": {
      if (request.method !== "POST") {
        return notFound(requestId);
      }

      const auth = await authenticate(request);
      context.userId = auth.user.id;
      const input = changePasswordSchema.parse(await readJsonBody(request));
      return successResponse(
        requestId,
        200,
        await authService.changePassword({
          email: auth.user.email,
          accessToken: auth.accessToken,
          currentPassword: input.current_password,
          newPassword: input.new_password,
        }),
      );
    }

    case "resend-email-otp": {
      if (request.method !== "POST") {
        return notFound(requestId);
      }

      const body = await readJsonBody(request);
      checkRateLimit({
        key: String((body as { email?: string }).email ?? ""),
        maxRequests: 3,
        windowMs: 10 * 60 * 1000,
        code: "email_otp_resend_rate_limited",
        message: "Too many email OTP resend attempts",
      });
      const input = resendEmailOtpSchema.parse(body);
      return successResponse(requestId, 200, await authService.resendEmailOtp(input.email));
    }

    case "resend-phone-otp": {
      if (request.method !== "POST") {
        return notFound(requestId);
      }

      const body = await readJsonBody(request);
      checkRateLimit({
        key: String((body as { phone?: string }).phone ?? ""),
        maxRequests: 3,
        windowMs: 10 * 60 * 1000,
        code: "phone_otp_resend_rate_limited",
        message: "Too many phone OTP resend attempts",
      });
      const input = resendPhoneOtpSchema.parse(body);
      return successResponse(requestId, 200, await authService.resendPhoneOtp(input.phone));
    }

    case "forgot-password": {
      if (request.method !== "POST") {
        return notFound(requestId);
      }

      const body = await readJsonBody(request);
      checkRateLimit({
        key: String((body as { email?: string }).email ?? ""),
        maxRequests: 3,
        windowMs: 10 * 60 * 1000,
        code: "password_reset_request_rate_limited",
        message: "Too many password reset attempts",
      });
      const input = forgotPasswordSchema.parse(body);
      return successResponse(
        requestId,
        200,
        await authService.requestPasswordReset({
          email: input.email,
          redirectTo: input.redirect_to,
        }),
      );
    }

    case "reset-password": {
      if (request.method !== "POST") {
        return notFound(requestId);
      }

      const input = resetPasswordSchema.parse(await readJsonBody(request));
      return successResponse(
        requestId,
        200,
        await authService.resetPasswordWithToken({
          tokenHash: input.token_hash,
          newPassword: input.new_password,
        }),
      );
    }

    case "me": {
      if (request.method !== "GET") {
        return notFound(requestId);
      }

      const auth = await authenticate(request);
      context.userId = auth.user.id;
      return successResponse(requestId, 200, { user: auth.user });
    }

    default:
      return notFound(requestId);
  }
}

async function handleUsers(
  request: Request,
  requestId: string,
  context: { userId?: string },
  segments: string[],
): Promise<RouteResult> {
  const action = segments[1];

  if (action === "me") {
    if (request.method !== "PATCH") {
      return notFound(requestId);
    }

    const auth = await authenticate(request);
    context.userId = auth.user.id;
    assertVerified(auth.user);
    const input = updateMeSchema.parse(await readJsonBody(request));
    return successResponse(requestId, 200, await usersService.updateMe(auth.user.id, input));
  }

  if (!action) {
    return notFound(requestId);
  }

  if (request.method !== "GET") {
    return notFound(requestId);
  }

  const auth = await authenticate(request);
  context.userId = auth.user.id;
  const params = userIdParamSchema.parse({ id: action });
  return successResponse(requestId, 200, await usersService.getUserById(params.id));
}

async function handleListings(
  request: Request,
  requestId: string,
  context: { userId?: string },
  segments: string[],
): Promise<RouteResult> {
  const action = segments[1];

  if (!action) {
    if (request.method === "GET") {
      const auth = await authenticate(request);
      context.userId = auth.user.id;
      const url = new URL(request.url);
      const query = listingListQuerySchema.parse({
        limit: url.searchParams.get("limit") ?? undefined,
        offset: url.searchParams.get("offset") ?? undefined,
      });
      return successResponse(requestId, 200, await listingsService.list(query));
    }

    if (request.method === "POST") {
      const auth = await authenticate(request);
      context.userId = auth.user.id;
      assertVerified(auth.user);
      const input = listingCreateSchema.parse(await readJsonBody(request));
      return successResponse(requestId, 200, await listingsService.create(auth.user, input));
    }

    return notFound(requestId);
  }

  const params = listingIdSchema.parse({ id: action });

  if (request.method === "GET") {
    const auth = await authenticate(request);
    context.userId = auth.user.id;
    return successResponse(requestId, 200, await listingsService.getById(params.id));
  }

  if (request.method === "PATCH") {
    const auth = await authenticate(request);
    context.userId = auth.user.id;
    assertVerified(auth.user);
    const input = listingUpdateSchema.parse(await readJsonBody(request));
    return successResponse(requestId, 200, await listingsService.update(auth.user, params.id, input));
  }

  if (request.method === "DELETE") {
    const auth = await authenticate(request);
    context.userId = auth.user.id;
    assertVerified(auth.user);
    await listingsService.delete(auth.user, params.id);
    return successResponse(requestId, 200, { ok: true });
  }

  return notFound(requestId);
}

export async function dispatchApiV1(request: Request, segments: string[]): Promise<Response> {
  const [resource] = segments;

  return handleRequest(request, async (context) => {
    switch (resource) {
      case "health":
        return successResponse(context.requestId, 200, { status: "ok" });
      case "auth":
        return handleAuth(request, context.requestId, context, segments);
      case "users":
        return handleUsers(request, context.requestId, context, segments);
      case "listings":
        return handleListings(request, context.requestId, context, segments);
      default:
        return notFound(context.requestId);
    }
  });
}
