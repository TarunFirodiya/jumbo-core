import { z } from "zod";
import { uuidSchema } from "./common";

// Inspection status enum
export const inspectionStatusEnum = z.enum(["pending", "in_progress", "completed", "rejected"]);

// Create inspection schema
export const createInspectionSchema = z.object({
  listingId: z.string().uuid().optional().nullable(),
  name: z.string().optional(),
  location: z.string().optional(),
  inspectedOn: z.string().datetime().optional().nullable(),
  inspectedById: uuidSchema,
  inspectionLatitude: z.number().min(-90).max(90).optional(),
  inspectionLongitude: z.number().min(-180).max(180).optional(),
  inspectionScore: z.number().min(0).max(100).optional(),
  attempts: z.number().int().min(0).default(0),
  notes: z.string().optional(),
  cauveryChecklist: z.boolean().default(false),
  knownIssues: z.array(z.string()).optional(),
  imagesJsonUrl: z.string().url().optional(),
  buildingJsonUrl: z.string().url().optional(),
  videoLink: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  status: inspectionStatusEnum.default("pending"),
});

// Update inspection schema
export const updateInspectionSchema = createInspectionSchema.partial().extend({
  listingId: z.string().uuid().optional().nullable(),
  inspectedById: uuidSchema.optional(),
});

// Complete inspection schema (with location capture)
export const completeInspectionSchema = z.object({
  inspectionId: uuidSchema,
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  inspectionScore: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  knownIssues: z.array(z.string()).optional(),
});

// Query inspections schema
export const queryInspectionsSchema = z.object({
  listingId: uuidSchema.optional(),
  status: inspectionStatusEnum.optional(),
});

// Type exports
export type CreateInspectionRequest = z.infer<typeof createInspectionSchema>;
export type UpdateInspectionRequest = z.infer<typeof updateInspectionSchema>;
export type CompleteInspectionRequest = z.infer<typeof completeInspectionSchema>;
export type QueryInspectionsRequest = z.infer<typeof queryInspectionsSchema>;

