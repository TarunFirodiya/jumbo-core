import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/auth/callback"];

// Routes that should redirect to dashboard if already authenticated
const AUTH_ROUTES = ["/login"];

// All dashboard routes require authentication
const DASHBOARD_ROUTES = [
  "/buyers",
  "/sellers",
  "/listings",
  "/visits",
  "/offers",
  "/settings",
];

function isProtectedRoute(pathname: string): boolean {
  // Root path is the dashboard, which is protected
  if (pathname === "/") return true;
  
  // Check if it's a dashboard route
  if (DASHBOARD_ROUTES.some((route) => pathname.startsWith(route))) {
    return true;
  }

  // All other routes except public ones are protected
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return false;
  }

  // API routes are handled separately, but we protect non-auth API routes
  if (pathname.startsWith("/api") && !pathname.startsWith("/api/auth")) {
    return true;
  }

  return true;
}

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // If Supabase is not configured, allow all requests (dev mode)
  if (!supabase) {
    return supabaseResponse;
  }

  // Check if route is protected
  const isProtected = isProtectedRoute(pathname);

  // Check if route is an auth route (login/signup)
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Redirect unauthenticated users to login
  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth routes
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Note: Role-based page access is enforced at the server component level
  // (see requireRole in lib/auth.ts) rather than in middleware, because
  // middleware uses the Supabase anon key which is subject to RLS and cannot
  // reliably query the team table. API-level permissions are enforced via
  // withAuth + requirePermission in each route handler.

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

