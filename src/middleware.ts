import { auth } from "./lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/login") || 
                     req.nextUrl.pathname.startsWith("/register") ||
                     req.nextUrl.pathname.startsWith("/forgot-password");
  const isDashboardPage = req.nextUrl.pathname.startsWith("/dashboard") ||
                          req.nextUrl.pathname.startsWith("/jobs") ||
                          req.nextUrl.pathname.startsWith("/candidates") ||
                          req.nextUrl.pathname.startsWith("/screening") ||
                          req.nextUrl.pathname.startsWith("/analytics") ||
                          req.nextUrl.pathname.startsWith("/ai-assistant") ||
                          req.nextUrl.pathname.startsWith("/notifications") ||
                          req.nextUrl.pathname.startsWith("/settings");

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  // Protect dashboard routes
  if (!isLoggedIn && isDashboardPage) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
