import test, { mock } from "node:test";
import assert from "node:assert/strict";

process.env.SUPABASE_URL ??= "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY ??= "anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "service-role-key";
process.env.SKIP_PHONE_VERIFICATION ??= "false";
if (!process.env.NODE_ENV) {
  Object.assign(process.env, { NODE_ENV: "test" });
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { withRoute } from "../../../server/lib/withRoute";
import { supabaseAnonClient } from "../../../server/config/supabase";
import { userRepository } from "../../../server/lib/container";
import type { AppUser } from "../../../server/types/index";

function makeUser(overrides: Partial<AppUser> = {}): AppUser {
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

test("withRoute returns 400 envelopes for validation failures", async () => {
  const handler = withRoute(async () => {
    throw new Error("should not run");
  }, {
    bodySchema: z.object({
      email: z.string().email(),
    }),
  });

  const request = new NextRequest("http://localhost/api/v1/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "not-an-email" }),
  });

  const response = await handler(request);
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.error.code, "validation_failed");
});

test("withRoute returns 401 when auth is required and no bearer token is provided", async () => {
  const handler = withRoute(async () => {
    throw new Error("should not run");
  }, {
    requireAuth: true,
  });

  const response = await handler(new NextRequest("http://localhost/api/v1/protected"));
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.error.code, "unauthorized");
});

test("withRoute returns 403 when verified access is required for an unverified user", async () => {
  const getUserMock = mock.method(supabaseAnonClient.auth, "getUser", async () => ({
    data: {
      user: {
        id: "11111111-1111-1111-1111-111111111111",
        email: "student@purdue.edu",
        phone: "+17651234567",
      },
    },
    error: null,
  }));
  const upsertMock = mock.method(userRepository, "upsertAuthUser", async () =>
    makeUser({ fully_verified: false, phone_verified: false }),
  );

  const handler = withRoute(async () => {
    throw new Error("should not run");
  }, {
    requireVerified: true,
  });

  try {
    const response = await handler(new NextRequest("http://localhost/api/v1/verified", {
      headers: { Authorization: "Bearer token" },
    }));
    const body = await response.json();

    assert.equal(response.status, 403);
    assert.equal(body.error.code, "verification_required");
  } finally {
    getUserMock.mock.restore();
    upsertMock.mock.restore();
  }
});

test("withRoute enforces rate limits before reaching the handler", async () => {
  let callCount = 0;
  const handler = withRoute(
    async () => {
      callCount += 1;
      return NextResponse.json({ success: true });
    },
    {
      rateLimit: {
        key: () => "rate-limit-test-key",
        maxRequests: 1,
        windowMs: 60_000,
        code: "too_many_requests",
        message: "Too many requests",
      },
    },
  );

  const first = await handler(new NextRequest("http://localhost/api/v1/rate"));
  const second = await handler(new NextRequest("http://localhost/api/v1/rate"));
  const secondBody = await second.json();

  assert.equal(first.status, 200);
  assert.equal(second.status, 429);
  assert.equal(secondBody.error.code, "too_many_requests");
  assert.equal(callCount, 1);
});
