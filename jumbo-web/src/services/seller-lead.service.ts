/**
 * Seller Lead Service
 * Handles all database operations for seller leads
 */

import { db } from "@/lib/db";
import { sellerLeads, listings, units, type NewSellerLead, type SellerLead } from "@/lib/db/schema";
import { eq, and, sql, desc, isNull, gte } from "drizzle-orm";
import type { SellerLeadFilters, PaginatedResult } from "./types";
import { NotFoundError } from "./errors";

/**
 * Create a new seller lead
 */
export async function createSellerLead(data: NewSellerLead): Promise<SellerLead> {
  const [sellerLead] = await db.insert(sellerLeads).values(data).returning();
  return sellerLead;
}

/**
 * Get seller lead by ID
 */
export async function getSellerLeadById(id: string): Promise<SellerLead | null> {
  return db.query.sellerLeads.findFirst({
    where: and(eq(sellerLeads.id, id), isNull(sellerLeads.deletedAt)),
    with: {
      assignedTo: true,
      referredBy: true,
      building: true,
      unit: true,
      createdBy: true,
    },
  });
}

/**
 * Get seller leads with filters and pagination
 */
export async function getSellerLeads(
  filters: SellerLeadFilters = {}
): Promise<PaginatedResult<SellerLead>> {
  const { page = 1, limit = 50, status, source, assignedToId, includeDeleted = false } = filters;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (!includeDeleted) {
    conditions.push(isNull(sellerLeads.deletedAt));
  }

  if (status) {
    conditions.push(eq(sellerLeads.status, status));
  }

  if (source) {
    conditions.push(eq(sellerLeads.source, source));
  }

  if (assignedToId) {
    conditions.push(eq(sellerLeads.assignedToId, assignedToId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db.query.sellerLeads.findMany({
      where: whereClause,
      with: {
        assignedTo: true,
        referredBy: true,
        building: true,
        createdBy: true,
      },
      limit,
      offset,
      orderBy: [desc(sellerLeads.createdAt)],
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(sellerLeads)
      .where(whereClause),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Update a seller lead
 */
export async function updateSellerLead(
  id: string,
  data: Partial<NewSellerLead>
): Promise<SellerLead> {
  const existing = await getSellerLeadById(id);
  if (!existing) {
    throw new NotFoundError("SellerLead", id);
  }

  const [updated] = await db
    .update(sellerLeads)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(sellerLeads.id, id))
    .returning();

  return updated;
}

/**
 * Update seller lead status
 */
export async function updateSellerLeadStatus(
  id: string,
  status: "new" | "proposal_sent" | "proposal_accepted" | "dropped"
): Promise<SellerLead> {
  const existing = await getSellerLeadById(id);
  if (!existing) {
    throw new NotFoundError("SellerLead", id);
  }

  const [updated] = await db
    .update(sellerLeads)
    .set({ status, updatedAt: new Date() })
    .where(eq(sellerLeads.id, id))
    .returning();

  return updated;
}

/**
 * Assign seller lead to an agent
 */
export async function assignSellerLead(id: string, agentId: string): Promise<SellerLead> {
  const existing = await getSellerLeadById(id);
  if (!existing) {
    throw new NotFoundError("SellerLead", id);
  }

  const [updated] = await db
    .update(sellerLeads)
    .set({ assignedToId: agentId, updatedAt: new Date() })
    .where(eq(sellerLeads.id, id))
    .returning();

  return updated;
}

/**
 * Soft delete a seller lead
 */
export async function deleteSellerLead(id: string): Promise<void> {
  const existing = await getSellerLeadById(id);
  if (!existing) {
    throw new NotFoundError("SellerLead", id);
  }

  await db
    .update(sellerLeads)
    .set({ deletedAt: new Date() })
    .where(eq(sellerLeads.id, id));
}

/**
 * Get seller leads by building
 */
export async function getSellerLeadsByBuilding(buildingId: string): Promise<SellerLead[]> {
  return db.query.sellerLeads.findMany({
    where: and(eq(sellerLeads.buildingId, buildingId), isNull(sellerLeads.deletedAt)),
    with: {
      assignedTo: true,
      unit: true,
    },
    orderBy: [desc(sellerLeads.createdAt)],
  });
}

/**
 * Get seller leads stats (pipeline stats)
 */
export async function getSellerLeadStats(): Promise<{
  total: number;
  new: number;
  proposalSent: number;
  proposalAccepted: number;
  dropped: number;
}> {
  const [total, newCount, proposalSent, proposalAccepted, dropped] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(sellerLeads)
      .where(isNull(sellerLeads.deletedAt)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(sellerLeads)
      .where(and(eq(sellerLeads.status, "new"), isNull(sellerLeads.deletedAt))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(sellerLeads)
      .where(and(eq(sellerLeads.status, "proposal_sent"), isNull(sellerLeads.deletedAt))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(sellerLeads)
      .where(and(eq(sellerLeads.status, "proposal_accepted"), isNull(sellerLeads.deletedAt))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(sellerLeads)
      .where(and(eq(sellerLeads.status, "dropped"), isNull(sellerLeads.deletedAt))),
  ]);

  return {
    total: Number(total[0]?.count ?? 0),
    new: Number(newCount[0]?.count ?? 0),
    proposalSent: Number(proposalSent[0]?.count ?? 0),
    proposalAccepted: Number(proposalAccepted[0]?.count ?? 0),
    dropped: Number(dropped[0]?.count ?? 0),
  };
}

/**
 * Get seller dashboard stats (matches API /api/v1/sellers/stats)
 * Returns stats for the dashboard view
 */
export async function getSellerDashboardStats(): Promise<{
  newLeads: number;
  homesLive: number;
  inspectionPending: number;
  activeSellers: number;
}> {
  // Get start of current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

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

  return {
    newLeads: Number(newLeadsResult[0]?.count ?? 0),
    homesLive: Number(homesLiveResult[0]?.count ?? 0),
    inspectionPending: Number(inspectionPendingResult[0]?.count ?? 0),
    activeSellers: Number(activeSellersResult[0]?.count ?? 0),
  };
}

