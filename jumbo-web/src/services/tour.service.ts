/**
 * Tour Service
 * Handles all database operations for visit tours
 */

import { db } from "@/lib/db";
import { visitTours, visits, type NewVisitTour, type VisitTour } from "@/lib/db/schema";
import { eq, and, sql, desc, isNull } from "drizzle-orm";
import type { TourFilters, PaginatedResult } from "./types";
import { NotFoundError } from "./errors";

/**
 * Create a new tour
 */
export async function createTour(data: NewVisitTour): Promise<VisitTour> {
  const [tour] = await db.insert(visitTours).values(data).returning();
  return tour;
}

/**
 * Get tour by ID
 */
export async function getTourById(id: string): Promise<VisitTour | null> {
  const result = await db.query.visitTours.findFirst({
    where: and(eq(visitTours.id, id), isNull(visitTours.deletedAt)),
    with: {
      dispatchAgent: true,
      fieldAgent: true,
      visits: true,
    },
  });
  return result ?? null;
}

/**
 * Get tours with filters and pagination
 */
export async function getTours(
  filters: TourFilters = {}
): Promise<PaginatedResult<VisitTour>> {
  const { page = 1, limit = 50, status, fieldAgentId, dispatchAgentId, tourDate } = filters;
  const offset = (page - 1) * limit;

  const conditions = [isNull(visitTours.deletedAt)];

  if (status) {
    conditions.push(eq(visitTours.status, status as any));
  }

  if (fieldAgentId) {
    conditions.push(eq(visitTours.fieldAgentId, fieldAgentId));
  }

  if (dispatchAgentId) {
    conditions.push(eq(visitTours.dispatchAgentId, dispatchAgentId));
  }

  if (tourDate) {
    conditions.push(eq(visitTours.tourDate, tourDate));
  }

  const whereClause = and(...conditions);

  const [data, countResult] = await Promise.all([
    db.query.visitTours.findMany({
      where: whereClause,
      with: {
        dispatchAgent: true,
        fieldAgent: true,
        visits: {
          with: {
            lead: true,
            listing: true,
          },
        },
      },
      limit,
      offset,
      orderBy: [desc(visitTours.tourDate)],
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(visitTours)
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
 * Update a tour
 */
export async function updateTour(
  id: string,
  data: Partial<NewVisitTour>
): Promise<VisitTour> {
  const existing = await getTourById(id);
  if (!existing) {
    throw new NotFoundError("Tour", id);
  }

  const [updated] = await db
    .update(visitTours)
    .set(data)
    .where(eq(visitTours.id, id))
    .returning();

  return updated;
}

/**
 * Update tour status
 */
export async function updateTourStatus(id: string, status: string): Promise<VisitTour> {
  const existing = await getTourById(id);
  if (!existing) {
    throw new NotFoundError("Tour", id);
  }

  const [updated] = await db
    .update(visitTours)
    .set({ status })
    .where(eq(visitTours.id, id))
    .returning();

  return updated;
}

/**
 * Link visits to a tour
 */
export async function linkVisitsToTour(tourId: string, visitIds: string[]): Promise<void> {
  const existing = await getTourById(tourId);
  if (!existing) {
    throw new NotFoundError("Tour", tourId);
  }

  await db
    .update(visits)
    .set({ tourId })
    .where(sql`${visits.id} = ANY(${visitIds})`);
}

/**
 * Soft delete a tour
 */
export async function deleteTour(id: string): Promise<void> {
  const existing = await getTourById(id);
  if (!existing) {
    throw new NotFoundError("Tour", id);
  }

  await db
    .update(visitTours)
    .set({ deletedAt: new Date() })
    .where(eq(visitTours.id, id));
}

/**
 * Get tours by date range
 */
export async function getToursByDateRange(
  startDate: string,
  endDate: string
): Promise<VisitTour[]> {
  return db.query.visitTours.findMany({
    where: and(
      isNull(visitTours.deletedAt),
      sql`${visitTours.tourDate} >= ${startDate}`,
      sql`${visitTours.tourDate} <= ${endDate}`
    ),
    with: {
      dispatchAgent: true,
      fieldAgent: true,
      visits: true,
    },
    orderBy: [visitTours.tourDate],
  });
}

