import test, { mock } from "node:test";
import assert from "node:assert/strict";

process.env.SUPABASE_URL ??= "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY ??= "anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "service-role-key";
process.env.SKIP_PHONE_VERIFICATION ??= "false";
if (!process.env.NODE_ENV) {
  Object.assign(process.env, { NODE_ENV: "test" });
}

import { AuthService } from "../../../server/services/auth.service";
import type { UserRecord } from "../../../server/types/index";
import type { UserRepository } from "../../../server/repositories/user.repository";
import { ApiError } from "../../../server/lib/apiError";
import { env } from "../../../server/config/env";

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
  const calls = {
    upsertAuthUser: [] as Array<{ id: string; email: string; phone?: string | null }>,
    markEmailVerified: [] as string[],
    markFullyVerified: [] as string[],
    findById: [] as string[],
  };

  const repository: UserRepository = {
    async findById(id) {
      calls.findById.push(id);
      return makeUser({ id });
    },
    async findByEmail() {
      return null;
    },
    async findByIds() {
      return [];
    },
    async upsertAuthUser(input) {
      calls.upsertAuthUser.push(input);
      return makeUser({ id: input.id, email: input.email, phone: input.phone ?? null });
    },
    async updateProfile() {
      return makeUser();
    },
    async markEmailVerified(id) {
      calls.markEmailVerified.push(id);
      return makeUser({ id, email_verified: true, fully_verified: false, phone_verified: false });
    },
    async markPhoneVerified() {
      return makeUser();
    },
    async markFullyVerified(id) {
      calls.markFullyVerified.push(id);
      return makeUser({ id });
    },
  };

  return { repository, calls };
}

test("AuthService.signup upserts the auth user and returns pending email verification", async () => {
  const { repository, calls } = createRepositoryStub();
  const service = new AuthService(repository);
  const fetchMock = mock.method(globalThis, "fetch", async () =>
    new Response(
      JSON.stringify({
        user: {
          id: "11111111-1111-1111-1111-111111111111",
          email: "student@purdue.edu",
          phone: null,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ),
  );

  try {
    const result = await service.signup("student@purdue.edu", "BoilerSub123!");
    assert.deepEqual(result, {
      status: "pending_email_verification",
      userId: "11111111-1111-1111-1111-111111111111",
    });
    assert.deepEqual(calls.upsertAuthUser, [
      {
        id: "11111111-1111-1111-1111-111111111111",
        email: "student@purdue.edu",
        phone: null,
      },
    ]);
    assert.equal(fetchMock.mock.calls.length, 1);
  } finally {
    fetchMock.mock.restore();
  }
});

test("AuthService.verifyEmail returns pending phone verification when phone verification is required", async () => {
  const originalSkip = env.SKIP_PHONE_VERIFICATION;
  env.SKIP_PHONE_VERIFICATION = false;

  const { repository, calls } = createRepositoryStub();
  const service = new AuthService(repository);
  const fetchMock = mock.method(globalThis, "fetch", async () =>
    new Response(
      JSON.stringify({
        user: {
          id: "11111111-1111-1111-1111-111111111111",
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ),
  );

  try {
    const result = await service.verifyEmail("student@purdue.edu", "123456");
    assert.deepEqual(result, { status: "pending_phone_verification" });
    assert.deepEqual(calls.markEmailVerified, ["11111111-1111-1111-1111-111111111111"]);
  } finally {
    env.SKIP_PHONE_VERIFICATION = originalSkip;
    fetchMock.mock.restore();
  }
});

test("AuthService.login rejects users who are not fully verified", async () => {
  const repository: UserRepository = {
    async findById() {
      return makeUser({ fully_verified: false, email_verified: true, phone_verified: false });
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
    async updateProfile() {
      return makeUser();
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

  const service = new AuthService(repository);
  const fetchMock = mock.method(globalThis, "fetch", async () =>
    new Response(
      JSON.stringify({
        user: {
          id: "11111111-1111-1111-1111-111111111111",
        },
        access_token: "token",
        refresh_token: "refresh",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ),
  );

  try {
    await assert.rejects(
      service.login("student@purdue.edu", "BoilerSub123!"),
      (error: unknown) =>
        error instanceof ApiError &&
        error.statusCode === 403 &&
        error.code === "verification_required",
    );
  } finally {
    fetchMock.mock.restore();
  }
});
