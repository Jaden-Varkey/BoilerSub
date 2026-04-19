export const dynamic = "force-dynamic";

import { usersService } from "@/server/lib/container";
import { userIdParamSchema } from "@/server/schemas/users.schema";
import { withRoute, jsonSuccess } from "@/server/lib/withRoute";

export const GET = withRoute(
  async ({ params }) => jsonSuccess(await usersService.getUserById(String(params.id))),
  {
    requireAuth: true,
    paramsSchema: userIdParamSchema,
  },
);
