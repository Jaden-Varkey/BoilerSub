import { getDemoData, updateDemoData } from "../data/demoStore.js";
import { ApiError } from "../lib/apiError.js";
import type { UserRecord } from "../types/index.js";
import type { UserRepository } from "./user.repository.js";

function toUserRecord(user: {
  id: string;
  email: string;
  phone: string | null;
  full_name: string | null;
  bio: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  fully_verified: boolean;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
}): UserRecord {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    full_name: user.full_name,
    bio: user.bio,
    email_verified: user.email_verified,
    phone_verified: user.phone_verified,
    fully_verified: user.fully_verified,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

export class DemoUserRepository implements UserRepository {
  async findById(id: string): Promise<UserRecord | null> {
    const user = getDemoData().users.find((entry) => entry.id === id);
    return user ? toUserRecord(user) : null;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const user = getDemoData().users.find((entry) => entry.email.toLowerCase() === email.toLowerCase());
    return user ? toUserRecord(user) : null;
  }

  async findByIds(ids: string[]): Promise<UserRecord[]> {
    const idSet = new Set(ids);
    return getDemoData()
      .users.filter((entry) => idSet.has(entry.id))
      .map((entry) => toUserRecord(entry));
  }

  async upsertAuthUser(input: { id: string; email: string; phone?: string | null }): Promise<UserRecord> {
    let selected: UserRecord | null = null;

    updateDemoData((state) => {
      const existing = state.users.find((entry) => entry.id === input.id);
      const timestamp = new Date().toISOString();

      if (existing) {
        existing.email = input.email;
        existing.phone = input.phone ?? existing.phone;
        existing.updated_at = timestamp;
        selected = toUserRecord(existing);
        return;
      }

      const created = {
        id: input.id,
        email: input.email,
        phone: input.phone ?? null,
        full_name: null,
        bio: null,
        email_verified: false,
        phone_verified: false,
        fully_verified: false,
        role: "user" as const,
        created_at: timestamp,
        updated_at: timestamp,
        password: "",
        pending_email_token: null,
        pending_phone_token: null,
      };

      state.users.push(created);
      selected = toUserRecord(created);
    });

    if (!selected) {
      throw new ApiError(500, "user_upsert_failed", "Failed to upsert demo user");
    }

    return selected;
  }

  async updateProfile(
    id: string,
    patch: { full_name?: string | null; bio?: string | null; phone?: string | null },
  ): Promise<UserRecord> {
    let updated: UserRecord | null = null;

    updateDemoData((state) => {
      const user = state.users.find((entry) => entry.id === id);
      if (!user) {
        throw new ApiError(404, "user_not_found", "User not found");
      }

      if (patch.full_name !== undefined) {
        user.full_name = patch.full_name;
      }
      if (patch.bio !== undefined) {
        user.bio = patch.bio;
      }
      if (patch.phone !== undefined) {
        user.phone = patch.phone;
      }
      user.updated_at = new Date().toISOString();
      updated = toUserRecord(user);
    });

    if (!updated) {
      throw new ApiError(500, "user_update_failed", "Failed to update demo user");
    }

    return updated;
  }

  async markEmailVerified(id: string): Promise<UserRecord> {
    return this.updateVerification(id, { email_verified: true });
  }

  async markPhoneVerified(id: string): Promise<UserRecord> {
    return this.updateVerification(id, { phone_verified: true });
  }

  async markFullyVerified(id: string): Promise<UserRecord> {
    return this.updateVerification(id, {
      phone_verified: true,
      fully_verified: true,
    });
  }

  private async updateVerification(
    id: string,
    patch: Partial<Pick<UserRecord, "email_verified" | "phone_verified" | "fully_verified">>,
  ): Promise<UserRecord> {
    let updated: UserRecord | null = null;

    updateDemoData((state) => {
      const user = state.users.find((entry) => entry.id === id);
      if (!user) {
        throw new ApiError(404, "user_not_found", "User not found");
      }

      if (patch.email_verified !== undefined) {
        user.email_verified = patch.email_verified;
      }
      if (patch.phone_verified !== undefined) {
        user.phone_verified = patch.phone_verified;
      }
      if (patch.fully_verified !== undefined) {
        user.fully_verified = patch.fully_verified;
      }
      user.updated_at = new Date().toISOString();
      updated = toUserRecord(user);
    });

    if (!updated) {
      throw new ApiError(500, "user_update_failed", "Failed to update demo user");
    }

    return updated;
  }
}
