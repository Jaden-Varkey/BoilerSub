import { NextResponse } from "next/server";

export type SuccessEnvelope<T> = {
  success: true;
  data: T;
};

export type ErrorEnvelope = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function successEnvelope<T>(data: T): SuccessEnvelope<T> {
  return { success: true, data };
}

export function errorEnvelope(code: string, message: string, details?: unknown): ErrorEnvelope {
  const error: ErrorEnvelope["error"] = { code, message };
  if (details !== undefined) {
    error.details = details;
  }
  return { success: false, error };
}

export function jsonSuccess<T>(data: T, status = 200): NextResponse<SuccessEnvelope<T>> {
  return NextResponse.json(successEnvelope(data), { status });
}

export function jsonError(
  code: string,
  message: string,
  status = 500,
  details?: unknown,
): NextResponse<ErrorEnvelope> {
  return NextResponse.json(errorEnvelope(code, message, details), { status });
}
