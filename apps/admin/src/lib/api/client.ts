import { errorResponseSchema } from "@mentis/contracts/shared";

// Structural, so the seam tracks contract schemas without a direct zod dependency.
type ResponseSchema<T> = { parse: (value: unknown) => T };

// A crash or the proxy's own redirect can put junk on the wire, so the status is the fallback.
async function toError(response: Response): Promise<Error> {
  const body = await response.json().catch(() => null);
  const parsed = errorResponseSchema.safeParse(body);
  return new Error(parsed.success ? parsed.data.message : `The API answered ${response.status}.`);
}

type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ApiBody = { content: BodyInit; contentType: string };

async function callApi(method: ApiMethod, path: string, body?: ApiBody): Promise<Response> {
  const response = await fetch(`/api/admin${path}`, {
    method,
    headers: body === undefined ? undefined : { "content-type": body.contentType },
    body: body?.content,
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
  const response = await callApi(method, path, {
    content: JSON.stringify(body),
    contentType: "application/json",
  });
  return schema.parse(await response.json());
}

// Some browsers give a WebP no MIME type, and the API judges the bytes, never the label.
export async function putFileToApi<T>(
  path: string,
  file: Blob,
  schema: ResponseSchema<T>,
): Promise<T> {
  const response = await callApi("PUT", path, {
    content: file,
    contentType: file.type || "application/octet-stream",
  });
  return schema.parse(await response.json());
}

export async function deleteFromApi(path: string): Promise<void> {
  await callApi("DELETE", path);
}
