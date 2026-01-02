import { NextRequest, NextResponse } from "next/server";
import { requirePermission, requireAuth } from "@/lib/auth";
import type { Permission } from "@/lib/rbac";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/db/schema";

/**
 * Helper to protect API routes with authentication and RBAC
 */
export function withAuth<T = unknown>(
  handler: (request: NextRequest, context: { user: User; profile: Profile }) => Promise<T | NextResponse<T>>,
  permission?: Permission
) {
  return async (request: NextRequest): Promise<NextResponse<T | { error: string; message: string }>> => {
    try {
      console.log(`[withAuth] Starting auth check for ${permission || "no permission"}`);
      const { user, profile } = permission
        ? await requirePermission(permission)
        : await requireAuth();
      
      console.log(`[withAuth] Auth successful - user: ${user?.id}, profile: ${profile?.id}`);

      const result = await handler(request, { user, profile });

      if (result instanceof NextResponse) {
        return result;
      }

      return NextResponse.json(result);
    } catch (error) {
      console.error(`[withAuth] Error caught:`, error);
      if (error instanceof Error) {
        if (error.message.includes("Unauthorized")) {
          return NextResponse.json(
            { error: "Unauthorized", message: error.message } as T & { error: string; message: string },
            { status: 401 }
          );
        }
        if (error.message.includes("Missing permission")) {
          return NextResponse.json(
            { error: "Forbidden", message: error.message } as T & { error: string; message: string },
            { status: 403 }
          );
        }
      }

      console.error("API error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      const errorStack = error instanceof Error ? error.stack : undefined;
      // Include error message in development for debugging
      const isDevelopment = process.env.NODE_ENV === "development";
      console.error("Error details:", {
        message: errorMessage,
        stack: errorStack,
        error: error,
      });
      return NextResponse.json(
        { 
          error: "Internal Server Error", 
          message: isDevelopment ? errorMessage : "An unexpected error occurred",
          ...(isDevelopment && errorStack ? { stack: errorStack } : {}),
        } as T & { error: string; message: string },
        { status: 500 }
      );
    }
  };
}

