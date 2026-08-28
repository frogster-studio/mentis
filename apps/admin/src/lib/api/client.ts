import { errorResponseSchema } from "@mentis/contracts/shared";

// Structural, so the seam tracks contract schemas without a direct zod dependency.
type ResponseSchema<T> = { parse: (value: unknown) => T };

// A crash or the proxy's own redirect can put junk on the wire, so the status is the fallback.
async function toError(response: Response): Promise<Error> {
  const body = await response.json().catch(() => null);
  const parsed = errorResponseSchema.safeParse(body);
  return new Error(parsed.success ? parsed.data.message : `The API answered ${response.status}.`);
}

export async function getFromApi<T>(
  path: string,
  schema: ResponseSchema<T>,
  query?: Record<string, string>,
): Promise<T> {
  const search = query ? `?${new URLSearchParams(query).toString()}` : "";
  const response = await fetch(`/api/admin${path}${search}`);
  if (!response.ok) {
    throw await toError(response);
  }
  return schema.parse(await response.json());
}
