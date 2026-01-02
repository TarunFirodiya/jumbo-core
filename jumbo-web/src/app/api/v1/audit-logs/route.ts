import { NextRequest, NextResponse } from "next/server";
import { getAuditLogs } from "@/lib/audit";
import { withAuth } from "@/lib/api-helpers";

/**
 * GET /api/v1/audit-logs
 * Fetch audit logs for a specific entity
 * Query params: entityType, entityId, limit
 */
export const GET = withAuth<{ data: unknown[] } | { error: string; message: string }>(
  async (request: NextRequest, { user, profile }) => {
    try {

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
      throw error;
    }
  },
  "audit_logs:read"
);

