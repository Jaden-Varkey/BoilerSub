export const dynamic = "force-dynamic";

import { withRoute, jsonSuccess } from "@/server/lib/withRoute";

export const GET = withRoute(
  async ({ user }) => jsonSuccess({ user }),
  {
    requireAuth: true,
  },
);
