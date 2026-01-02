import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncUserProfile } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectTo = requestUrl.searchParams.get("redirect") || "/";

  if (code) {
    const supabase = await createClient();
    
    // Exchange code for session
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error);
      const loginUrl = new URL("/login", requestUrl);
      loginUrl.searchParams.set("error", "auth_failed");
      return NextResponse.redirect(loginUrl);
    }

    // Sync user profile
    if (data.user) {
      try {
        await syncUserProfile(
          data.user.id,
          data.user.email,
          data.user.user_metadata?.full_name || data.user.user_metadata?.name,
          data.user.phone
        );
      } catch (error) {
        console.error("Error syncing user profile:", error);
        // Continue anyway - profile sync can be retried later
      }
    }

    // Redirect to the original destination or dashboard
    return NextResponse.redirect(new URL(redirectTo, requestUrl));
  }

  // If no code, redirect to login
  return NextResponse.redirect(new URL("/login", requestUrl));
}

