import type { UserRecord } from "../types/index";

export interface UserRepository {
  findById(id: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findByIds(ids: string[]): Promise<UserRecord[]>;
  upsertAuthUser(input: { id: string; email: string; phone?: string | null }): Promise<UserRecord>;
  updateProfile(id: string, patch: { full_name?: string | null; bio?: string | null; phone?: string | null }): Promise<UserRecord>;
  markEmailVerified(id: string): Promise<UserRecord>;
  markPhoneVerified(id: string): Promise<UserRecord>;
  markFullyVerified(id: string): Promise<UserRecord>;
}
