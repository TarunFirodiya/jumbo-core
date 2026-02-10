/**
 * Seller Lead Service
 * Handles all database operations for seller leads.
 * Identity (name/phone/email) now comes from the contacts table via contactId.
 */

import { db } from "@/lib/db";
import { sellerLeads, listings, units, type NewSellerLead, type SellerLead } from "@/lib/db/schema";
import { eq, and, sql, desc, isNull, gte } from "drizzle-orm";
import type { SellerLeadFilters, PaginatedResult } from "./types";
import { NotFoundError } from "./errors";
import * as contactService from "./contact.service";

/**
 * Create a new seller lead with contact creation.
 * Finds or creates a contact by phone, then creates the seller lead.
 */
export async function createSellerLeadWithContact(data: {
  contact: {
    name: string;
    phone: string;
    email?: string;
  };
  source: "website" | "99acres" | "magicbricks" | "housing" | "nobroker" | "mygate" | "referral";
  status?: "new" | "proposal_sent" | "proposal_accepted" | "dropped";
  sourceUrl?: string;
  sourceListingUrl?: string;
  dropReason?: "not_interested" | "price_too_high" | "found_elsewhere" | "invalid_lead" | "duplicate" | "other";
  referredById?: string;
  buildingId?: string;
  unitId?: string;
  assignedToId?: string;
  followUpDate?: Date;
  isNri?: boolean;
  createdById?: string;
}): Promise<SellerLead> {
  // Find or create contact
  const contact = await contactService.findOrCreateContactByPhone(
    data.contact.phone,
    {
      name: data.contact.name,
      email: data.contact.email,
    }
  );

  // Create seller lead
  const [sellerLead] = await db
    .insert(sellerLeads)
    .values({
      contactId: contact.id,
      source: data.source,
      status: data.status ?? "new",
      sourceUrl: data.sourceUrl ?? null,
      sourceListingUrl: data.sourceListingUrl ?? null,
      dropReason: data.dropReason ?? null,
      referredById: data.referredById ?? null,
      buildingId: data.buildingId ?? null,
      unitId: data.unitId ?? null,
      assignedToId: data.assignedToId ?? null,
      followUpDate: data.followUpDate ?? null,
      isNri: data.isNri ?? false,
      createdById: data.createdById ?? null,
    })
    .returning();

  return sellerLead;
}

/**
 * Create a new seller lead (low-level, expects contactId already resolved)
 */
export async function createSellerLead(data: NewSellerLead): Promise<SellerLead> {
  const [sellerLead] = await db.insert(sellerLeads).values(data).returning();
  return sellerLead;
}

/**
 * Get seller lead by ID
 */
export async function getSellerLeadById(id: string): Promise<SellerLead | null> {
  const result = await db.query.sellerLeads.findFirst({
    where: and(eq(sellerLeads.id, id), isNull(sellerLeads.deletedAt)),
    with: {
      contact: true,
      assignedTo: true,
      referredBy: true,
      building: true,
      unit: true,
      createdBy: true,
    },
  });
  return result ?? null;
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
    conditions.push(eq(sellerLeads.status, status as any));
  }

  if (source) {
    conditions.push(eq(sellerLeads.source, source as any));
  }

  if (assignedToId) {
    conditions.push(eq(sellerLeads.assignedToId, assignedToId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db.query.sellerLeads.findMany({
      where: whereClause,
      with: {
        contact: true,
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
      contact: true,
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
 * Get seller dashboard stats
 */
export async function getSellerDashboardStats(): Promise<{
  newLeads: number;
  homesLive: number;
  inspectionPending: number;
  activeSellers: number;
}> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    newLeadsResult,
    homesLiveResult,
    inspectionPendingResult,
    activeSellersResult,
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(sellerLeads)
      .where(
        and(
          gte(sellerLeads.createdAt, startOfMonth),
          isNull(sellerLeads.deletedAt)
        )
      ),
    db
      .select({ count: sql<number>`count(*)` })
      .from(listings)
      .where(
        and(
          gte(listings.publishedAt, startOfMonth),
          isNull(listings.deletedAt)
        )
      ),
    db
      .select({ count: sql<number>`count(*)` })
      .from(listings)
      .where(
        and(
          eq(listings.status, "inspection_pending"),
          isNull(listings.deletedAt)
        )
      ),
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
