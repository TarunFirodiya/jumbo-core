import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { visits, visitTours } from "@/lib/db/schema";
import { uuidSchema } from "./common";

// Base schemas from Drizzle
export const insertVisitSchema = createInsertSchema(visits, {
  status: z.enum(["pending", "scheduled", "in_progress", "completed", "cancelled", "no_show"]).default("pending"),
  otpCode: z.string().length(4, "OTP must be 4 digits").optional(),
  feedbackRating: z.number().int().min(1).max(5).optional(),
});

export const selectVisitSchema = createSelectSchema(visits);

export const insertVisitTourSchema = createInsertSchema(visitTours, {
  status: z.enum(["planned", "in_progress", "completed", "cancelled"]).default("planned"),
  tourDate: z.date(),
  optimizedRoute: z.object({
    waypoints: z.array(z.object({
      lat: z.number(),
      lng: z.number(),
      listing_id: z.string().uuid(),
    })).optional(),
  }).optional(),
});

// Create tour request schema
export const createTourRequestSchema = z.object({
  dispatchAgentId: uuidSchema,
  fieldAgentId: uuidSchema,
  tourDate: z.coerce.date(),
  visitIds: z.array(uuidSchema).min(1, "At least one visit is required"),
  optimizedRoute: z.object({
    waypoints: z.array(z.object({
      lat: z.number(),
      lng: z.number(),
      listing_id: z.string().uuid(),
    })).optional(),
  }).optional(),
});

// Create visit request schema
export const createVisitRequestSchema = z.object({
  leadId: uuidSchema,
  listingId: uuidSchema,
  scheduledAt: z.coerce.date().optional(),
  tourId: uuidSchema.optional(),
});

// Verify visit OTP schema
export const verifyVisitOTPSchema = z.object({
  visitId: uuidSchema,
  otpCode: z.string().length(4, "OTP must be 4 digits"),
  geoData: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
  feedbackText: z.string().optional(),
  feedbackRating: z.number().int().min(1).max(5).optional(),
});

// Update visit status schema
export const updateVisitStatusSchema = z.object({
  status: z.enum(["pending", "scheduled", "in_progress", "completed", "cancelled", "no_show"]),
  feedbackText: z.string().optional(),
  feedbackRating: z.number().int().min(1).max(5).optional(),
});

// Update visit schema (for general updates)
export const updateVisitSchema = z.object({
  scheduledAt: z.coerce.date().optional().nullable(),
  status: z.enum(["pending", "scheduled", "in_progress", "completed", "cancelled", "no_show"]).optional(),
  feedbackText: z.string().optional().nullable(),
  feedbackRating: z.number().int().min(1).max(5).optional().nullable(),
});

// Type exports
export type CreateTourRequest = z.infer<typeof createTourRequestSchema>;
export type CreateVisitRequest = z.infer<typeof createVisitRequestSchema>;
export type VerifyVisitOTP = z.infer<typeof verifyVisitOTPSchema>;
export type UpdateVisitStatus = z.infer<typeof updateVisitStatusSchema>;
export type UpdateVisit = z.infer<typeof updateVisitSchema>;

