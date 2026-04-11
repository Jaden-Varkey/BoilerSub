import { createSupabaseClient, supabaseAnonClient } from "../config/supabase.js";
import { ApiError } from "../lib/apiError.js";
import type { UserRepository } from "../repositories/user.repository.js";
import type { AuthSessionPayload } from "../types/index.js";

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async signup(email: string, password: string): Promise<{ status: string; userId: string | null }> {
    const { data, error } = await supabaseAnonClient.auth.signUp({ email, password });
    if (error) {
      throw new ApiError(400, "signup_failed", error.message);
    }

    if (data.user?.id) {
      await this.userRepository.upsertAuthUser({
        id: data.user.id,
        email: data.user.email ?? email,
        phone: data.user.phone ?? null,
      });
    }

    return {
      status: "pending_email_verification",
      userId: data.user?.id ?? null,
    };
  }

  async verifyEmail(email: string, token: string): Promise<{ status: string }> {
    const { data, error } = await supabaseAnonClient.auth.verifyOtp({ email, token, type: "email" });
    if (error || !data.user) {
      throw new ApiError(400, "email_verification_failed", error?.message ?? "Email verification failed");
    }

    await this.userRepository.markEmailVerified(data.user.id);
    return { status: "pending_phone_verification" };
  }

  async sendPhoneOtp(input: { accessToken: string; phone: string }): Promise<{ status: string }> {
    const client = createSupabaseClient(input.accessToken);
    const { error } = await client.auth.updateUser({ phone: input.phone });
    if (error) {
      throw new ApiError(400, "phone_update_failed", error.message);
    }
    return { status: "pending_phone_verification" };
  }

  async verifyPhone(phone: string, token: string): Promise<AuthSessionPayload> {
    const { data, error } = await supabaseAnonClient.auth.verifyOtp({ phone, token, type: "sms" });
    if (error || !data.user) {
      throw new ApiError(400, "phone_verification_failed", error?.message ?? "Phone verification failed");
    }

    const user = await this.userRepository.markFullyVerified(data.user.id);
    return {
      session: data.session
        ? {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_in: data.session.expires_in,
            token_type: data.session.token_type,
          }
        : null,
      user,
    };
  }

  async login(email: string, password: string): Promise<AuthSessionPayload> {
    const { data, error } = await supabaseAnonClient.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      throw new ApiError(400, "login_failed", error?.message ?? "Login failed");
    }

    const user = await this.userRepository.findById(data.user.id);
    if (!user) {
      throw new ApiError(404, "user_not_found", "User record not found");
    }
    if (!user.fully_verified) {
      throw new ApiError(403, "verification_required", "Account is not fully verified");
    }

    return {
      session: data.session
        ? {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_in: data.session.expires_in,
            token_type: data.session.token_type,
          }
        : null,
      user,
    };
  }

  async logout(accessToken: string): Promise<{ status: string }> {
    const client = createSupabaseClient(accessToken);
    const { error } = await client.auth.signOut();
    if (error) {
      throw new ApiError(400, "logout_failed", error.message);
    }
    return { status: "signed_out" };
  }

  async resendEmailOtp(email: string): Promise<{ status: string }> {
    const { error } = await supabaseAnonClient.auth.resend({ type: "signup", email });
    if (error) {
      throw new ApiError(400, "resend_failed", error.message);
    }
    return { status: "email_otp_resent" };
  }

  async resendPhoneOtp(phone: string): Promise<{ status: string }> {
    const { error } = await supabaseAnonClient.auth.resend({ type: "sms", phone });
    if (error) {
      throw new ApiError(400, "resend_failed", error.message);
    }
    return { status: "phone_otp_resent" };
  }
}
