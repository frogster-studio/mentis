// The seam: every call to the API gateway goes through here, and nothing else in the app speaks
// HTTP. A pure factory over injected `{fetch, getToken, onUnauthenticated}` (the app's injectability
// rule), so the whole thing is testable without a network, a session or a running app — the
// composition module next door wires the real ones.
//
// Two invariants it exists to hold: no response reaches a caller unparsed (drift dies here, not in a
// component three screens later), and the Authorization header follows the server's own boundary —
// the `/app/me` prefix is the guard boundary on the API, so it is the token boundary here. A public
// read behaves identically signed-in and signed-out because the header is never even built.

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

// Typed structurally so the seam tracks the contract schemas without depending on the schema
// library's exported types (mobile has no direct zod).
type ResponseSchema<T> = { parse: (value: unknown) => T };

export type ApiClientDeps = {
  baseUrl: string;
  fetch: typeof globalThis.fetch;
  // The current access token, or null when signed out. Guarded calls only.
  getToken: () => Promise<string | null>;
  // A guarded call came back 401: supabase-js has already had its chance to refresh, so the session
  // is unrecoverable. The composition module signs out globally; the auth listener lands the UI.
  onUnauthenticated: () => void;
};

export type ApiClient = {
  requestJson: <T>(request: ApiRequest, schema: ResponseSchema<T>) => Promise<T>;
  requestNoContent: (request: ApiRequest) => Promise<void>;
};

// The API's namespace prefix is its guard boundary (`SupabaseUserGuard` on `/app/me/*`, nothing on
// the public reads). Deriving the header from the same prefix means a new guarded route cannot be
// added without its token, and a public one cannot accidentally start sending it.
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

// Every non-2xx body is the shared ErrorResponse envelope — but a proxy, a cold start or a crash can
// still put something else on the wire, so an unparseable body degrades to INTERNAL rather than
// throwing a parse error over the real failure.
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
    // No token on a guarded call still goes out: the server answers 401 and the sign-out below is
    // the single place that reacts to a dead session.
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
      // Only a guarded call can report on the session. A 401 from a public read says nothing about
      // the Player's token, and signing them out mid-session over it would be a bug with a plausible
      // cause — a misrouted proxy answer, say.
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
