export const dynamic = "force-dynamic";

import { authService } from "@/server/lib/container";
import { withRoute, jsonSuccess } from "@/server/lib/withRoute";

export const POST = withRoute(
  async ({ auth }) => jsonSuccess(await authService.logout(auth?.accessToken ?? "")),
  {
    requireAuth: true,
  },
);
