import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import * as taskService from "@/services/task.service";

/**
 * GET /api/v1/tasks/:id
 * Get a task by ID
 */
export const GET = withAuth(
  async (_request: NextRequest) => {
    const url = new URL(_request.url);
    const segments = url.pathname.split("/");
    // URL: /api/v1/tasks/[id] — id is the last segment
    const id = segments[segments.length - 1];

    const tasks = await taskService.getTasksByLeadId(id);
    return { data: tasks };
  },
  "leads:read"
);

/**
 * PUT /api/v1/tasks/:id
 * Update task status
 */
export const PUT = withAuth(
  async (request: NextRequest) => {
    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    const id = segments[segments.length - 1];

    const body = await request.json();
    const { status } = body as { status: string };

    if (!status) {
      throw new Error("status is required");
    }

    const task = await taskService.updateTaskStatus(id, status);
    return { data: task, message: "Task updated successfully" };
  },
  "leads:read"
);
