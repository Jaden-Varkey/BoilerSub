import { DEFAULT_PASSWORD, getDemoData, issueDemoOtp, issueDemoToken, updateDemoData } from "../data/demoStore.js";
import { ApiError } from "../lib/apiError.js";
import type { UserRepository } from "../repositories/user.repository.js";
import type { AuthSessionPayload, UserRecord } from "../types/index.js";

type PendingAuthResponse = {
  status: string;
  userId?: string | null;
  debug_code?: string;
  session?: {
    access_token: string;
    refresh_token: string;
    expires_in?: number;
    token_type?: string;
  } | null;
};

function createSession(userId: string) {
  const accessToken = issueDemoToken();
  const refreshToken = issueDemoToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

  updateDemoData((state) => {
    state.sessions = state.sessions.filter((entry) => entry.user_id !== userId);
    state.sessions.push({
      access_token: accessToken,
      refresh_token: refreshToken,
      user_id: userId,
      expires_at: expiresAt,
    });
  });

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: 60 * 60 * 24 * 7,
    token_type: "bearer",
  };
}

function toAuthPayload(user: UserRecord): AuthSessionPayload {
  return {
    session: createSession(user.id),
    user,
  };
}

export class DemoAuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async signup(email: string, password: string): Promise<PendingAuthResponse> {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new ApiError(409, "email_in_use", "An account with this email already exists");
    }

    const emailToken = issueDemoOtp();
    const createdAt = new Date().toISOString();
    let createdId: string | null = null;

    updateDemoData((state) => {
      createdId = issueDemoToken();
      state.users.push({
        id: createdId as string,
        email,
        phone: null,
        full_name: null,
        bio: null,
        email_verified: false,
        phone_verified: false,
        fully_verified: false,
        role: "user",
        created_at: createdAt,
        updated_at: createdAt,
        password,
        pending_email_token: emailToken,
        pending_phone_token: null,
      });
    });

    return {
      status: "pending_email_verification",
      userId: createdId,
      debug_code: emailToken,
    };
  }

  async verifyEmail(email: string, token: string): Promise<PendingAuthResponse> {
    let matchedUserId: string | null = null;

    updateDemoData((state) => {
      const user = state.users.find((entry) => entry.email.toLowerCase() === email.toLowerCase());
      if (!user || user.pending_email_token !== token) {
        throw new ApiError(400, "email_verification_failed", "Invalid email verification code");
      }

      user.email_verified = true;
      user.pending_email_token = null;
      user.updated_at = new Date().toISOString();
      matchedUserId = user.id;
    });

    if (!matchedUserId) {
      throw new ApiError(400, "email_verification_failed", "Invalid email verification code");
    }

    await this.userRepository.markEmailVerified(matchedUserId);
    return {
      status: "pending_phone_verification",
      session: createSession(matchedUserId),
    };
  }

  async sendPhoneOtp(input: { accessToken: string; phone: string }): Promise<PendingAuthResponse> {
    const session = getDemoData().sessions.find((entry) => entry.access_token === input.accessToken);
    if (!session) {
      throw new ApiError(401, "unauthorized", "Missing or invalid access token");
    }

    const phoneInUse = getDemoData().users.find(
      (entry) => entry.phone === input.phone && entry.id !== session.user_id,
    );
    if (phoneInUse) {
      throw new ApiError(409, "phone_in_use", "That phone number is already in use");
    }

    const phoneToken = issueDemoOtp();

    updateDemoData((state) => {
      const user = state.users.find((entry) => entry.id === session.user_id);
      if (!user) {
        throw new ApiError(404, "user_not_found", "User not found");
      }

      user.phone = input.phone;
      user.phone_verified = false;
      user.fully_verified = false;
      user.pending_phone_token = phoneToken;
      user.updated_at = new Date().toISOString();
    });

    return {
      status: "pending_phone_verification",
      debug_code: phoneToken,
    };
  }

  async verifyPhone(phone: string, token: string): Promise<AuthSessionPayload> {
    let userId: string | null = null;

    updateDemoData((state) => {
      const user = state.users.find((entry) => entry.phone === phone);
      if (!user || user.pending_phone_token !== token) {
        throw new ApiError(400, "phone_verification_failed", "Invalid phone verification code");
      }

      user.phone_verified = true;
      user.fully_verified = true;
      user.pending_phone_token = null;
      user.updated_at = new Date().toISOString();
      userId = user.id;
    });

    if (!userId) {
      throw new ApiError(400, "phone_verification_failed", "Invalid phone verification code");
    }

    const user = await this.userRepository.markFullyVerified(userId);
    return toAuthPayload(user);
  }

  async login(email: string, password: string): Promise<AuthSessionPayload> {
    const state = getDemoData();
    const user = state.users.find((entry) => entry.email.toLowerCase() === email.toLowerCase());
    if (!user || user.password !== password) {
      throw new ApiError(400, "login_failed", "Invalid email or password");
    }

    if (!user.fully_verified) {
      throw new ApiError(403, "verification_required", "Account is not fully verified", {
        stage: user.email_verified ? "pending_phone_verification" : "pending_email_verification",
      });
    }

    const persistedUser = await this.userRepository.findById(user.id);
    if (!persistedUser) {
      throw new ApiError(404, "user_not_found", "User record not found");
    }

    return toAuthPayload(persistedUser);
  }

  async logout(accessToken: string): Promise<{ status: string }> {
    updateDemoData((state) => {
      state.sessions = state.sessions.filter((entry) => entry.access_token !== accessToken);
    });

    return { status: "signed_out" };
  }

  async resendEmailOtp(email: string): Promise<PendingAuthResponse> {
    const token = issueDemoOtp();

    updateDemoData((state) => {
      const user = state.users.find((entry) => entry.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        throw new ApiError(404, "user_not_found", "User not found");
      }

      user.pending_email_token = token;
      user.updated_at = new Date().toISOString();
    });

    return {
      status: "email_otp_resent",
      debug_code: token,
    };
  }

  async resendPhoneOtp(phone: string): Promise<PendingAuthResponse> {
    const token = issueDemoOtp();

    updateDemoData((state) => {
      const user = state.users.find((entry) => entry.phone === phone);
      if (!user) {
        throw new ApiError(404, "user_not_found", "User not found");
      }

      user.pending_phone_token = token;
      user.updated_at = new Date().toISOString();
    });

    return {
      status: "phone_otp_resent",
      debug_code: token,
    };
  }

  async getDemoCredentials(): Promise<{ email: string; password: string }[]> {
    return getDemoData().users.slice(0, 3).map((user) => ({
      email: user.email,
      password: user.password || DEFAULT_PASSWORD,
    }));
  }
}
