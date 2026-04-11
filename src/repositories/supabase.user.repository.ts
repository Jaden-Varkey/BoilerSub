import { supabaseAdmin } from "../config/supabase.js";
import { ApiError } from "../lib/apiError.js";
import type { UserRecord } from "../types/index.js";
import type { UserRepository } from "./user.repository.js";

const userSelect =
  "id, email, phone, full_name, bio, email_verified, phone_verified, fully_verified, role, created_at, updated_at";

function mapUser(row: Record<string, unknown> | null | undefined): UserRecord {
  if (!row) {
    throw new ApiError(500, "user_mapping_failed", "Failed to map user record");
  }

  return {
    id: String(row.id),
    email: String(row.email),
    phone: row.phone == null ? null : String(row.phone),
    full_name: row.full_name == null ? null : String(row.full_name),
    bio: row.bio == null ? null : String(row.bio),
    email_verified: Boolean(row.email_verified),
    phone_verified: Boolean(row.phone_verified),
    fully_verified: Boolean(row.fully_verified),
    role: row.role === "admin" ? "admin" : "user",
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export class SupabaseUserRepository implements UserRepository {
  async findById(id: string): Promise<UserRecord | null> {
    const { data, error } = await supabaseAdmin.from("users").select(userSelect).eq("id", id).maybeSingle();
    if (error) {
      throw new ApiError(500, "user_lookup_failed", error.message);
    }
    return data ? mapUser(data as Record<string, unknown>) : null;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const { data, error } = await supabaseAdmin.from("users").select(userSelect).eq("email", email).maybeSingle();
    if (error) {
      throw new ApiError(500, "user_lookup_failed", error.message);
    }
    return data ? mapUser(data as Record<string, unknown>) : null;
  }

  async findByIds(ids: string[]): Promise<UserRecord[]> {
    if (ids.length === 0) {
      return [];
    }

    const { data, error } = await supabaseAdmin.from("users").select(userSelect).in("id", ids);
    if (error) {
      throw new ApiError(500, "user_lookup_failed", error.message);
    }

    return (data ?? []).map((row) => mapUser(row as Record<string, unknown>));
  }

  async upsertAuthUser(input: { id: string; email: string; phone?: string | null }): Promise<UserRecord> {
    const { data, error } = await supabaseAdmin
      .from("users")
      .upsert(
        {
          id: input.id,
          email: input.email,
          phone: input.phone ?? null,
        },
        { onConflict: "id" },
      )
      .select(userSelect)
      .single();

    if (error) {
      throw new ApiError(500, "user_upsert_failed", error.message);
    }

    return mapUser(data as Record<string, unknown>);
  }

  async updateProfile(
    id: string,
    patch: { full_name?: string | null; bio?: string | null; phone?: string | null },
  ): Promise<UserRecord> {
    const { data, error } = await supabaseAdmin
      .from("users")
      .update({
        ...(patch.full_name !== undefined ? { full_name: patch.full_name } : {}),
        ...(patch.bio !== undefined ? { bio: patch.bio } : {}),
        ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
      })
      .eq("id", id)
      .select(userSelect)
      .single();

    if (error) {
      throw new ApiError(500, "user_update_failed", error.message);
    }

    return mapUser(data as Record<string, unknown>);
  }

  async markEmailVerified(id: string): Promise<UserRecord> {
    const { data, error } = await supabaseAdmin
      .from("users")
      .update({ email_verified: true })
      .eq("id", id)
      .select(userSelect)
      .single();

    if (error) {
      throw new ApiError(500, "user_update_failed", error.message);
    }

    return mapUser(data as Record<string, unknown>);
  }

  async markPhoneVerified(id: string): Promise<UserRecord> {
    const { data, error } = await supabaseAdmin
      .from("users")
      .update({ phone_verified: true })
      .eq("id", id)
      .select(userSelect)
      .single();

    if (error) {
      throw new ApiError(500, "user_update_failed", error.message);
    }

    return mapUser(data as Record<string, unknown>);
  }

  async markFullyVerified(id: string): Promise<UserRecord> {
    const { data, error } = await supabaseAdmin
      .from("users")
      .update({ phone_verified: true, fully_verified: true })
      .eq("id", id)
      .select(userSelect)
      .single();

    if (error) {
      throw new ApiError(500, "user_update_failed", error.message);
    }

    return mapUser(data as Record<string, unknown>);
  }
}
