/**
 * Building Service
 * Handles all database operations for buildings
 */

import { db } from "@/lib/db";
import { buildings, type NewBuilding, type Building } from "@/lib/db/schema";
import { eq, and, sql, desc, isNull, ilike } from "drizzle-orm";
import type { BuildingFilters, PaginatedResult } from "./types";
import { NotFoundError } from "./errors";

/**
 * Create a new building
 */
export async function createBuilding(data: NewBuilding): Promise<Building> {
  const [building] = await db.insert(buildings).values(data).returning();
  return building;
}

/**
 * Get building by ID
 */
export async function getBuildingById(id: string): Promise<Building | null> {
  return db.query.buildings.findFirst({
    where: and(eq(buildings.id, id), isNull(buildings.deletedAt)),
  });
}

/**
 * Get buildings with filters and pagination
 */
export async function getBuildings(
  filters: BuildingFilters = {}
): Promise<PaginatedResult<Building>> {
  const { page = 1, limit = 50, city, locality, includeDeleted = false } = filters;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (!includeDeleted) {
    conditions.push(isNull(buildings.deletedAt));
  }

  if (city) {
    conditions.push(ilike(buildings.city, `%${city}%`));
  }

  if (locality) {
    conditions.push(ilike(buildings.locality, `%${locality}%`));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db.query.buildings.findMany({
      where: whereClause,
      with: {
        units: true,
      },
      limit,
      offset,
      orderBy: [desc(buildings.createdAt)],
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(buildings)
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
 * Update a building
 */
export async function updateBuilding(
  id: string,
  data: Partial<NewBuilding>
): Promise<Building> {
  const existing = await getBuildingById(id);
  if (!existing) {
    throw new NotFoundError("Building", id);
  }

  const [updated] = await db
    .update(buildings)
    .set(data)
    .where(eq(buildings.id, id))
    .returning();

  return updated;
}

/**
 * Soft delete a building
 */
export async function deleteBuilding(id: string): Promise<void> {
  const existing = await getBuildingById(id);
  if (!existing) {
    throw new NotFoundError("Building", id);
  }

  await db
    .update(buildings)
    .set({ deletedAt: new Date() })
    .where(eq(buildings.id, id));
}

/**
 * Search buildings by name or locality
 */
export async function searchBuildings(
  query: string,
  limit: number = 10
): Promise<Building[]> {
  return db.query.buildings.findMany({
    where: and(
      isNull(buildings.deletedAt),
      sql`(${buildings.name} ILIKE ${'%' + query + '%'} OR ${buildings.locality} ILIKE ${'%' + query + '%'})`
    ),
    limit,
    orderBy: [desc(buildings.createdAt)],
  });
}

