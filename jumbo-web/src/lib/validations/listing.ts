import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { listings, buildings, units } from "@/lib/db/schema";

// Base schemas from Drizzle
export const insertListingSchema = createInsertSchema(listings);
export const selectListingSchema = createSelectSchema(listings);

export const insertBuildingSchema = createInsertSchema(buildings, {
  name: z.string().min(2, "Building name is required"),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  amenitiesJson: z.record(z.string(), z.boolean()).optional(),
});

export const insertUnitSchema = createInsertSchema(units, {
  bhk: z.number().min(0.5).max(10),
  floorNumber: z.number().int().min(-5).max(100),
  carpetArea: z.number().positive(),
});

// API request schemas
export const createListingRequestSchema = z.object({
  // Building info (can reference existing or create new)
  building: z.union([
    z.object({
      id: z.string().uuid(),
    }),
    z.object({
      name: z.string().min(2),
      locality: z.string().optional(),
      city: z.string().optional(),
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
      amenities: z.record(z.string(), z.boolean()).optional(),
      waterSource: z.string().optional(),
    }),
  ]),
  // Unit info
  unit: z.object({
    unitNumber: z.string().optional(),
    bhk: z.number().min(0.5).max(10),
    floorNumber: z.number().int().min(-5).max(100).optional(),
    carpetArea: z.number().positive().optional(),
    ownerId: z.string().uuid().optional(),
  }),
  // Listing info
  askingPrice: z.number().positive(),
  externalIds: z.object({
    housing_id: z.string().optional(),
    magicbricks_id: z.string().optional(),
  }).optional(),
});

export const updateListingStatusSchema = z.object({
  status: z.enum(["draft", "inspection_pending", "active", "inactive", "sold"]),
  notes: z.string().optional(),
});

export const updateListingPriceSchema = z.object({
  askingPrice: z.number().positive(),
});

export const verifyListingSchema = z.object({
  isVerified: z.boolean(),
  inspectionNotes: z.string().optional(),
});

// Query params schema
export const listingQuerySchema = z.object({
  status: z.enum(["draft", "inspection_pending", "active", "inactive", "sold"]).optional(),
  isVerified: z.coerce.boolean().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  bhk: z.coerce.number().optional(),
  locality: z.string().optional(),
  city: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Public API schema (for jumbohomes.in)
export const publicListingQuerySchema = z.object({
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  bhk: z.coerce.number().optional(),
  locality: z.string().optional(),
  city: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

// Type exports
export type CreateListingRequest = z.infer<typeof createListingRequestSchema>;
export type UpdateListingStatus = z.infer<typeof updateListingStatusSchema>;
export type UpdateListingPrice = z.infer<typeof updateListingPriceSchema>;
export type VerifyListing = z.infer<typeof verifyListingSchema>;
export type ListingQuery = z.infer<typeof listingQuerySchema>;
export type PublicListingQuery = z.infer<typeof publicListingQuerySchema>;

