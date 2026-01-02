/**
 * Dashboard Service
 * Handles dashboard statistics calculations
 */

import { db } from "@/lib/db";
import { leads, visits, offers, listings } from "@/lib/db/schema";
import { eq, and, sql, gte, lte, isNull } from "drizzle-orm";

type DateFilter = "yesterday" | "this_week" | "last_week" | "this_month" | "last_3_months";

/**
 * Calculate date range based on filter type
 */
function getDateRange(
  filter: DateFilter,
  previousPeriod: boolean = false
): { startDate: Date; endDate: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (filter) {
    case "yesterday": {
      const daysBack = previousPeriod ? 2 : 1;
      const targetDay = new Date(today);
      targetDay.setDate(today.getDate() - daysBack);
      const nextDay = new Date(targetDay);
      nextDay.setDate(targetDay.getDate() + 1);
      return {
        startDate: targetDay,
        endDate: new Date(nextDay.getTime() - 1),
      };
    }
    case "this_week": {
      const dayOfWeek = now.getDay();
      if (previousPeriod) {
        const startOfLastWeek = new Date(today);
        startOfLastWeek.setDate(today.getDate() - dayOfWeek - 7);
        const endOfLastWeek = new Date(today);
        endOfLastWeek.setDate(today.getDate() - dayOfWeek - 1);
        return {
          startDate: startOfLastWeek,
          endDate: new Date(endOfLastWeek.getTime() + 24 * 60 * 60 * 1000 - 1),
        };
      } else {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        return {
          startDate: startOfWeek,
          endDate: now,
        };
      }
    }
    case "last_week": {
      const dayOfWeek = now.getDay();
      if (previousPeriod) {
        const startOfWeekBeforeLast = new Date(today);
        startOfWeekBeforeLast.setDate(today.getDate() - dayOfWeek - 14);
        const endOfWeekBeforeLast = new Date(today);
        endOfWeekBeforeLast.setDate(today.getDate() - dayOfWeek - 8);
        return {
          startDate: startOfWeekBeforeLast,
          endDate: new Date(endOfWeekBeforeLast.getTime() + 24 * 60 * 60 * 1000 - 1),
        };
      } else {
        const startOfLastWeek = new Date(today);
        startOfLastWeek.setDate(today.getDate() - dayOfWeek - 7);
        const endOfLastWeek = new Date(today);
        endOfLastWeek.setDate(today.getDate() - dayOfWeek - 1);
        return {
          startDate: startOfLastWeek,
          endDate: new Date(endOfLastWeek.getTime() + 24 * 60 * 60 * 1000 - 1),
        };
      }
    }
    case "this_month": {
      if (previousPeriod) {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        return {
          startDate: lastMonth,
          endDate: endOfLastMonth,
        };
      } else {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          startDate: startOfMonth,
          endDate: now,
        };
      }
    }
    case "last_3_months": {
      if (previousPeriod) {
        const startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() - 3, 0, 23, 59, 59, 999);
        return {
          startDate,
          endDate,
        };
      } else {
        const startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        return {
          startDate,
          endDate: now,
        };
      }
    }
    default: {
      const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        startDate: defaultStart,
        endDate: now,
      };
    }
  }
}

/**
 * Get dashboard stats for a specific date filter
 */
export async function getDashboardStats(
  dateFilter: DateFilter = "this_month",
  previousPeriod: boolean = false
): Promise<{
  userLeads: number;
  uniqueVisitorsCompleted: number;
  offers: number;
  homesAdded: number;
}> {
  const { startDate, endDate } = getDateRange(dateFilter, previousPeriod);

  // Execute all queries in parallel
  const [
    userLeadsResult,
    uniqueVisitorsResult,
    offersResult,
    homesAddedResult,
  ] = await Promise.all([
    // 1. User Leads - new leads created in date range
    db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(
        and(
          gte(leads.createdAt, startDate),
          lte(leads.createdAt, endDate),
          isNull(leads.deletedAt)
        )
      ),

    // 2. Unique Visitors Completed - distinct leadIds from completed visits in date range
    db
      .select({ count: sql<number>`count(DISTINCT ${visits.leadId})` })
      .from(visits)
      .where(
        and(
          eq(visits.status, "completed"),
          gte(visits.completedAt, startDate),
          lte(visits.completedAt, endDate)
        )
      ),

    // 3. Offers - offers initiated (created) in date range
    db
      .select({ count: sql<number>`count(*)` })
      .from(offers)
      .where(
        and(
          gte(offers.createdAt, startDate),
          lte(offers.createdAt, endDate),
          isNull(offers.deletedAt)
        )
      ),

    // 4. Homes Added - listings that went live (publishedAt) in date range with status='active'
    db
      .select({ count: sql<number>`count(*)` })
      .from(listings)
      .where(
        and(
          eq(listings.status, "active"),
          gte(listings.publishedAt, startDate),
          lte(listings.publishedAt, endDate),
          isNull(listings.deletedAt)
        )
      ),
  ]);

  return {
    userLeads: Number(userLeadsResult[0]?.count ?? 0),
    uniqueVisitorsCompleted: Number(uniqueVisitorsResult[0]?.count ?? 0),
    offers: Number(offersResult[0]?.count ?? 0),
    homesAdded: Number(homesAddedResult[0]?.count ?? 0),
  };
}

/**
 * Get dashboard stats with multiple date filters (optimized for client-side updates)
 * Returns all metrics for each filter in a single call
 */
export async function getDashboardStatsMulti(
  filters: {
    userLeads: DateFilter;
    uniqueVisitorsCompleted: DateFilter;
    offers: DateFilter;
    homesAdded: DateFilter;
  }
): Promise<{
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
}> {
  // Fetch all stats in parallel (8 queries total, but all in one function call)
  const [
    userLeadsCurrent,
    userLeadsPrevious,
    visitorsCurrent,
    visitorsPrevious,
    offersCurrent,
    offersPrevious,
    homesCurrent,
    homesPrevious,
  ] = await Promise.all([
    getDashboardStats(filters.userLeads, false),
    getDashboardStats(filters.userLeads, true),
    getDashboardStats(filters.uniqueVisitorsCompleted, false),
    getDashboardStats(filters.uniqueVisitorsCompleted, true),
    getDashboardStats(filters.offers, false),
    getDashboardStats(filters.offers, true),
    getDashboardStats(filters.homesAdded, false),
    getDashboardStats(filters.homesAdded, true),
  ]);

  return {
    current: {
      userLeads: userLeadsCurrent.userLeads,
      uniqueVisitorsCompleted: visitorsCurrent.uniqueVisitorsCompleted,
      offers: offersCurrent.offers,
      homesAdded: homesCurrent.homesAdded,
    },
    previous: {
      userLeads: userLeadsPrevious.userLeads,
      uniqueVisitorsCompleted: visitorsPrevious.uniqueVisitorsCompleted,
      offers: offersPrevious.offers,
      homesAdded: homesPrevious.homesAdded,
    },
  };
}

