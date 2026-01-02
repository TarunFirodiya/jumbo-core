import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncUserProfile } from "@/lib/auth";

/**
 * POST /api/v1/profile/sync
 * Sync the current user's profile from Supabase to the database
 * This should be called after login if the profile doesn't exist
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Not authenticated" },
        { status: 401 }
      );
    }

    // Sync the user's profile
    const profile = await syncUserProfile(
      user.id,
      user.email,
      user.user_metadata?.full_name || user.user_metadata?.name,
      user.phone
    );

    return NextResponse.json({
      data: profile,
      message: "Profile synced successfully",
    });
  } catch (error) {
    console.error("Error syncing profile:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to sync profile" },
      { status: 500 }
    );
  }
}

