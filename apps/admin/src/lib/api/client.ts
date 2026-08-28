import { errorResponseSchema } from "@mentis/contracts/shared";

// Structural, so the seam tracks contract schemas without a direct zod dependency.
type ResponseSchema<T> = { parse: (value: unknown) => T };

// A crash or the proxy's own redirect can put junk on the wire, so the status is the fallback.
async function toError(response: Response): Promise<Error> {
  const body = await response.json().catch(() => null);
  const parsed = errorResponseSchema.safeParse(body);
  return new Error(parsed.success ? parsed.data.message : `The API answered ${response.status}.`);
}

type ApiMethod = "GET" | "POST" | "PATCH" | "DELETE";

async function callApi(method: ApiMethod, path: string, body?: unknown): Promise<Response> {
  const response = await fetch(`/api/admin${path}`, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    throw await toError(response);
  }
  return response;
}

export async function getFromApi<T>(
  path: string,
  schema: ResponseSchema<T>,
  query?: Record<string, string>,
): Promise<T> {
  const search = query ? `?${new URLSearchParams(query).toString()}` : "";
  const response = await callApi("GET", `${path}${search}`);
  return schema.parse(await response.json());
}

export async function sendToApi<T>(
  method: "POST" | "PATCH",
  path: string,
  body: unknown,
  schema: ResponseSchema<T>,
): Promise<T> {
  const response = await callApi(method, path, body);
  return schema.parse(await response.json());
}

export async function deleteFromApi(path: string): Promise<void> {
  await callApi("DELETE", path);
}
