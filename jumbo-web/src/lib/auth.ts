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
    console.error("Unexpected error in getCurrentUserWithProfile:", error);
    throw error;
  }
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth() {
  try {
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
