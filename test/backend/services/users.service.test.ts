import test from "node:test";
import assert from "node:assert/strict";

import { UsersService } from "../../../server/services/users.service";
import type { UserRecord } from "../../../server/types/index";
import type { UserRepository } from "../../../server/repositories/user.repository";

function makeUser(overrides: Partial<UserRecord> = {}): UserRecord {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    email: "student@purdue.edu",
    phone: "+17651234567",
    full_name: "Boiler Student",
    bio: "Hello",
    email_verified: true,
    phone_verified: true,
    fully_verified: true,
    role: "user",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function createRepositoryStub() {
  const calls: { updateProfile: Array<{ id: string; patch: { full_name?: string | null; bio?: string | null; phone?: string | null } }> } = {
    updateProfile: [],
  };

  const repository: UserRepository = {
    async findById() {
      return null;
    },
    async findByEmail() {
      return null;
    },
    async findByIds() {
      return [];
    },
    async upsertAuthUser() {
      return makeUser();
    },
    async updateProfile(id, patch) {
      calls.updateProfile.push({ id, patch });
      return makeUser({ ...patch, updated_at: "2026-01-02T00:00:00.000Z" });
    },
    async markEmailVerified() {
      return makeUser();
    },
    async markPhoneVerified() {
      return makeUser();
    },
    async markFullyVerified() {
      return makeUser();
    },
  };

  return { repository, calls };
}

test("UsersService.updateMe forwards phone updates to the repository", async () => {
  const { repository, calls } = createRepositoryStub();
  const service = new UsersService(repository);

  const result = await service.updateMe("11111111-1111-1111-1111-111111111111", {
    full_name: "Updated Name",
    bio: "Updated bio",
    phone: "+17659876543",
  });

  assert.deepEqual(calls.updateProfile, [
    {
      id: "11111111-1111-1111-1111-111111111111",
      patch: {
        full_name: "Updated Name",
        bio: "Updated bio",
        phone: "+17659876543",
      },
    },
  ]);
  assert.equal(result.phone, "+17659876543");
  assert.equal(result.full_name, "Updated Name");
  assert.equal(result.bio, "Updated bio");
});
