import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { team } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/db/schema";
import { hasPermission, type Permission } from "@/lib/rbac";

/**
 * Get the current authenticated user and their team member record
 */
export async function getCurrentUserWithProfile() {
  try {
    // Check if Supabase env vars are configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      // During build time or when env vars aren't set, return null
      // This allows pages to be built without failing
      return { user: null, profile: null };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("Auth error in getCurrentUserWithProfile:", authError);
      return { user: null, profile: null };
    }

    if (!user) {
      console.log("No user found in getCurrentUserWithProfile");
      return { user: null, profile: null };
    }

    // Fetch team member record
    try {
      const profile = await db.query.team.findFirst({
        where: eq(team.id, user.id),
      });

      if (!profile) {
        console.warn(`Team member not found for user ${user.id}`);
      }

      return { user, profile };
    } catch (dbError) {
      console.error("Database error in getCurrentUserWithProfile:", dbError);
      throw dbError;
    }
  } catch (error) {
    // If Supabase client creation fails (e.g., during build), return null
    // This prevents build failures when env vars aren't configured
    if (error instanceof Error && error.message.includes("Supabase client")) {
      return { user: null, profile: null };
    }
    console.error("Unexpected error in getCurrentUserWithProfile:", error);
    throw error;
  }
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth() {
  try {
    // During build time, if env vars aren't set, skip auth check
    // This allows the build to complete, but the page will be dynamic
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      // In production, this should never happen, but during build it might
      // Return a mock response to allow build to continue
      // The page is marked as dynamic, so it will be rendered at request time anyway
      throw new Error("Unauthorized: Authentication required");
    }

    const { user, profile } = await getCurrentUserWithProfile();

    if (!user) {
      console.error("requireAuth: No user found");
      throw new Error("Unauthorized: Authentication required");
    }

    if (!profile) {
      console.error(`requireAuth: Team member not found for user ${user.id}`);
      throw new Error("Unauthorized: User profile not found");
    }

    return { user, profile };
  } catch (error) {
    console.error("Error in requireAuth:", error);
    throw error;
  }
}

/**
 * Require a specific permission - throws error if user doesn't have permission
 */
export async function requirePermission(permission: Permission) {
  const { user, profile } = await requireAuth();

  if (!profile.role) {
    throw new Error("Unauthorized: User role not assigned");
  }

  if (!hasPermission(profile.role, permission)) {
    throw new Error(`Unauthorized: Missing permission '${permission}'`);
  }

  return { user, profile };
}

/**
 * Require one of the specified roles - for page-level authorization.
 * Redirects to the dashboard if the user doesn't have an allowed role.
 * Use this in server components (page.tsx / layout.tsx) to protect routes.
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const { user, profile } = await requireAuth();

  if (!profile.role || !allowedRoles.includes(profile.role)) {
    redirect("/?error=unauthorized");
  }

  return { user, profile };
}

/**
 * Check if user has permission (returns boolean, doesn't throw)
 */
export async function checkPermission(permission: Permission): Promise<boolean> {
  try {
    const { profile } = await getCurrentUserWithProfile();
    if (!profile?.role) return false;
    return hasPermission(profile.role, permission);
  } catch {
    return false;
  }
}

/**
 * Sync Supabase user to team table
 * Creates or updates team member when user logs in
 */
export async function syncUserProfile(
  userId: string,
  email: string | undefined,
  fullName?: string,
  phone?: string
) {
  const existingMember = await db.query.team.findFirst({
    where: eq(team.id, userId),
  });

  if (existingMember) {
    // Update existing team member if needed
    const updates: Partial<typeof team.$inferInsert> = {};
    if (email && !existingMember.email) {
      updates.email = email;
    }
    if (fullName && !existingMember.fullName) {
      updates.fullName = fullName;
    }
    if (phone && !existingMember.phone) {
      updates.phone = phone;
    }

    if (Object.keys(updates).length > 0) {
      await db
        .update(team)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(team.id, userId));
    }

    return existingMember;
  } else {
    // Create new team member
    const placeholderPhone = phone || `+91${userId.replace(/-/g, '').slice(0, 10)}`;
    
    const [newMember] = await db
      .insert(team)
      .values({
        id: userId,
        email: email || undefined,
        fullName: fullName || "User",
        phone: placeholderPhone,
        role: "buyer_agent", // Default role
      })
      .returning();

    return newMember;
  }
}
