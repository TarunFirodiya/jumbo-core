import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { team } from "@/lib/db/schema";
import { isNull, desc } from "drizzle-orm";
import * as teamService from "@/services/team.service";
import type { UserRole } from "@/lib/db/schema";

/**
 * GET /api/v1/agents
 * Fetch team members for dropdown selection.
 * Query params:
 *   - role: filter by role (default: all)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") as UserRole | null;

    let agents;
    if (role) {
      agents = await teamService.getTeamMembersByRole(role);
    } else {
      agents = await db.query.team.findMany({
        where: isNull(team.deletedAt),
        orderBy: [desc(team.createdAt)],
      });
    }

    const agentOptions = agents.map((agent) => ({
      id: agent.id,
      fullName: agent.fullName,
      role: agent.role,
    }));

    return NextResponse.json({
      data: agentOptions,
    });
  } catch (error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 }
    );
  }
}
