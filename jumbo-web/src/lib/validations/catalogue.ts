import { z } from "zod";
import { uuidSchema } from "./common";

// Catalogue status enum
export const catalogueStatusEnum = z.enum(["pending", "approved", "rejected", "needs_revision"]);

// Create catalogue schema
export const createCatalogueSchema = z.object({
  listingId: uuidSchema,
  inspectionId: z.string().uuid().optional().nullable(),
  name: z.string().optional(),
  inspectedOn: z.string().datetime().optional().nullable(),
  cataloguedById: uuidSchema,
  cataloguingScore: z.number().min(0).max(100).optional(),
  cauveryChecklist: z.boolean().default(false),
  thumbnailUrl: z.string().url().optional(),
  floorPlanUrl: z.string().url().optional(),
  buildingJsonUrl: z.string().url().optional(),
  listingJsonUrl: z.string().url().optional(),
  video30SecUrl: z.string().url().optional(),
  status: catalogueStatusEnum.default("pending"),
});

// Update catalogue schema
export const updateCatalogueSchema = createCatalogueSchema.partial().extend({
  listingId: uuidSchema.optional(),
  cataloguedById: uuidSchema.optional(),
});

// Approve/reject catalogue schema
export const approveCatalogueSchema = z.object({
  catalogueId: uuidSchema,
  status: z.enum(["approved", "rejected", "needs_revision"]),
  reason: z.string().optional(),
});

// Query catalogues schema
export const queryCataloguesSchema = z.object({
  listingId: uuidSchema.optional(),
  inspectionId: uuidSchema.optional(),
  status: catalogueStatusEnum.optional(),
});

// Type exports
export type CreateCatalogueRequest = z.infer<typeof createCatalogueSchema>;
export type UpdateCatalogueRequest = z.infer<typeof updateCatalogueSchema>;
export type ApproveCatalogueRequest = z.infer<typeof approveCatalogueSchema>;
export type QueryCataloguesRequest = z.infer<typeof queryCataloguesSchema>;

