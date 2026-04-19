export const dynamic = "force-dynamic";

import { authService } from "@/server/lib/container";
import { resendPhoneOtpSchema } from "@/server/schemas/auth.schema";
import { withRoute, jsonSuccess } from "@/server/lib/withRoute";

export const POST = withRoute(
  async ({ body }) => jsonSuccess(await authService.resendPhoneOtp(body.phone)),
  {
    bodySchema: resendPhoneOtpSchema,
    rateLimit: {
      key: ({ body }) => (typeof body === "object" && body && "phone" in body ? String(body.phone) : undefined),
      maxRequests: 3,
      windowMs: 10 * 60 * 1000,
      code: "phone_otp_resend_rate_limited",
      message: "Too many phone OTP resend attempts",
    },
  },
);
