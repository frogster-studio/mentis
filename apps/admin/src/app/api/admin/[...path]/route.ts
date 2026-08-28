import type { ErrorResponse } from "@mentis/contracts/shared";
import type { NextRequest } from "next/server";

import { createEditorClient } from "@/lib/auth/editor-session";

const EXPIRED_SESSION: ErrorResponse = {
  statusCode: 401,
  error: "Unauthorized",
  message: "The editor session has expired.",
  code: "UNAUTHENTICATED",
};

type RouteContext = { params: Promise<{ path: string[] }> };

function apiBaseUrl(): string {
  const url = process.env.API_URL;
  if (!url) {
    throw new Error("API_URL must be set");
  }
  return url.replace(/\/$/, "");
}

// The single hop to the API: the browser holds neither the API host nor the editor token (ADR 0002).
async function forward(request: NextRequest, { params }: RouteContext): Promise<Response> {
  const supabase = await createEditorClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    return Response.json(EXPIRED_SESSION, { status: EXPIRED_SESSION.statusCode });
  }

  const { path } = await params;
  const body = request.body === null ? undefined : await request.text();
  const response = await fetch(`${apiBaseUrl()}/admin/${path.join("/")}${request.nextUrl.search}`, {
    method: request.method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    body,
    cache: "no-store",
  });

  if (response.status === 204) {
    return new Response(null, { status: 204 });
  }
  return new Response(response.body, {
    status: response.status,
    headers: { "content-type": "application/json" },
  });
}

// Next routes by verb-named export, and every verb is the same hop.
export { forward as DELETE, forward as GET, forward as PATCH, forward as POST };
