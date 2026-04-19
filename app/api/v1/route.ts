import { errorResponse, handleRequest, preflightResponse } from "#server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleRequest(request, async (context) => errorResponse(context.requestId, 404, "not_found", "Route not found"));
}

export async function POST(request: Request) {
  return handleRequest(request, async (context) => errorResponse(context.requestId, 404, "not_found", "Route not found"));
}

export async function PATCH(request: Request) {
  return handleRequest(request, async (context) => errorResponse(context.requestId, 404, "not_found", "Route not found"));
}

export async function DELETE(request: Request) {
  return handleRequest(request, async (context) => errorResponse(context.requestId, 404, "not_found", "Route not found"));
}

export async function OPTIONS(request: Request) {
  return handleRequest(request, async (context) => preflightResponse(request, context.requestId));
}
