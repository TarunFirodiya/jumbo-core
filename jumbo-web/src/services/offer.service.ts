/**
 * Offer Service
 * Handles all database operations for offers
 */

import { db } from "@/lib/db";
import { offers, type NewOffer, type Offer } from "@/lib/db/schema";
import { eq, and, sql, desc, isNull } from "drizzle-orm";
import type { OfferFilters, PaginatedResult } from "./types";
import { NotFoundError } from "./errors";

/**
 * Create a new offer
 */
export async function createOffer(data: {
  listingId: string;
  leadId: string;
  offerAmount: number;
  terms?: Record<string, unknown>;
  createdById: string;
}): Promise<Offer> {
  const [offer] = await db
    .insert(offers)
    .values({
      listingId: data.listingId,
      leadId: data.leadId,
      offerAmount: data.offerAmount.toString(),
      terms: data.terms ?? null,
      createdById: data.createdById,
      status: "pending",
    })
    .returning();

  return offer;
}

/**
 * Get offer by ID
 */
export async function getOfferById(id: string): Promise<Offer | null> {
  return db.query.offers.findFirst({
    where: and(eq(offers.id, id), isNull(offers.deletedAt)),
    with: {
      listing: {
        with: {
          unit: {
            with: {
              building: true,
            },
          },
        },
      },
      lead: {
        with: {
          profile: true,
        },
      },
      createdBy: true,
    },
  });
}

/**
 * Get offers with filters and pagination
 */
export async function getOffers(
  filters: OfferFilters = {}
): Promise<PaginatedResult<Offer>> {
  const { page = 1, limit = 50, status, listingId, leadId, includeDeleted = false } = filters;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (!includeDeleted) {
    conditions.push(isNull(offers.deletedAt));
  }

  if (status) {
    conditions.push(eq(offers.status, status));
  }

  if (listingId) {
    conditions.push(eq(offers.listingId, listingId));
  }

  if (leadId) {
    conditions.push(eq(offers.leadId, leadId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db.query.offers.findMany({
      where: whereClause,
      with: {
        listing: {
          with: {
            unit: {
              with: {
                building: true,
              },
            },
          },
        },
        lead: {
          with: {
            profile: true,
          },
        },
        createdBy: true,
      },
      limit,
      offset,
      orderBy: [desc(offers.createdAt)],
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(offers)
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
 * Get offers by listing
 */
export async function getOffersByListing(listingId: string): Promise<Offer[]> {
  return db.query.offers.findMany({
    where: and(eq(offers.listingId, listingId), isNull(offers.deletedAt)),
    with: {
      lead: {
        with: {
          profile: true,
        },
      },
      createdBy: true,
    },
    orderBy: [desc(offers.createdAt)],
  });
}

/**
 * Get offers by lead
 */
export async function getOffersByLead(leadId: string): Promise<Offer[]> {
  return db.query.offers.findMany({
    where: and(eq(offers.leadId, leadId), isNull(offers.deletedAt)),
    with: {
      listing: {
        with: {
          unit: {
            with: {
              building: true,
            },
          },
        },
      },
      createdBy: true,
    },
    orderBy: [desc(offers.createdAt)],
  });
}

/**
 * Update an offer
 */
export async function updateOffer(
  id: string,
  data: {
    offerAmount?: number;
    terms?: Record<string, unknown>;
    status?: "pending" | "accepted" | "rejected" | "countered";
  }
): Promise<Offer> {
  const existing = await getOfferById(id);
  if (!existing) {
    throw new NotFoundError("Offer", id);
  }

  const updateData: Partial<NewOffer> = {
    updatedAt: new Date(),
  };

  if (data.offerAmount !== undefined) {
    updateData.offerAmount = data.offerAmount.toString();
  }

  if (data.terms !== undefined) {
    updateData.terms = data.terms;
  }

  if (data.status !== undefined) {
    updateData.status = data.status;
  }

  const [updated] = await db
    .update(offers)
    .set(updateData)
    .where(eq(offers.id, id))
    .returning();

  return updated;
}

/**
 * Accept an offer
 */
export async function acceptOffer(id: string): Promise<Offer> {
  const existing = await getOfferById(id);
  if (!existing) {
    throw new NotFoundError("Offer", id);
  }

  const [updated] = await db
    .update(offers)
    .set({
      status: "accepted",
      updatedAt: new Date(),
    })
    .where(eq(offers.id, id))
    .returning();

  return updated;
}

/**
 * Reject an offer
 */
export async function rejectOffer(id: string, reason?: string): Promise<Offer> {
  const existing = await getOfferById(id);
  if (!existing) {
    throw new NotFoundError("Offer", id);
  }

  const [updated] = await db
    .update(offers)
    .set({
      status: "rejected",
      updatedAt: new Date(),
    })
    .where(eq(offers.id, id))
    .returning();

  return updated;
}

/**
 * Counter an offer
 */
export async function counterOffer(
  id: string,
  newAmount: number,
  terms?: Record<string, unknown>
): Promise<Offer> {
  const existing = await getOfferById(id);
  if (!existing) {
    throw new NotFoundError("Offer", id);
  }

  const [updated] = await db
    .update(offers)
    .set({
      status: "countered",
      offerAmount: newAmount.toString(),
      terms: terms ?? existing.terms,
      updatedAt: new Date(),
    })
    .where(eq(offers.id, id))
    .returning();

  return updated;
}

/**
 * Soft delete an offer
 */
export async function deleteOffer(id: string): Promise<void> {
  const existing = await getOfferById(id);
  if (!existing) {
    throw new NotFoundError("Offer", id);
  }

  await db
    .update(offers)
    .set({ deletedAt: new Date() })
    .where(eq(offers.id, id));
}

/**
 * Get offer stats for dashboard
 */
export async function getOfferStats(): Promise<{
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  countered: number;
}> {
  const [total, pending, accepted, rejected, countered] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(offers)
      .where(isNull(offers.deletedAt)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(offers)
      .where(and(eq(offers.status, "pending"), isNull(offers.deletedAt))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(offers)
      .where(and(eq(offers.status, "accepted"), isNull(offers.deletedAt))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(offers)
      .where(and(eq(offers.status, "rejected"), isNull(offers.deletedAt))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(offers)
      .where(and(eq(offers.status, "countered"), isNull(offers.deletedAt))),
  ]);

  return {
    total: Number(total[0]?.count ?? 0),
    pending: Number(pending[0]?.count ?? 0),
    accepted: Number(accepted[0]?.count ?? 0),
    rejected: Number(rejected[0]?.count ?? 0),
    countered: Number(countered[0]?.count ?? 0),
  };
}

