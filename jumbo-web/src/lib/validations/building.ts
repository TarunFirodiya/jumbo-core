import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { buildings } from "@/lib/db/schema";

// Base schema from Drizzle
export const insertBuildingSchema = createInsertSchema(buildings, {
  name: z.string().min(2, "Building name is required"),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  amenitiesJson: z.record(z.string(), z.boolean()).optional(),
});

// Create building schema
export const createBuildingSchema = z.object({
  name: z.string().min(2, "Building name is required"),
  locality: z.string().optional(),
  city: z.string().optional(),
  nearestLandmark: z.string().optional(),
  possessionDate: z.string().datetime().optional().nullable(),
  totalFloors: z.number().int().positive().optional(),
  totalUnits: z.number().int().positive().optional(),
  acres: z.number().positive().optional(),
  mapLink: z.string().url().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  amenitiesJson: z.record(z.string(), z.boolean()).optional(),
  waterSource: z.string().optional(),
  khata: z.string().optional(),
  reraNumber: z.string().optional(),
  jumboPriceEstimate: z.number().positive().optional(),
  underConstruction: z.boolean().default(false),
  isModelFlatAvailable: z.boolean().default(false),
  googleRating: z.number().min(0).max(5).optional(),
  gtmHousingName: z.string().optional(),
  gtmHousingId: z.string().optional(),
  mediaJson: z.record(z.string(), z.array(z.string())).optional(),
  createdById: z.string().uuid().optional().nullable(),
});

// Update building schema (partial)
export const updateBuildingSchema = createBuildingSchema.partial();

// Type exports
export type CreateBuildingRequest = z.infer<typeof createBuildingSchema>;
export type UpdateBuildingRequest = z.infer<typeof updateBuildingSchema>;

