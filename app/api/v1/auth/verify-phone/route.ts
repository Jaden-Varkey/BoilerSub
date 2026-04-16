export const dynamic = "force-dynamic";

import { authService } from "@/server/lib/container";
import { verifyPhoneSchema } from "@/server/schemas/auth.schema";
import { withRoute, jsonSuccess } from "@/server/lib/withRoute";

export const POST = withRoute(
  async ({ body }) => jsonSuccess(await authService.verifyPhone(body.phone, body.token)),
  {
    bodySchema: verifyPhoneSchema,
    rateLimit: {
      key: ({ body }) => (typeof body === "object" && body && "phone" in body ? String(body.phone) : undefined),
      maxRequests: 5,
      windowMs: 10 * 60 * 1000,
      code: "phone_verify_rate_limited",
      message: "Too many phone verification attempts",
    },
  },
);
