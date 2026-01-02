import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

/**
 * GET /api/v1/profile
 * Get current user's profile
 */
export const GET = withAuth(
  async (request: NextRequest, { user, profile }) => {
    return {
      data: profile,
    };
  }
);

