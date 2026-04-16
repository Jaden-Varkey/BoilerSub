export const dynamic = "force-dynamic";

import { listingsService } from "@/server/lib/container";
import { listingCreateSchema, listingListQuerySchema } from "@/server/schemas/listings.schema";
import { withRoute, jsonSuccess } from "@/server/lib/withRoute";

export const GET = withRoute(
  async ({ query }) => jsonSuccess(await listingsService.list(query)),
  {
    requireAuth: true,
    querySchema: listingListQuerySchema,
  },
);

export const POST = withRoute(
  async ({ body, user }) => jsonSuccess(await listingsService.create(user!, body)),
  {
    requireAuth: true,
    requireVerified: true,
    bodySchema: listingCreateSchema,
  },
);
