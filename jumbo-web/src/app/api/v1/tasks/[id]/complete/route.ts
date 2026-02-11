import { NextRequest, NextResponse } from "next/server";
import * as taskService from "@/services/task.service";

/**
 * POST /api/v1/tasks/:id/complete
 * External feedback loop — allows external tools (e.g., Kapso/Voice AI)
 * to mark a task as completed with optional logs/notes.
 *
 * Authenticated via x-api-key header (same as lead webhook).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify API key
    const apiKey = request.headers.get("x-api-key");
    const expectedKey = process.env.LEADS_API_SECRET;

    if (!expectedKey || apiKey !== expectedKey) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Invalid or missing API key" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { logs, completedById, notes } = body as {
      logs?: string;
      completedById?: string;
      notes?: string;
    };

    // Update task status to completed
    const task = await taskService.updateTaskStatus(id, "completed");

    if (!task) {
      return NextResponse.json(
        { error: "Not Found", message: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        data: task,
        message: "Task completed successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error completing task:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Not Found", message: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message:
          error instanceof Error ? error.message : "Failed to complete task",
      },
      { status: 500 }
    );
  }
}
