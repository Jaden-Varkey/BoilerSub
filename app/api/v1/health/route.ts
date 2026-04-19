import { handleRequest, preflightResponse } from "#server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleRequest(
    request,
    async () =>
      new Response(JSON.stringify({ success: true, data: { status: "ok" } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
  );
}

export async function OPTIONS(request: Request) {
  return handleRequest(request, async (context) => preflightResponse(request, context.requestId));
}
