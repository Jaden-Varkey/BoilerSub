import type { Listing, ListingPayload, PublicUser, Session, User } from "@/lib/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

type Envelope<T> = { success: true; data: T } | { success: false; error: { code: string; message: string } };

function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem("bs_access_token");
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  const body = (await response.json().catch(() => null)) as Envelope<T> | null;
  if (!response.ok || !body || body.success === false) {
    const code = body && "error" in body ? body.error.code : "network_error";
    const message = body && "error" in body ? body.error.message : response.statusText;

    if (response.status === 401 && typeof window !== "undefined") {
      window.localStorage.removeItem("bs_access_token");
      window.localStorage.removeItem("bs_user");
      window.location.href = "/login";
    }

    throw new ApiError(response.status, code, message);
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
    request<{ status: string } | { session: Session; user: User }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ email, token }),
    }),

  sendPhoneOtp: (phone: string) =>
    request<{ status: string }>("/auth/phone/send-otp", {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),

  verifyPhone: (phone: string, token: string) =>
    request<{ session: Session; user: User }>("/auth/verify-phone", {
      method: "POST",
      body: JSON.stringify({ phone, token }),
    }),

  login: (email: string, password: string) =>
    request<{ session: Session; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () => request<{ status: string }>("/auth/logout", { method: "POST" }),

  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) =>
    request<{ status: string }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    }),

  me: () => request<{ user: User }>("/auth/me"),

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

  requestPasswordReset: (email: string, redirectTo?: string) =>
    request<{ status: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({
        email,
        redirect_to: redirectTo,
      }),
    }),

  resetPassword: (tokenHash: string, newPassword: string, confirmPassword: string) =>
    request<{ status: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        token_hash: tokenHash,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    }),
};

export const users = {
  getById: (id: string) => request<PublicUser>(`/users/${id}`),
  updateMe: (patch: { full_name?: string | null; bio?: string | null }) =>
    request<PublicUser>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
};

export const listings = {
  list: (limit = 20, offset = 0) => request<Listing[]>(`/listings?limit=${limit}&offset=${offset}`),
  getById: (id: string) => request<Listing>(`/listings/${id}`),
  create: (payload: ListingPayload) =>
    request<Listing>("/listings", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id: string, patch: Partial<ListingPayload>) =>
    request<Listing>(`/listings/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  delete: (id: string) => request<{ ok: true }>(`/listings/${id}`, { method: "DELETE" }),
};

export const media = {
  createCaptureSession: () =>
    request<{ session_id: string; token: string; max_images: number; expires_in_seconds: number }>("/media/capture-sessions", {
      method: "POST",
    }),

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

export const apiClient = { auth, users, listings, media };
