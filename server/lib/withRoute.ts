import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import type { ZodTypeAny } from "zod";
import { ZodError } from "zod";
import { supabaseAnonClient } from "../config/supabase";
import { jsonError, jsonSuccess } from "./envelope";
import { logger } from "./logger";
import { rateLimiter } from "./rateLimiter";
import { ApiError } from "./apiError";
import { userRepository } from "./container";
import type { AppUser } from "../types/index";

type RouteAuth = {
  accessToken: string;
  userId: string;
};

type RouteContext<TBody = any, TQuery = any, TParams = Record<string, string | string[] | undefined>> = {
  request: NextRequest;
  requestId: string;
  body: TBody;
  query: TQuery;
  params: TParams;
  user?: AppUser;
  auth?: RouteAuth;
};

type RateLimitConfig = {
  key: (context: {
    request: NextRequest;
    body: unknown;
    query: Record<string, string>;
    params: Record<string, string | string[] | undefined>;
    user?: AppUser;
  }) => string | undefined | null;
  maxRequests: number;
  windowMs: number;
  code: string;
  message: string;
};

type RouteOptions = {
  bodySchema?: ZodTypeAny;
  querySchema?: ZodTypeAny;
  paramsSchema?: ZodTypeAny;
  requireAuth?: boolean;
  requireVerified?: boolean;
  rateLimit?: RateLimitConfig;
};

type RouteHandler<TBody = any, TQuery = any, TParams = Record<string, string | string[] | undefined>> = (
  context: RouteContext<TBody, TQuery, TParams>,
) => Promise<NextResponse> | NextResponse;

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return "unknown";
}

async function parseJsonBody(request: NextRequest): Promise<unknown> {
  if (request.method === "GET" || request.method === "HEAD") {
    return undefined;
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return undefined;
  }

  const raw = await request.text();
  if (!raw) {
    return undefined;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new ApiError(400, "invalid_json", "Request body must be valid JSON");
  }
}

async function authenticate(request: NextRequest): Promise<{ user: AppUser; auth: RouteAuth }> {
  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  if (!accessToken) {
    throw new ApiError(401, "unauthorized", "Missing authorization token");
  }

  const { data, error } = await supabaseAnonClient.auth.getUser(accessToken);
  if (error || !data.user) {
    throw new ApiError(401, "unauthorized", error?.message ?? "Invalid token");
  }

  const user = await userRepository.upsertAuthUser({
    id: data.user.id,
    email: data.user.email ?? "",
    phone: data.user.phone ?? null,
  });

  return {
    user,
    auth: {
      accessToken,
      userId: data.user.id,
    },
  };
}

export function withRoute<TBody = any, TQuery = any, TParams = Record<string, string | string[] | undefined>>(
  handler: RouteHandler<TBody, TQuery, TParams>,
  options: RouteOptions = {},
) {
  return async (
    request: NextRequest,
    routeContext?: { params?: Record<string, string | string[] | undefined> },
  ): Promise<NextResponse> => {
    const requestId = randomUUID();
    const startedAt = Date.now();
    const path = request.nextUrl.pathname;
    const method = request.method;

    try {
      const rawBody = await parseJsonBody(request);
      const rawQuery = Object.fromEntries(request.nextUrl.searchParams.entries());
      const rawParams = routeContext?.params ?? {};

      const authResult = options.requireAuth || options.requireVerified ? await authenticate(request) : undefined;

      if (options.requireVerified && !authResult?.user.fully_verified) {
        throw new ApiError(403, "verification_required", "Fully verified account required");
      }

      if (options.rateLimit) {
        const key =
          options.rateLimit.key({
            request,
            body: rawBody,
            query: rawQuery,
            params: rawParams,
            user: authResult?.user,
          }) ??
          authResult?.user.id ??
          getClientIp(request);

        const allowed = rateLimiter.checkLimit(key, options.rateLimit.maxRequests, options.rateLimit.windowMs);
        if (!allowed) {
          throw new ApiError(429, options.rateLimit.code, options.rateLimit.message);
        }
      }

      const body = options.bodySchema ? (options.bodySchema.parse(rawBody) as TBody) : (rawBody as TBody);
      const query = options.querySchema ? (options.querySchema.parse(rawQuery) as TQuery) : (rawQuery as TQuery);
      const params = options.paramsSchema ? (options.paramsSchema.parse(rawParams) as TParams) : (rawParams as TParams);

      const response = await handler({
        request,
        requestId,
        body,
        query,
        params,
        user: authResult?.user,
        auth: authResult?.auth,
      });

      logger.info("request_completed", {
        requestId,
        method,
        path,
        status: response.status,
        userId: authResult?.user.id,
        durationMs: Date.now() - startedAt,
      });

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        logger.warn("request_failed", {
          requestId,
          method,
          path,
          code: error.code,
          status: error.statusCode,
          durationMs: Date.now() - startedAt,
        });
        return jsonError(error.code, error.message, error.statusCode, error.details);
      }

      if (error instanceof ZodError) {
        logger.warn("validation_failed", {
          requestId,
          method,
          path,
          durationMs: Date.now() - startedAt,
        });
        return jsonError("validation_failed", "Validation failed", 400, error.flatten());
      }

      logger.error("unhandled_error", {
        requestId,
        method,
        path,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        durationMs: Date.now() - startedAt,
      });
      return jsonError("internal_server_error", "Internal server error", 500);
    }
  };
}

export { jsonSuccess };
