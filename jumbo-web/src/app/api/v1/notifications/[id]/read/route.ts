import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import * as notificationService from "@/services/notification.service";

/**
 * POST /api/v1/notifications/:id/read
 * Mark a single notification as read
 */
export const POST = withAuth(async (request: NextRequest) => {
  const id = request.nextUrl.pathname.split("/").at(-2)!;
  const updated = await notificationService.markAsRead(id);
  return { data: updated };
});
