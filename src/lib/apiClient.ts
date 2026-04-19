import type { ChatAttachment, ChatInboxEntry, ChatMessage, Listing, ListingPayload, PublicUser, Session, User } from "@/lib/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Envelope<T> = { success: true; data: T } | { success: false; error: { code: string; message: string } };

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("bs_access_token");
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  const body = (await res.json().catch(() => null)) as Envelope<T> | null;

  if (!res.ok || !body || body.success === false) {
    const code = body && "error" in body ? body.error.code : "network_error";
    const message = body && "error" in body ? body.error.message : res.statusText;

    if (res.status === 401 && typeof window !== "undefined") {
      window.localStorage.removeItem("bs_access_token");
      window.localStorage.removeItem("bs_user");
      window.location.href = "/login";
    }
    throw new ApiError(res.status, code, message);
  }

  return body.data;
}

export const auth = {
  signup: (email: string, password: string) =>
    request<{ status: string; userId: string | null }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  verifyEmail: (email: string, token: string) =>
    request<{ session: { access_token: string } | null; user: User } | { status: string }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ email, token }),
    }),

  sendPhoneOtp: (payload: { accessToken: string; phone: string }) =>
    request<{ status: string }>("/auth/phone/send-otp", {
      method: "POST",
      headers: { Authorization: `Bearer ${payload.accessToken}` },
      body: JSON.stringify({ phone: payload.phone }),
    }),

  verifyPhone: (phone: string, token: string) =>
    request<{ session: { access_token: string }; user: User }>("/auth/verify-phone", {
      method: "POST",
      body: JSON.stringify({ phone, token }),
    }),

  login: (email: string, password: string) =>
    request<{ session: { access_token: string }; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: (accessToken: string) =>
    request<{ status: string }>("/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  me: () => request<{ user: User }>("/auth/me"),

  changePassword: (payload: { email: string; accessToken: string; currentPassword: string; newPassword: string }) =>
    request<{ status: string }>("/auth/change-password", {
      method: "POST",
      headers: { Authorization: `Bearer ${payload.accessToken}` },
      body: JSON.stringify({
        current_password: payload.currentPassword,
        new_password: payload.newPassword,
      }),
    }),

  resendEmailOtp: (email: string) =>
    request<{ status: string }>("/auth/resend-email-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resendPhoneOtp: (phone: string) =>
    request<{ status: string }>("/auth/resend-phone-otp", {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),

  requestPasswordReset: (payload: { email: string; redirectTo?: string }) =>
    request<{ status: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: payload.email, redirect_to: payload.redirectTo }),
    }),

  resetPassword: (tokenHash: string, newPassword: string, confirmPassword: string) =>
    request<{ status: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token_hash: tokenHash, new_password: newPassword, confirm_password: confirmPassword }),
    }),
};

export const users = {
  getById: (id: string) => request<PublicUser>(`/users/${id}`),
  updateMe: (id: string, patch: { full_name?: string; bio?: string }) =>
    request<User>("/users/me", { method: "PATCH", body: JSON.stringify(patch) }),
};

export const listings = {
  list: (query: { limit?: number; offset?: number }) =>
    request<Listing[]>(`/listings?limit=${query.limit ?? 20}&offset=${query.offset ?? 0}`),
  getById: (id: string) => request<Listing>(`/listings/${id}`),
  create: (user: User, payload: ListingPayload) =>
    request<Listing>("/listings", { method: "POST", body: JSON.stringify(payload) }),
  update: (user: User, id: string, patch: Partial<ListingPayload>) =>
    request<Listing>(`/listings/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  delete: (id: string) => request<{ ok: true }>(`/listings/${id}`, { method: "DELETE" }),
};

export const media = {
  getCaptureSession: (sessionId: string, token: string) =>
    request<{ session_id: string; images: string[]; image_count: number; max_images: number }>(
      `/media/capture-sessions/${sessionId}?token=${encodeURIComponent(token)}`,
    ),
  appendCaptureImages: (sessionId: string, token: string, images: string[]) =>
    request<{ session_id: string; images: string[]; image_count: number; max_images: number }>(
      `/media/capture-sessions/${sessionId}/images?token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        body: JSON.stringify({ images }),
      },
    ),
};

export const chats = {
  listInbox: () => request<ChatInboxEntry[]>("/chats"),

  getMessages: (conversationKey: string, limit = 200) =>
    request<ChatMessage[]>(`/chats/${encodeURIComponent(conversationKey)}/messages?limit=${limit}`),

  sendMessage: (payload: {
    listing_id: string;
    recipient_user_id: string;
    text?: string;
    attachments?: ChatAttachment[];
  }) =>
    request<ChatMessage>("/chats/messages", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  editMessage: (conversationKey: string, messageId: string, text: string) =>
    request<ChatMessage>(`/chats/${encodeURIComponent(conversationKey)}/messages/${messageId}`, {
      method: "PATCH",
      body: JSON.stringify({ text }),
    }),

  deleteMessage: (conversationKey: string, messageId: string) =>
    request<{ deleted: true }>(`/chats/${encodeURIComponent(conversationKey)}/messages/${messageId}`, {
      method: "DELETE",
    }),
};

export const apiClient = { auth, users, listings, media, chats };
