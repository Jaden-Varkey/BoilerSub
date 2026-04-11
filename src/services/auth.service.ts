import { createSupabaseClient } from "../config/supabase.js";
import { env } from "../config/env.js";
import { ApiError } from "../lib/apiError.js";
import type { UserRepository } from "../repositories/user.repository.js";
import type { AuthSessionPayload } from "../types/index.js";

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  private async authRequest<T>(path: string, init: RequestInit, accessToken?: string): Promise<T> {
    const response = await fetch(`${env.SUPABASE_URL}/auth/v1${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        apikey: env.SUPABASE_ANON_KEY,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(init.headers ?? {}),
      },
    });

    const payload = (await response.json().catch(() => null)) as
      | { msg?: string; error_description?: string; code?: string; message?: string }
      | null;

    if (!response.ok) {
      throw new ApiError(
        response.status,
        payload?.code ?? "auth_request_failed",
        payload?.msg ?? payload?.error_description ?? payload?.message ?? "Supabase auth request failed",
      );
    }

    return (payload ?? {}) as T;
  }

  async signup(email: string, password: string): Promise<{ status: string; userId: string | null }> {
    const data = await this.authRequest<{
      id?: string;
      user?: { id?: string; email?: string; phone?: string | null };
      email?: string;
      phone?: string | null;
    }>("/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const authUser = data.user ?? data;

    if (authUser?.id) {
      await this.userRepository.upsertAuthUser({
        id: authUser.id,
        email: authUser.email ?? email,
        phone: authUser.phone || null,
      });
    }

    return {
      status: "pending_email_verification",
      userId: authUser?.id ?? null,
    };
  }

  async verifyEmail(email: string, token: string): Promise<{ status: string } | AuthSessionPayload> {
    const data = await this.authRequest<{
      user?: { id: string };
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      token_type?: string;
    }>("/verify", {
      method: "POST",
      body: JSON.stringify({ email, token, type: "email" }),
    });

    if (!data.user) {
      throw new ApiError(400, "email_verification_failed", "Email verification failed");
    }

    if (env.SKIP_PHONE_VERIFICATION) {
      const user = await this.userRepository.markFullyVerified(data.user.id);
      return {
        session: data.access_token
          ? {
              access_token: data.access_token,
              refresh_token: data.refresh_token ?? "",
              expires_in: data.expires_in,
              token_type: data.token_type,
            }
          : null,
        user,
      };
    }

    await this.userRepository.markEmailVerified(data.user.id);
    return { status: "pending_phone_verification" };
  }

  async sendPhoneOtp(input: { accessToken: string; phone: string }): Promise<{ status: string }> {
    await this.authRequest(
      "/user",
      {
        method: "PUT",
        body: JSON.stringify({ phone: input.phone }),
      },
      input.accessToken,
    );
    return { status: "pending_phone_verification" };
  }

  async verifyPhone(phone: string, token: string): Promise<AuthSessionPayload> {
    const data = await this.authRequest<{
      user?: { id: string };
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      token_type?: string;
    }>("/verify", {
      method: "POST",
      body: JSON.stringify({ phone, token, type: "sms" }),
    });

    if (!data.user) {
      throw new ApiError(400, "phone_verification_failed", "Phone verification failed");
    }

    const user = await this.userRepository.markFullyVerified(data.user.id);
    return {
      session: data.access_token
        ? {
            access_token: data.access_token,
            refresh_token: data.refresh_token ?? "",
            expires_in: data.expires_in,
            token_type: data.token_type,
          }
        : null,
      user,
    };
  }

  async login(email: string, password: string): Promise<AuthSessionPayload> {
    const data = await this.authRequest<{
      user?: { id: string };
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      token_type?: string;
    }>("/token?grant_type=password", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (!data.user) {
      throw new ApiError(400, "login_failed", "Login failed");
    }

    const user = await this.userRepository.findById(data.user.id);
    if (!user) {
      throw new ApiError(404, "user_not_found", "User record not found");
    }
    if (!user.fully_verified) {
      throw new ApiError(403, "verification_required", "Account is not fully verified");
    }

    return {
      session: data.access_token
        ? {
            access_token: data.access_token,
            refresh_token: data.refresh_token ?? "",
            expires_in: data.expires_in,
            token_type: data.token_type,
          }
        : null,
      user,
    };
  }

  async logout(accessToken: string): Promise<{ status: string }> {
    await this.authRequest("/logout", { method: "POST" }, accessToken);
    return { status: "signed_out" };
  }

  async resendEmailOtp(email: string): Promise<{ status: string }> {
    await this.authRequest("/resend", {
      method: "POST",
      body: JSON.stringify({ type: "signup", email }),
    });
    return { status: "email_otp_resent" };
  }

  async resendPhoneOtp(phone: string): Promise<{ status: string }> {
    await this.authRequest("/resend", {
      method: "POST",
      body: JSON.stringify({ type: "sms", phone }),
    });
    return { status: "phone_otp_resent" };
  }
}
