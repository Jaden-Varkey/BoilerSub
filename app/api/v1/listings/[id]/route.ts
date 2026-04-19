export const dynamic = "force-dynamic";

import { listingsService } from "@/server/lib/container";
import { listingIdSchema, listingUpdateSchema } from "@/server/schemas/listings.schema";
import { withRoute, jsonSuccess } from "@/server/lib/withRoute";

export const GET = withRoute(
  async ({ params }) => jsonSuccess(await listingsService.getById(String(params.id))),
  {
    requireAuth: true,
    paramsSchema: listingIdSchema,
  },
);

export const PATCH = withRoute(
  async ({ params, body, user }) => jsonSuccess(await listingsService.update(user!, String(params.id), body)),
  {
    requireAuth: true,
    requireVerified: true,
    paramsSchema: listingIdSchema,
    bodySchema: listingUpdateSchema,
  },
);

export const DELETE = withRoute(
  async ({ params, user }) => {
    await listingsService.delete(user!, String(params.id));
    return jsonSuccess({ ok: true });
  },
  {
    requireAuth: true,
    requireVerified: true,
    paramsSchema: listingIdSchema,
  },
);
