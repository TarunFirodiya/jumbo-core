import { NextResponse } from "next/server";
import * as profileService from "@/services/profile.service";

/**
 * GET /api/v1/agents
 * Fetch all agents with buyer_agent role for dropdown selection
 */
export async function GET() {
  try {
    const agents = await profileService.getProfilesByRole("buyer_agent");

    // Return only necessary fields for dropdown
    const agentOptions = agents.map((agent) => ({
      id: agent.id,
      fullName: agent.fullName,
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

