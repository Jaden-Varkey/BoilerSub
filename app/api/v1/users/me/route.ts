export const dynamic = "force-dynamic";

import { usersService } from "@/server/lib/container";
import { updateMeSchema } from "@/server/schemas/users.schema";
import { withRoute, jsonSuccess } from "@/server/lib/withRoute";

export const PATCH = withRoute(
  async ({ body, user }) => jsonSuccess(await usersService.updateMe(user!.id, body)),
  {
    requireAuth: true,
    requireVerified: true,
    bodySchema: updateMeSchema,
  },
);
