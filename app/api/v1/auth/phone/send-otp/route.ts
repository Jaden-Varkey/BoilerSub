export const dynamic = "force-dynamic";

import { authService } from "@/server/lib/container";
import { sendPhoneOtpSchema } from "@/server/schemas/auth.schema";
import { withRoute, jsonSuccess } from "@/server/lib/withRoute";

export const POST = withRoute(
  async ({ body, auth }) =>
    jsonSuccess(
      await authService.sendPhoneOtp({
        accessToken: auth?.accessToken ?? "",
        phone: body.phone,
      }),
    ),
  {
    bodySchema: sendPhoneOtpSchema,
    requireAuth: true,
    rateLimit: {
      key: ({ body }) => (typeof body === "object" && body && "phone" in body ? String(body.phone) : undefined),
      maxRequests: 3,
      windowMs: 10 * 60 * 1000,
      code: "phone_otp_rate_limited",
      message: "Too many phone OTP requests",
    },
  },
);
