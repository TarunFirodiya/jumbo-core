import { NextRequest, NextResponse } from "next/server";
import { getAuditLogs } from "@/lib/audit";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/v1/audit-logs
 * Fetch audit logs for a specific entity
 * Query params: entityType, entityId, limit
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Authentication check (temporarily bypassed for development)
    // if (!user) {
    //   return NextResponse.json(
    //     { error: "Unauthorized", message: "Authentication required" },
    //     { status: 401 }
    //   );
    // }

    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const limit = Number(searchParams.get("limit")) || 50;

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "Bad Request", message: "entityType and entityId are required" },
        { status: 400 }
      );
    }

    const logs = await getAuditLogs({ entityType, entityId, limit });

    return NextResponse.json({
      data: logs,
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}

