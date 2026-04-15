import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PASSWORD_COOKIE = "ss_auth";

// Password gate — only active when DASHBOARD_PASSWORD env var is set.
// Leave DASHBOARD_PASSWORD empty (or unset) for a fully public dashboard.
export function proxy(req: NextRequest) {
  const password = process.env.DASHBOARD_PASSWORD;

  // No password configured — let everything through
  if (!password) return NextResponse.next();

  const { pathname } = req.nextUrl;

  // Always allow the login page and API routes
  if (pathname.startsWith("/login") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Check for valid auth cookie
  const cookie = req.cookies.get(PASSWORD_COOKIE);
  if (cookie?.value === password) return NextResponse.next();

  // Redirect to login
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
