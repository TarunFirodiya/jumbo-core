import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sellerLeads, listings, units } from "@/lib/db/schema";
import { eq, and, sql, gte, isNull } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/v1/sellers/stats
 * Returns seller-related statistics for the dashboard
 * 
 * Stats:
 * 1. New Leads (this month) - count of seller_leads created this month
 * 2. Homes Live (this month) - count of listings that went Live (published_at) this month
 * 3. Schedule Inspections - count of listings in inspection_pending status
 * 4. Active Sellers - count of distinct unit owners whose listings are currently active
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // TEMPORARY BYPASS FOR DEBUGGING
    // if (!user) {
    //   return NextResponse.json(
    //     { error: "Unauthorized", message: "Authentication required" },
    //     { status: 401 }
    //   );
    // }

    // Get start of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Execute all stat queries in parallel
    const [
      newLeadsResult,
      homesLiveResult,
      inspectionPendingResult,
      activeSellersResult,
    ] = await Promise.all([
      // 1. New Leads (this month) - seller_leads created this month
      db
        .select({ count: sql<number>`count(*)` })
        .from(sellerLeads)
        .where(
          and(
            gte(sellerLeads.createdAt, startOfMonth),
            isNull(sellerLeads.deletedAt)
          )
        ),

      // 2. Homes Live (this month) - listings with published_at in current month
      db
        .select({ count: sql<number>`count(*)` })
        .from(listings)
        .where(
          and(
            gte(listings.publishedAt, startOfMonth),
            isNull(listings.deletedAt)
          )
        ),

      // 3. Schedule Inspections - listings with inspection_pending status
      db
        .select({ count: sql<number>`count(*)` })
        .from(listings)
        .where(
          and(
            eq(listings.status, "inspection_pending"),
            isNull(listings.deletedAt)
          )
        ),

      // 4. Active Sellers - distinct owners of units that have active listings
      db
        .select({ count: sql<number>`count(DISTINCT ${units.ownerId})` })
        .from(listings)
        .innerJoin(units, eq(listings.unitId, units.id))
        .where(
          and(
            eq(listings.status, "active"),
            isNull(listings.deletedAt)
          )
        ),
    ]);

    const stats = {
      newLeads: Number(newLeadsResult[0]?.count ?? 0),
      homesLive: Number(homesLiveResult[0]?.count ?? 0),
      inspectionPending: Number(inspectionPendingResult[0]?.count ?? 0),
      activeSellers: Number(activeSellersResult[0]?.count ?? 0),
    };

    return NextResponse.json({ data: stats });
  } catch (error) {
    console.error("Error fetching seller stats:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to fetch seller stats",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

