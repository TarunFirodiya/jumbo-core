/**
 * Catalogue Service
 * Handles all database operations for home catalogues
 */

import { db } from "@/lib/db";
import { homeCatalogues, type NewHomeCatalogue, type HomeCatalogue } from "@/lib/db/schema";
import { eq, and, sql, desc, isNull } from "drizzle-orm";
import type { CatalogueFilters, PaginatedResult } from "./types";
import { NotFoundError } from "./errors";

/**
 * Create a new catalogue
 */
export async function createCatalogue(data: NewHomeCatalogue): Promise<HomeCatalogue> {
  const [catalogue] = await db
    .insert(homeCatalogues)
    .values({
      ...data,
      status: data.status ?? "pending",
    })
    .returning();

  return catalogue;
}

/**
 * Get catalogue by ID
 */
export async function getCatalogueById(id: string): Promise<HomeCatalogue | null> {
  return db.query.homeCatalogues.findFirst({
    where: eq(homeCatalogues.id, id),
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
      cataloguedBy: true,
      inspection: true,
    },
  });
}

/**
 * Get catalogues by listing
 */
export async function getCataloguesByListing(listingId: string): Promise<HomeCatalogue[]> {
  return db.query.homeCatalogues.findMany({
    where: and(
      eq(homeCatalogues.listingId, listingId),
      isNull(homeCatalogues.deletedAt)
    ),
    with: {
      cataloguedBy: true,
      inspection: true,
    },
    orderBy: [desc(homeCatalogues.createdAt)],
  });
}

/**
 * Get catalogues with filters and pagination
 */
export async function getCatalogues(
  filters: CatalogueFilters = {}
): Promise<PaginatedResult<HomeCatalogue>> {
  const { page = 1, limit = 50, listingId, status, cataloguedById } = filters;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (listingId) {
    conditions.push(eq(homeCatalogues.listingId, listingId));
  }

  if (status) {
    conditions.push(eq(homeCatalogues.status, status));
  }

  if (cataloguedById) {
    conditions.push(eq(homeCatalogues.cataloguedById, cataloguedById));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db.query.homeCatalogues.findMany({
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
        cataloguedBy: true,
        inspection: true,
      },
      limit,
      offset,
      orderBy: [desc(homeCatalogues.createdAt)],
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(homeCatalogues)
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
 * Update a catalogue
 */
export async function updateCatalogue(
  id: string,
  data: Partial<NewHomeCatalogue>
): Promise<HomeCatalogue> {
  const existing = await getCatalogueById(id);
  if (!existing) {
    throw new NotFoundError("HomeCatalogue", id);
  }

  const [updated] = await db
    .update(homeCatalogues)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(homeCatalogues.id, id))
    .returning();

  return updated;
}

/**
 * Approve a catalogue
 */
export async function approveCatalogue(id: string): Promise<HomeCatalogue> {
  const existing = await getCatalogueById(id);
  if (!existing) {
    throw new NotFoundError("HomeCatalogue", id);
  }

  const [updated] = await db
    .update(homeCatalogues)
    .set({
      status: "approved",
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(homeCatalogues.id, id))
    .returning();

  return updated;
}

/**
 * Reject a catalogue
 */
export async function rejectCatalogue(id: string, reason?: string): Promise<HomeCatalogue> {
  const existing = await getCatalogueById(id);
  if (!existing) {
    throw new NotFoundError("HomeCatalogue", id);
  }

  const [updated] = await db
    .update(homeCatalogues)
    .set({
      status: "rejected",
      updatedAt: new Date(),
    })
    .where(eq(homeCatalogues.id, id))
    .returning();

  return updated;
}

/**
 * Request revision for a catalogue
 */
export async function requestRevision(id: string): Promise<HomeCatalogue> {
  const existing = await getCatalogueById(id);
  if (!existing) {
    throw new NotFoundError("HomeCatalogue", id);
  }

  const [updated] = await db
    .update(homeCatalogues)
    .set({
      status: "needs_revision",
      updatedAt: new Date(),
    })
    .where(eq(homeCatalogues.id, id))
    .returning();

  return updated;
}

