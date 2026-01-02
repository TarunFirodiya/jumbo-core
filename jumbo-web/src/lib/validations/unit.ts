import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { units } from "@/lib/db/schema";

// Enum definitions
export const viewEnum = z.enum(["park", "road", "pool", "garden", "city", "lake", "other"]);
export const facingEnum = z.enum(["north", "south", "east", "west", "northeast", "northwest", "southeast", "southwest"]);

// Base schema from Drizzle
export const insertUnitSchema = createInsertSchema(units, {
  bhk: z.number().min(0.5).max(10),
  floorNumber: z.number().int().min(-5).max(100),
  carpetArea: z.number().positive(),
});

// Create unit schema
export const createUnitSchema = z.object({
  buildingId: z.string().uuid(),
  unitNumber: z.string().optional(),
  bhk: z.number().min(0.5).max(10),
  floorNumber: z.number().int().min(-5).max(100).optional(),
  carpetArea: z.number().positive().optional(),
  tower: z.string().optional(),
  view: viewEnum.optional(),
  superBuiltupArea: z.number().positive().optional(),
  facing: facingEnum.optional(),
  uds: z.number().positive().optional(),
  parkingCount: z.number().int().min(0).optional(),
  bedroomCount: z.number().int().min(0).optional(),
  bathroomCount: z.number().int().min(0).optional(),
  balconyCount: z.number().int().min(0).optional(),
  lpgConnection: z.boolean().default(false),
  keysPhone: z.string().optional(),
  keysWith: z.string().optional(),
  ownerId: z.string().uuid().optional().nullable(),
});

// Update unit schema (partial)
export const updateUnitSchema = createUnitSchema.partial().extend({
  buildingId: z.string().uuid().optional(),
});

// Type exports
export type CreateUnitRequest = z.infer<typeof createUnitSchema>;
export type UpdateUnitRequest = z.infer<typeof updateUnitSchema>;

