import { z } from "zod";
import { randomUUID } from "node:crypto";
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
import { supabaseServiceClient } from "../config/supabase";
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
type CaptureSessionRecord = {
  token: string;
  images: string[];
  createdAt: number;
  updatedAt: number;
};

const captureSessions = new Map<string, CaptureSessionRecord>();
const CAPTURE_SESSION_TTL_MS = 1000 * 60 * 30;
const JPEG_DATA_URL_REGEX = /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/;

const attachmentSchema = z.object({
  id: z.string(),
  kind: z.enum(["image", "video", "audio", "file"]),
  name: z.string(),
  size: z.number(),
  mimeType: z.string(),
  url: z.string(),
});

const sendMessageSchema = z.object({
  listing_id: z.string().uuid(),
  recipient_user_id: z.string().uuid(),
  text: z.string().max(5000).optional(),
  attachments: z.array(attachmentSchema).default([]),
});

const getMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(300).optional().default(200),
});

function buildConversationKey(listingId: string, userAId: string, userBId: string): string {
  const [a, b] = [userAId, userBId].sort();
  return `${listingId}__${a}__${b}`;
}

type ChatInboxEntry = {
  conversation_key: string;
  listing_id: string;
  listing_title: string;
  peer: {
    id: string;
    full_name: string | null;
    email: string;
  };
  updated_at: string;
  last_message_text: string;
};

async function handleChats(
  request: Request,
  requestId: string,
  context: { userId?: string },
  segments: string[],
): Promise<RouteResult> {
  const auth = await authenticate(request);
  context.userId = auth.user.id;
  const action = segments[1];

  if (!action && request.method === "GET") {
    const { data, error } = await supabaseServiceClient
      .from("chat_messages")
      .select(`
        conversation_key,
        listing_id,
        created_at,
        text,
        attachments,
        sender_user_id,
        recipient_user_id,
        listings:listing_id (title),
        sender:sender_user_id (id, full_name, email),
        recipient:recipient_user_id (id, full_name, email)
      `)
      .or(`sender_user_id.eq.${auth.user.id},recipient_user_id.eq.${auth.user.id}`)
      .order("conversation_key")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    const seen = new Set<string>();
    const inbox: ChatInboxEntry[] = [];

    for (const row of (data as any[])) {
      if (seen.has(row.conversation_key)) continue;
      seen.add(row.conversation_key);

      const peer = row.sender_user_id === auth.user.id ? row.recipient : row.sender;
      inbox.push({
        conversation_key: row.conversation_key,
        listing_id: row.listing_id,
        listing_title: row.listings?.title ?? "Unknown Listing",
        peer: {
          id: peer.id,
          full_name: peer.full_name,
          email: peer.email,
        },
        updated_at: row.created_at,
        last_message_text: row.text || (row.attachments?.length ? "Sent attachments" : "New message"),
      });
    }

    return successResponse(requestId, 200, inbox.sort((a, b) => b.updated_at.localeCompare(a.updated_at)));
  }

  if (action === "messages" && request.method === "POST") {
    const payload = sendMessageSchema.parse(await readJsonBody(request));

    if (payload.recipient_user_id === auth.user.id) {
      return errorResponse(requestId, 400, "invalid_recipient", "Cannot send a message to yourself");
    }
    if (!payload.text && payload.attachments.length === 0) {
      return errorResponse(requestId, 400, "empty_message", "Message requires text or attachments");
    }

    const conversationKey = buildConversationKey(payload.listing_id, auth.user.id, payload.recipient_user_id);

    const { data: newMessage, error: insertError } = await supabaseServiceClient
      .from("chat_messages")
      .insert({
        conversation_key: conversationKey,
        listing_id: payload.listing_id,
        sender_user_id: auth.user.id,
        recipient_user_id: payload.recipient_user_id,
        text: payload.text || "",
        attachments: payload.attachments,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === "23503") {
        return errorResponse(requestId, 404, "invalid_reference", "Listing or recipient not found");
      }
      throw new Error(insertError.message);
    }

    return successResponse(requestId, 201, newMessage);
  }

  const conversationKey = action;

  if (conversationKey && segments[2] === "messages" && segments[3]) {
    const messageId = segments[3];

    if (request.method === "PATCH") {
      const payload = z.object({ text: z.string().min(1) }).parse(await readJsonBody(request));
      const { data, error } = await supabaseServiceClient
        .from("chat_messages")
        .update({ text: payload.text })
        .eq("id", messageId)
        .eq("conversation_key", conversationKey)
        .eq("sender_user_id", auth.user.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return successResponse(requestId, 200, data);
    }

    if (request.method === "DELETE") {
      const { error } = await supabaseServiceClient
        .from("chat_messages")
        .delete()
        .eq("id", messageId)
        .eq("conversation_key", conversationKey)
        .eq("sender_user_id", auth.user.id);

      if (error) throw new Error(error.message);
      return successResponse(requestId, 200, { deleted: true });
    }
  }

  if (!conversationKey || segments[2] !== "messages" || request.method !== "GET") {
    return notFound(requestId);
  }

  const url = new URL(request.url);
  const query = getMessagesQuerySchema.parse({
    limit: url.searchParams.get("limit") ?? undefined,
  });

  const { data: messages, error } = await supabaseServiceClient
    .from("chat_messages")
    .select("*")
    .eq("conversation_key", conversationKey)
    .or(`sender_user_id.eq.${auth.user.id},recipient_user_id.eq.${auth.user.id}`)
    .order("created_at", { ascending: false })
    .limit(query.limit);

  if (error) throw new Error(error.message);

  return successResponse(requestId, 200, (messages as any[]).reverse());
}

function pruneCaptureSessions(now = Date.now()) {
  captureSessions.forEach((session, id) => {
    if (now - session.updatedAt > CAPTURE_SESSION_TTL_MS) {
      captureSessions.delete(id);
    }
  });
}

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

function getCaptureToken(request: Request): string | null {
  const fromHeader = request.headers.get("x-capture-token");
  if (fromHeader) {
    return fromHeader;
  }

  const url = new URL(request.url);
  return url.searchParams.get("token");
}

async function handleMedia(
  request: Request,
  requestId: string,
  _context: { userId?: string },
  segments: string[],
): Promise<RouteResult> {
  pruneCaptureSessions();

  if (segments[1] !== "capture-sessions") {
    return notFound(requestId);
  }

  const sessionId = segments[2];
  const action = segments[3];

  if (!sessionId) {
    if (request.method !== "POST") {
      return notFound(requestId);
    }

    const id = crypto.randomUUID();
    const token = crypto.randomUUID();
    const now = Date.now();
    captureSessions.set(id, {
      token,
      images: [],
      createdAt: now,
      updatedAt: now,
    });

    return successResponse(requestId, 201, {
      session_id: id,
      token,
      max_images: 10,
      expires_in_seconds: Math.floor(CAPTURE_SESSION_TTL_MS / 1000),
    });
  }

  const record = captureSessions.get(sessionId);
  if (!record) {
    return errorResponse(requestId, 404, "capture_session_not_found", "Capture session not found");
  }

  const token = getCaptureToken(request);
  if (!token || token !== record.token) {
    return errorResponse(requestId, 403, "invalid_capture_token", "Invalid capture token");
  }

  if (!action && request.method === "GET") {
    record.updatedAt = Date.now();
    return successResponse(requestId, 200, {
      session_id: sessionId,
      images: record.images,
      image_count: record.images.length,
      max_images: 10,
    });
  }

  if (action === "images" && request.method === "POST") {
    const body = (await readJsonBody(request)) as { images?: unknown };
    const incoming = Array.isArray(body.images) ? body.images : [];
    if (!incoming.length) {
      return errorResponse(requestId, 400, "images_required", "At least one image is required");
    }

    for (const image of incoming) {
      if (typeof image !== "string" || !JPEG_DATA_URL_REGEX.test(image)) {
        return errorResponse(requestId, 400, "invalid_image", "Images must be JPEG data URLs");
      }
    }

    const merged = [...record.images];
    for (const image of incoming as string[]) {
      if (merged.length >= 10) {
        break;
      }
      merged.push(image);
    }

    record.images = merged;
    record.updatedAt = Date.now();
    captureSessions.set(sessionId, record);

    return successResponse(requestId, 200, {
      session_id: sessionId,
      images: record.images,
      image_count: record.images.length,
      max_images: 10,
    });
  }

  if (request.method === "DELETE" && !action) {
    captureSessions.delete(sessionId);
    return successResponse(requestId, 200, { status: "capture_session_closed" });
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
      case "media":
        return handleMedia(request, context.requestId, context, segments);
      case "chats":
        return handleChats(request, context.requestId, context, segments);
      default:
        return notFound(context.requestId);
    }
  });
}
