import { randomUUID } from "node:crypto";
import { ZodError, type ZodTypeAny } from "zod";
import { ApiError } from "../lib/apiError";
import { logger } from "../lib/logger";
import { rateLimiter } from "../lib/rateLimiter";
import type { RequestUser } from "../types/index";
import { authDependencies } from "./container";

export type RequestContext = {
  requestId: string;
  startedAt: number;
  method: string;
  path: string;
  userId?: string;
};

export function createRequestContext(request: Request): RequestContext {
  return {
    requestId: request.headers.get("x-request-id") ?? randomUUID(),
    startedAt: Date.now(),
    method: request.method,
    path: new URL(request.url).pathname,
  };
}

function baseHeaders(requestId: string): Headers {
  return new Headers({
    "content-type": "application/json",
    "x-request-id": requestId,
  });
}

export function jsonResponse<T>(requestId: string, status: number, payload: T): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: baseHeaders(requestId),
  });
}

export function successResponse<T>(requestId: string, status: number, data: T): Response {
  return jsonResponse(requestId, status, { success: true, data });
}

export function errorResponse(
  requestId: string,
  status: number,
  code: string,
  message: string,
  details?: unknown,
): Response {
  return jsonResponse(requestId, status, {
    success: false,
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
  });
}

export async function readJsonBody<T = unknown>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError(400, "validation_failed", "Validation failed", {
      formErrors: ["Invalid JSON body"],
      fieldErrors: {},
    });
  }
}

export function parseWithSchema<T>(schema: ZodTypeAny, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw parsed.error;
  }
  return parsed.data as T;
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  const realIp = request.headers.get("x-real-ip");
  return realIp?.trim() || "unknown";
}

export function checkRateLimit(options: {
  key: string;
  maxRequests: number;
  windowMs: number;
  code: string;
  message: string;
}): void {
  const allowed = rateLimiter.checkLimit(options.key, options.maxRequests, options.windowMs);
  if (!allowed) {
    throw new ApiError(429, options.code, options.message);
  }
}

export async function authenticate(request: Request): Promise<{ accessToken: string; user: RequestUser }> {
  const header = request.headers.get("authorization");
  const accessToken = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

  if (!accessToken) {
    throw new ApiError(401, "unauthorized", "Missing authorization token");
  }

  const { data, error } = await authDependencies.supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    throw new ApiError(401, "unauthorized", error?.message ?? "Invalid token");
  }

  const user = await authDependencies.userRepository.upsertAuthUser({
    id: data.user.id,
    email: data.user.email ?? "",
    phone: data.user.phone ?? null,
  });

  return { accessToken, user };
}

export function assertVerified(user: RequestUser): void {
  if (!user.fully_verified) {
    throw new ApiError(403, "verification_required", "Fully verified account required");
  }
}

export function serializeUnknownError(error: unknown): { status: number; code: string; message: string; details?: unknown } {
  if (error instanceof ApiError) {
    return {
      status: error.statusCode,
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }

  if (error instanceof ZodError) {
    return {
      status: 400,
      code: "validation_failed",
      message: "Validation failed",
      details: error.flatten(),
    };
  }

  logger.error("unhandled_error", {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

  return {
    status: 500,
    code: "internal_server_error",
    message: "Internal server error",
  };
}

export async function handleRequest(
  request: Request,
  handler: (context: RequestContext) => Promise<Response>,
): Promise<Response> {
  const context = createRequestContext(request);
  logger.info("request_started", {
    requestId: context.requestId,
    method: context.method,
    path: context.path,
  });

  let response: Response;

  try {
    response = await handler(context);
  } catch (error) {
    const serialized = serializeUnknownError(error);
    response = errorResponse(context.requestId, serialized.status, serialized.code, serialized.message, serialized.details);
  }

  logger.info("request_finished", {
    requestId: context.requestId,
    method: context.method,
    path: context.path,
    statusCode: response.status,
    durationMs: Date.now() - context.startedAt,
    userId: context.userId,
  });

  if (!response.headers.has("x-request-id")) {
    const headers = new Headers(response.headers);
    headers.set("x-request-id", context.requestId);
    return new Response(response.body, {
      status: response.status,
      headers,
    });
  }

  return response;
}
