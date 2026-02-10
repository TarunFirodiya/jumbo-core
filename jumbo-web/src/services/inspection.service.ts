/**
 * Inspection Service
 * Handles all database operations for home inspections
 */

import { db } from "@/lib/db";
import { homeInspections, type NewHomeInspection, type HomeInspection } from "@/lib/db/schema";
import { eq, and, sql, desc, isNull } from "drizzle-orm";
import type { InspectionFilters, PaginatedResult, CompleteInspectionData } from "./types";
import { NotFoundError } from "./errors";

/**
 * Create a new inspection
 */
export async function createInspection(data: NewHomeInspection): Promise<HomeInspection> {
  const [inspection] = await db
    .insert(homeInspections)
    .values({
      ...data,
      status: data.status ?? "pending",
    })
    .returning();

  return inspection;
}

/**
 * Get inspection by ID
 */
export async function getInspectionById(id: string): Promise<HomeInspection | null> {
  const result = await db.query.homeInspections.findFirst({
    where: eq(homeInspections.id, id),
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
      inspectedBy: true,
    },
  });
  return result ?? null;
}

/**
 * Get inspections by listing
 */
export async function getInspectionsByListing(listingId: string): Promise<HomeInspection[]> {
  return db.query.homeInspections.findMany({
    where: eq(homeInspections.listingId, listingId),
    with: {
      inspectedBy: true,
    },
    orderBy: [desc(homeInspections.createdAt)],
  });
}

/**
 * Get inspections with filters and pagination
 */
export async function getInspections(
  filters: InspectionFilters = {}
): Promise<PaginatedResult<HomeInspection>> {
  const { page = 1, limit = 50, listingId, status, inspectedById } = filters;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (listingId) {
    conditions.push(eq(homeInspections.listingId, listingId));
  }

  if (status) {
    conditions.push(eq(homeInspections.status, status as any));
  }

  if (inspectedById) {
    conditions.push(eq(homeInspections.inspectedById, inspectedById));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db.query.homeInspections.findMany({
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
        inspectedBy: true,
      },
      limit,
      offset,
      orderBy: [desc(homeInspections.createdAt)],
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(homeInspections)
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
 * Update an inspection
 */
export async function updateInspection(
  id: string,
  data: Partial<NewHomeInspection>
): Promise<HomeInspection> {
  const existing = await getInspectionById(id);
  if (!existing) {
    throw new NotFoundError("HomeInspection", id);
  }

  const [updated] = await db
    .update(homeInspections)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(homeInspections.id, id))
    .returning();

  return updated;
}

/**
 * Complete an inspection (with location capture)
 */
export async function completeInspection(
  id: string,
  data: CompleteInspectionData
): Promise<HomeInspection> {
  const existing = await getInspectionById(id);
  if (!existing) {
    throw new NotFoundError("HomeInspection", id);
  }

  const [updated] = await db
    .update(homeInspections)
    .set({
      status: "completed",
      inspectionLatitude: data.location.latitude,
      inspectionLongitude: data.location.longitude,
      inspectionScore: data.inspectionScore?.toString() ?? null,
      notes: data.notes ?? null,
      knownIssues: data.knownIssues ?? null,
      updatedAt: new Date(),
    })
    .where(eq(homeInspections.id, id))
    .returning();

  return updated;
}

/**
 * Update inspection status
 */
export async function updateInspectionStatus(
  id: string,
  status: "pending" | "in_progress" | "completed" | "rejected"
): Promise<HomeInspection> {
  const existing = await getInspectionById(id);
  if (!existing) {
    throw new NotFoundError("HomeInspection", id);
  }

  const [updated] = await db
    .update(homeInspections)
    .set({ status, updatedAt: new Date() })
    .where(eq(homeInspections.id, id))
    .returning();

  return updated;
}

