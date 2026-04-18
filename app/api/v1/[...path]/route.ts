import { handleRequest, preflightResponse } from "#server/http";
import { dispatchApiV1 } from "#server/v1";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function resolveSegments(context: { params?: { path?: string[] } | Promise<{ path?: string[] }> }): Promise<string[]> {
  const params = await Promise.resolve(context.params ?? {});
  return Array.isArray(params.path) ? params.path : [];
}

export async function GET(request: Request, context: { params?: { path?: string[] } | Promise<{ path?: string[] }> }) {
  return dispatchApiV1(request, await resolveSegments(context));
}

export async function POST(request: Request, context: { params?: { path?: string[] } | Promise<{ path?: string[] }> }) {
  return dispatchApiV1(request, await resolveSegments(context));
}

export async function PATCH(request: Request, context: { params?: { path?: string[] } | Promise<{ path?: string[] }> }) {
  return dispatchApiV1(request, await resolveSegments(context));
}

export async function DELETE(request: Request, context: { params?: { path?: string[] } | Promise<{ path?: string[] }> }) {
  return dispatchApiV1(request, await resolveSegments(context));
}

export async function OPTIONS(request: Request) {
  return handleRequest(request, async (context) => preflightResponse(request, context.requestId));
}
