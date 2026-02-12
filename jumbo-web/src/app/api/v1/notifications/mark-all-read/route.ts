import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import * as notificationService from "@/services/notification.service";

/**
 * POST /api/v1/notifications/mark-all-read
 * Mark all notifications as read for the authenticated user
 */
export const POST = withAuth(async (request: NextRequest, { user }) => {
  await notificationService.markAllAsRead(user.id);
  return { success: true };
});
