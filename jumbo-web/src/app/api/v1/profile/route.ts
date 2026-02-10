import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";

/**
 * GET /api/v1/profile
 * Get current user's team member record
 */
export const GET = withAuth(
  async (request: NextRequest, { user, profile }) => {
    return {
      data: profile,
    };
  }
);
