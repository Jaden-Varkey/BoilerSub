export const dynamic = "force-dynamic";

import { authService } from "@/server/lib/container";
import { resendEmailOtpSchema } from "@/server/schemas/auth.schema";
import { withRoute, jsonSuccess } from "@/server/lib/withRoute";

export const POST = withRoute(
  async ({ body }) => jsonSuccess(await authService.resendEmailOtp(body.email)),
  {
    bodySchema: resendEmailOtpSchema,
    rateLimit: {
      key: ({ body }) => (typeof body === "object" && body && "email" in body ? String(body.email) : undefined),
      maxRequests: 3,
      windowMs: 10 * 60 * 1000,
      code: "email_otp_resend_rate_limited",
      message: "Too many email OTP resend attempts",
    },
  },
);
