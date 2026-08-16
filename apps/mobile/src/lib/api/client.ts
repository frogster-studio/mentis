// Nothing else in the app speaks HTTP, and no response reaches a caller unparsed — drift dies here.

import type { ErrorCode, ErrorResponse } from "@mentis/contracts/shared";
import { errorResponseSchema } from "@mentis/contracts/shared";

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

type QueryValue = string | undefined;

export type ApiRequest = {
  method: "GET" | "POST" | "DELETE";
  path: string;
  query?: Record<string, QueryValue>;
  body?: unknown;
};

// Structural, so the seam tracks contract schemas without a direct zod dependency.
type ResponseSchema<T> = { parse: (value: unknown) => T };

export type ApiClientDeps = {
  baseUrl: string;
  fetch: typeof globalThis.fetch;
  // The current access token, or null when signed out. Guarded calls only.
  getToken: () => Promise<string | null>;
  // On a guarded 401 supabase-js has already tried refreshing, so the session is unrecoverable.
  onUnauthenticated: () => void;
};

export type ApiClient = {
  requestJson: <T>(request: ApiRequest, schema: ResponseSchema<T>) => Promise<T>;
  requestNoContent: (request: ApiRequest) => Promise<void>;
};

// Deriving the header from the guard prefix keeps token and guard boundaries from drifting apart.
function isGuarded(path: string): boolean {
  return path.startsWith("/app/me");
}

// A blank value is no value, so it never reaches the wire.
function serializeQuery(query: Record<string, QueryValue> | undefined): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "") continue;
    params.set(key, value);
  }
  const serialized = params.toString();
  return serialized === "" ? "" : `?${serialized}`;
}

// A proxy or a crash can put junk on the wire; it degrades to INTERNAL rather than a parse error.
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

export function createApiClient(deps: ApiClientDeps): ApiClient {
  const baseUrl = deps.baseUrl.replace(/\/$/, "");

  async function headersFor(request: ApiRequest): Promise<Record<string, string>> {
    const headers: Record<string, string> = {};
    if (request.body !== undefined) {
      headers["content-type"] = "application/json";
    }
    if (!isGuarded(request.path)) {
      return headers;
    }
    const token = await deps.getToken();
    if (token) {
      headers.authorization = `Bearer ${token}`;
    }
    // A guarded call without a token still goes out — the 401 path is the single reaction point.
    return headers;
  }

  async function send(request: ApiRequest): Promise<unknown> {
    const hasBody = request.body !== undefined;
    const response = await deps.fetch(`${baseUrl}${request.path}${serializeQuery(request.query)}`, {
      method: request.method,
      headers: await headersFor(request),
      ...(hasBody ? { body: JSON.stringify(request.body) } : {}),
    });

    if (!response.ok) {
      const error = await toApiError(response);
      // A 401 from a public read says nothing about the token, so only guarded calls may sign out.
      if (error.code === "UNAUTHENTICATED" && isGuarded(request.path)) {
        deps.onUnauthenticated();
      }
      throw error;
    }

    return response.status === 204 ? undefined : await response.json();
  }

  return {
    requestJson: async (request, schema) => schema.parse(await send(request)),
    requestNoContent: async (request) => {
      await send(request);
    },
  };
}
