import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(request) {
  let response = NextResponse.next({
    request: { headers: request.headers }
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "adolfo57chavez8@gmail.com").toLowerCase();
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isProtectedRoute =
    isAdminRoute ||
    request.nextUrl.pathname.startsWith("/ciclo") ||
    request.nextUrl.pathname.startsWith("/materia") ||
    request.nextUrl.pathname.startsWith("/unidad") ||
    request.nextUrl.pathname.startsWith("/carpeta") ||
    request.nextUrl.pathname.startsWith("/buscar");

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (isAdminRoute && user && (user.email || "").toLowerCase() !== adminEmail) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/ciclo/:path*",
    "/materia/:path*",
    "/unidad/:path*",
    "/carpeta/:path*",
    "/buscar/:path*"
  ]
};
