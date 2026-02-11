/**
 * Listing Service
 * Handles all database operations for listings
 */

import { db } from "@/lib/db";
import {
  listings,
  buildings,
  units,
  notes,
  mediaItems,
  type NewListing,
  type Listing,
} from "@/lib/db/schema";
import { eq, and, sql, desc, isNull, gte, lte } from "drizzle-orm";
import type { ListingFilters, PaginatedResult, CreateListingData } from "./types";
import { NotFoundError } from "./errors";

/**
 * Create a new listing
 */
export async function createListing(data: NewListing): Promise<Listing> {
  const [listing] = await db.insert(listings).values(data).returning();
  return listing;
}

/**
 * Upsert listing (creates Building → Unit → Listing in a transaction)
 * This handles the complete listing wizard flow
 */
export async function upsertListing(data: CreateListingData): Promise<Listing> {
  return db.transaction(async (tx) => {
    let buildingId: string;

    // Step 1: Handle building (create or use existing)
    if ("id" in data.building) {
      buildingId = data.building.id;
    } else {
      const [building] = await tx
        .insert(buildings)
        .values({
          name: data.building.name,
          locality: data.building.locality,
          city: data.building.city,
          latitude: data.building.latitude,
          longitude: data.building.longitude,
          amenitiesJson: data.building.amenities,
          waterSource: data.building.waterSource,
        })
        .returning({ id: buildings.id });
      buildingId = building.id;
    }

    // Step 2: Create unit
    const [unit] = await tx
      .insert(units)
      .values({
        buildingId,
        unitNumber: data.unit.unitNumber,
        bhk: data.unit.bhk,
        floorNumber: data.unit.floorNumber,
        carpetArea: data.unit.carpetArea,
        ownerId: data.unit.ownerId,
      })
      .returning({ id: units.id });

    // Step 3: Create listing
    const [listing] = await tx
      .insert(listings)
      .values({
        unitId: unit.id,
        listingAgentId: data.listingAgentId,
        askingPrice: data.askingPrice.toString(),
        description: data.description,
        images: data.images ?? [],
        amenitiesJson: data.amenities ?? [],
        externalIds: data.externalIds,
        status: "draft",
      })
      .returning();

    return listing;
  });
}

/**
 * Get listing by ID
 */
export async function getListingById(id: string): Promise<Listing | null> {
  const result = await db.query.listings.findFirst({
    where: and(eq(listings.id, id), isNull(listings.deletedAt)),
    with: {
      unit: {
        with: {
          building: true,
          owner: true,
        },
      },
      listingAgent: true,
      zoneLead: true,
    },
  });
  return result ?? null;
}

/**
 * Get listing by ID with all relations
 */
export async function getListingByIdWithRelations(id: string) {
  return db.query.listings.findFirst({
    where: and(eq(listings.id, id), isNull(listings.deletedAt)),
    with: {
      unit: {
        with: {
          building: true,
          owner: true,
        },
      },
      listingAgent: true,
      zoneLead: true,
      // Notes are queried separately due to polymorphic relationship
      // Use noteService.getNotesByEntity('listing', id) if needed
      // MediaItems are queried separately due to polymorphic relationship
      // Use mediaService.getMediaItemsByEntity('listing', id) if needed
      homeInspections: {
        orderBy: (insp, { desc }) => [desc(insp.createdAt)],
        limit: 5,
      },
      homeCatalogues: {
        orderBy: (cat, { desc }) => [desc(cat.createdAt)],
        limit: 5,
      },
      offers: {
        where: sql`${listings.deletedAt} IS NULL`,
        orderBy: (offer, { desc }) => [desc(offer.createdAt)],
      },
      visits: {
        orderBy: (visit, { desc }) => [desc(visit.scheduledAt)],
        limit: 10,
      },
    },
  });
}

/**
 * Get listings with filters and pagination
 */
export async function getListings(
  filters: ListingFilters = {}
): Promise<PaginatedResult<Listing>> {
  const {
    page = 1,
    limit = 50,
    status,
    isVerified,
    minPrice,
    maxPrice,
    bhk,
    locality,
    city,
    includeDeleted = false,
  } = filters;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (!includeDeleted) {
    conditions.push(isNull(listings.deletedAt));
  }

  if (status) {
    conditions.push(eq(listings.status, status as any));
  }

  if (isVerified !== undefined) {
    conditions.push(eq(listings.isVerified, isVerified));
  }

  if (minPrice) {
    conditions.push(gte(listings.askingPrice, minPrice.toString()));
  }

  if (maxPrice) {
    conditions.push(lte(listings.askingPrice, maxPrice.toString()));
  }

  if (bhk) {
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM units 
        WHERE units.id = ${listings.unitId} 
        AND units.bhk = ${bhk}
      )`
    );
  }

  if (locality) {
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM units 
        JOIN buildings ON buildings.id = units.building_id
        WHERE units.id = ${listings.unitId}
        AND buildings.locality = ${locality}
      )`
    );
  }

  if (city) {
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM units 
        JOIN buildings ON buildings.id = units.building_id
        WHERE units.id = ${listings.unitId}
        AND buildings.city = ${city}
      )`
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db.query.listings.findMany({
      where: whereClause,
      with: {
        unit: {
          with: {
            building: true,
          },
        },
        listingAgent: true,
        zoneLead: true,
        // Notes are queried separately due to polymorphic relationship
        // Use noteService.getNotesByEntity('listing', id) if needed
        // MediaItems are queried separately due to polymorphic relationship
        // Use mediaService.getMediaItemsByEntity('listing', id) if needed
      },
      limit,
      offset,
      orderBy: [desc(listings.createdAt)],
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(listings)
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
 * Get active listings (for public API)
 */
export async function getActiveListings(
  filters: ListingFilters = {}
): Promise<PaginatedResult<Listing>> {
  return getListings({
    ...filters,
    status: "live",
    isVerified: true,
  });
}

/**
 * Update listing status
 */
export async function updateListingStatus(id: string, status: string): Promise<Listing> {
  const existing = await getListingById(id);
  if (!existing) {
    throw new NotFoundError("Listing", id);
  }

  const updateData: Partial<NewListing> = {
    status,
    updatedAt: new Date(),
  };

  // Set publishedAt when status becomes live
  if (status === "live" && existing.status !== "live") {
    updateData.publishedAt = new Date();
  }

  const [updated] = await db
    .update(listings)
    .set(updateData)
    .where(eq(listings.id, id))
    .returning();

  return updated;
}

/**
 * Update a listing
 */
export async function updateListing(
  id: string,
  data: Partial<NewListing>
): Promise<Listing> {
  const existing = await getListingById(id);
  if (!existing) {
    throw new NotFoundError("Listing", id);
  }

  const [updated] = await db
    .update(listings)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(listings.id, id))
    .returning();

  return updated;
}

/**
 * Soft delete a listing
 */
export async function deleteListing(id: string): Promise<void> {
  const existing = await getListingById(id);
  if (!existing) {
    throw new NotFoundError("Listing", id);
  }

  await db
    .update(listings)
    .set({ deletedAt: new Date() })
    .where(eq(listings.id, id));
}

/**
 * Verify a listing
 */
export async function verifyListing(id: string): Promise<Listing> {
  const existing = await getListingById(id);
  if (!existing) {
    throw new NotFoundError("Listing", id);
  }

  const [updated] = await db
    .update(listings)
    .set({ isVerified: true, updatedAt: new Date() })
    .where(eq(listings.id, id))
    .returning();

  return updated;
}

/**
 * Mark listing as sold
 */
export async function markListingAsSold(
  id: string,
  soldBy: "jumbo" | "owner" | "other_agent",
  sellingPrice?: number
): Promise<Listing> {
  const existing = await getListingById(id);
  if (!existing) {
    throw new NotFoundError("Listing", id);
  }

  const [updated] = await db
    .update(listings)
    .set({
      sold: true,
      soldBy,
      sellingPrice: sellingPrice?.toString(),
      status: "sold",
      updatedAt: new Date(),
    })
    .where(eq(listings.id, id))
    .returning();

  return updated;
}

