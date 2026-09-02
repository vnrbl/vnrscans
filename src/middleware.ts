import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Server-side route boundary guard for Admin routes
  if (pathname.startsWith("/admin")) {
    // Check for presence of Supabase auth cookie
    // Supabase stores auth cookies matching `sb-*-auth-token` or custom auth tokens
    const cookies = request.cookies.getAll();
    const hasAuthCookie = cookies.some(
      (c) =>
        c.name.includes("auth-token") ||
        c.name.includes("sb-access-token") ||
        c.name.includes("supabase.auth.token") ||
        c.name.startsWith("sb-")
    );

    // If completely unauthenticated, redirect directly to /auth with return URL
    if (!hasAuthCookie) {
      const loginUrl = new URL("/auth", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Attach security headers
  const response = NextResponse.next();

  // Protect against MIME sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");
  // Protect against Clickjacking
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Permissions policy
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
