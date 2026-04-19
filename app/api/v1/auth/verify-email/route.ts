export const dynamic = "force-dynamic";

import { authService } from "@/server/lib/container";
import { verifyEmailSchema } from "@/server/schemas/auth.schema";
import { withRoute, jsonSuccess } from "@/server/lib/withRoute";

export const POST = withRoute(
  async ({ body }) => jsonSuccess(await authService.verifyEmail(body.email, body.token)),
  {
    bodySchema: verifyEmailSchema,
    rateLimit: {
      key: ({ body }) => (typeof body === "object" && body && "email" in body ? String(body.email) : undefined),
      maxRequests: 5,
      windowMs: 10 * 60 * 1000,
      code: "email_verify_rate_limited",
      message: "Too many email verification attempts",
    },
  },
);
