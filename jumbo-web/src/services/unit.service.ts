/**
 * Unit Service
 * Handles all database operations for units
 */

import { db } from "@/lib/db";
import { units, type NewUnit, type Unit } from "@/lib/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { NotFoundError } from "./errors";

/**
 * Create a new unit
 */
export async function createUnit(data: NewUnit): Promise<Unit> {
  const [unit] = await db.insert(units).values(data).returning();
  return unit;
}

/**
 * Get unit by ID
 */
export async function getUnitById(id: string): Promise<Unit | null> {
  const result = await db.query.units.findFirst({
    where: and(eq(units.id, id), isNull(units.deletedAt)),
    with: {
      building: true,
      owner: true,
    },
  });
  return result ?? null;
}

/**
 * Get units by building ID
 */
export async function getUnitsByBuilding(buildingId: string): Promise<Unit[]> {
  return db.query.units.findMany({
    where: and(eq(units.buildingId, buildingId), isNull(units.deletedAt)),
    with: {
      owner: true,
      listings: true,
    },
    orderBy: [desc(units.createdAt)],
  });
}

/**
 * Update a unit
 */
export async function updateUnit(
  id: string,
  data: Partial<NewUnit>
): Promise<Unit> {
  const existing = await getUnitById(id);
  if (!existing) {
    throw new NotFoundError("Unit", id);
  }

  const [updated] = await db
    .update(units)
    .set(data)
    .where(eq(units.id, id))
    .returning();

  return updated;
}

/**
 * Soft delete a unit
 */
export async function deleteUnit(id: string): Promise<void> {
  const existing = await getUnitById(id);
  if (!existing) {
    throw new NotFoundError("Unit", id);
  }

  await db
    .update(units)
    .set({ deletedAt: new Date() })
    .where(eq(units.id, id));
}

