export const dynamic = "force-dynamic";

import { withRoute, jsonSuccess } from "@/server/lib/withRoute";

export const GET = withRoute(async () => jsonSuccess({ status: "ok" }));
