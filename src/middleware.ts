import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Server-side route boundary guard for Admin routes
  if (pathname.startsWith("/admin")) {
    const cookies = request.cookies.getAll();
    const hasAuthCookie = cookies.some(
      (c) =>
        c.name.includes("auth-token") ||
        c.name.includes("sb-access-token") ||
        c.name.includes("supabase.auth.token") ||
        c.name.startsWith("sb-")
    );

    // If completely unauthenticated, redirect directly to /auth
    if (!hasAuthCookie) {
      const loginUrl = new URL("/auth", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
