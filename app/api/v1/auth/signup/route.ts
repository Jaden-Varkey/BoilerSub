export const dynamic = "force-dynamic";

import { authService } from "@/server/lib/container";
import { signupSchema } from "@/server/schemas/auth.schema";
import { withRoute, jsonSuccess } from "@/server/lib/withRoute";

export const POST = withRoute(
  async ({ body }) => jsonSuccess(await authService.signup(body.email, body.password), 201),
  {
    bodySchema: signupSchema,
    rateLimit: {
      key: ({ request }) => request.headers.get("x-forwarded-for"),
      maxRequests: 10,
      windowMs: 60 * 60 * 1000,
      code: "signup_rate_limited",
      message: "Too many signup attempts",
    },
  },
);
