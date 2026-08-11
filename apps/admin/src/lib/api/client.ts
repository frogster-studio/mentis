import type { ErrorCode, ErrorResponse } from "@mentis/contracts/shared";
import { errorResponseSchema } from "@mentis/contracts/shared";
import { redirect } from "next/navigation";

import { createEditorClient, endEditorSession } from "@/lib/auth/editor-session";

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly details: unknown;

  constructor(response: ErrorResponse) {
    super(response.message);
    this.name = "ApiError";
    this.statusCode = response.statusCode;
    this.code = response.code;
    this.details = response.details;
  }
}

export function isApiError(error: unknown, code: ErrorCode): error is ApiError {
  return error instanceof ApiError && error.code === code;
}

type QueryValue = string | number | undefined;

type ApiRequest = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  query?: Record<string, QueryValue>;
  body?: unknown;
};

// Typed structurally so the seam tracks the contract schemas without depending
// on the schema library's exported types.
type ResponseSchema<T> = { parse: (value: unknown) => T };

function apiUrl(): string {
  const url = process.env.API_URL;
  if (!url) {
    throw new Error("API_URL must be set");
  }
  return url.replace(/\/$/, "");
}

// A blank filter is no filter, so it never reaches the wire.
function serializeQuery(query: Record<string, QueryValue> | undefined): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "") continue;
    params.set(key, String(value));
  }
  const serialized = params.toString();
  return serialized === "" ? "" : `?${serialized}`;
}

async function editorAccessToken(): Promise<string> {
  const supabase = await createEditorClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    redirect("/login");
  }
  return token;
}

async function toApiError(response: Response): Promise<ApiError> {
  const body = await response.json().catch(() => null);
  const parsed = errorResponseSchema.safeParse(body);
  if (parsed.success) {
    return new ApiError(parsed.data);
  }
  return new ApiError({
    statusCode: response.status,
    error: response.statusText,
    message: `The API answered ${response.status}.`,
    code: "INTERNAL",
  });
}

async function send(request: ApiRequest): Promise<unknown> {
  const token = await editorAccessToken();
  const hasBody = request.body !== undefined;
  const response = await fetch(`${apiUrl()}${request.path}${serializeQuery(request.query)}`, {
    method: request.method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(hasBody ? { "content-type": "application/json" } : {}),
    },
    ...(hasBody ? { body: JSON.stringify(request.body) } : {}),
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await toApiError(response);
    if (error.code === "UNAUTHENTICATED") {
      redirect("/login");
    }
    // Login gates on the editor claim, so a 403 means it was revoked mid-session.
    if (error.code === "FORBIDDEN") {
      endEditorSession();
    }
    throw error;
  }

  return response.status === 204 ? undefined : await response.json();
}

// Drift dies here: every response is parsed through its contract schema.
export async function requestJson<T>(request: ApiRequest, schema: ResponseSchema<T>): Promise<T> {
  return schema.parse(await send(request));
}

export async function requestNoContent(request: ApiRequest): Promise<void> {
  await send(request);
}
