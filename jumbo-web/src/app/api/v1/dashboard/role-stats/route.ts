import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import * as dashboardService from "@/services/dashboard.service";

const ALLOWED_VIEW_AS = ["buyer_agent", "listing_agent", "visit_agent"] as const;

/**
 * GET /api/v1/dashboard/role-stats
 * Returns role-specific dashboard statistics for the authenticated user.
 * Admins (super_admin, team_lead) can pass ?viewAs=buyer_agent to preview other role views.
 */
export const GET = withAuth(async (request: NextRequest, { user, profile }) => {
  const agentId = profile.id;
  const userId = user.id;

  // Allow admins to preview other role dashboards
  const viewAs = request.nextUrl.searchParams.get("viewAs");
  const isAdmin = profile.role === "super_admin" || profile.role === "team_lead";
  const effectiveRole =
    isAdmin && viewAs && ALLOWED_VIEW_AS.includes(viewAs as any)
      ? viewAs
      : profile.role;

  // Shared data fetched for all roles
  const [myTasks, notifs, unreadCount] = await Promise.all([
    dashboardService.getTasksByAssignee(agentId),
    dashboardService.getUserNotifications(userId),
    dashboardService.getUnreadNotificationCount(userId),
  ]);

  const base = { role: effectiveRole, tasks: myTasks, notifications: notifs, unreadCount };

  switch (effectiveRole) {
    case "buyer_agent": {
      const stats = await dashboardService.getBuyerAgentStats(agentId);
      return { ...base, stats };
    }

    case "listing_agent": {
      const stats = await dashboardService.getListingAgentStats(agentId);
      return { ...base, stats };
    }

    case "visit_agent": {
      const [stats, schedule] = await Promise.all([
        dashboardService.getFieldAgentStats(agentId),
        dashboardService.getFieldAgentSchedule(agentId),
      ]);
      return { ...base, stats, schedule };
    }

    default: {
      return base;
    }
  }
});
