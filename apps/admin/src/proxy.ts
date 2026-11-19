import { type NextRequest, NextResponse } from "next/server";

import { createSupabaseClient } from "@/lib/supabase";

// Authorization lives at the login-time editor gate and the API guard, never here.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createSupabaseClient({
    getAll: () => request.cookies.getAll(),
    setAll: (cookiesToSet) => {
      for (const { name, value } of cookiesToSet) {
        request.cookies.set(name, value);
      }
      response = NextResponse.next({ request });
      for (const { name, value, options } of cookiesToSet) {
        response.cookies.set(name, value, options);
      }
    },
  });

  // Refreshes the session, then verifies the token locally against the project JWKS.
  const { data: claims } = await supabase.auth.getClaims();
  const isLoginPage = request.nextUrl.pathname === "/login";

  if (!claims && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (claims && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return response;
}

export const config = {
  // Everything except static assets goes through the session gate.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|fonts).*)"],
};
