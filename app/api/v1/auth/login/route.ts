export const dynamic = "force-dynamic";

import { authService } from "@/server/lib/container";
import { loginSchema } from "@/server/schemas/auth.schema";
import { withRoute, jsonSuccess } from "@/server/lib/withRoute";

export const POST = withRoute(
  async ({ body }) => jsonSuccess(await authService.login(body.email, body.password)),
  {
    bodySchema: loginSchema,
    rateLimit: {
      key: ({ request }) => request.headers.get("x-forwarded-for"),
      maxRequests: 10,
      windowMs: 5 * 60 * 1000,
      code: "login_rate_limited",
      message: "Too many login attempts",
    },
  },
);
