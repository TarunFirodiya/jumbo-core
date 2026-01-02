import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import * as dashboardService from "@/services/dashboard.service";

type DateFilter = "yesterday" | "this_week" | "last_week" | "this_month" | "last_3_months";

/**
 * GET /api/v1/dashboard/stats
 * Returns dashboard statistics with date filtering
 * 
 * Query params (single filter mode - for backward compatibility):
 *   - dateFilter: yesterday, this_week, last_week, this_month, last_3_months
 *   - previousPeriod: true/false
 * 
 * Query params (multi filter mode - optimized):
 *   - userLeadsFilter, uniqueVisitorsFilter, offersFilter, homesAddedFilter
 *   - Returns both current and previous period stats in one call
 */
export const GET = withAuth<
  | {
      data: {
        userLeads: number;
        uniqueVisitorsCompleted: number;
        offers: number;
        homesAdded: number;
      };
    }
  | {
      current: {
        userLeads: number;
        uniqueVisitorsCompleted: number;
        offers: number;
        homesAdded: number;
      };
      previous: {
        userLeads: number;
        uniqueVisitorsCompleted: number;
        offers: number;
        homesAdded: number;
      };
    }
  | { error: string; message: string }
>(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;

  // Check if multi-filter mode (optimized)
  const userLeadsFilter = searchParams.get("userLeadsFilter");
  const uniqueVisitorsFilter = searchParams.get("uniqueVisitorsFilter");
  const offersFilter = searchParams.get("offersFilter");
  const homesAddedFilter = searchParams.get("homesAddedFilter");

  if (userLeadsFilter && uniqueVisitorsFilter && offersFilter && homesAddedFilter) {
    // Multi-filter mode - optimized single call
    const stats = await dashboardService.getDashboardStatsMulti({
      userLeads: userLeadsFilter as DateFilter,
      uniqueVisitorsCompleted: uniqueVisitorsFilter as DateFilter,
      offers: offersFilter as DateFilter,
      homesAdded: homesAddedFilter as DateFilter,
    });

    return stats;
  }

  // Single filter mode (backward compatibility)
  const dateFilter = (searchParams.get("dateFilter") || "this_month") as DateFilter;
  const previousPeriod = searchParams.get("previousPeriod") === "true";

  const stats = await dashboardService.getDashboardStats(dateFilter, previousPeriod);

  return {
    data: stats,
  };
});
