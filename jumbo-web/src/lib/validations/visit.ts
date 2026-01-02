import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { visits, visitTours } from "@/lib/db/schema";
import { uuidSchema, indianPhoneSchema } from "./common";

// Enum definitions for visit fields
export const dropReasonEnum = z.enum(["not_interested", "price_too_high", "found_elsewhere", "invalid_lead", "duplicate", "other"]);
export const visitedWithEnum = z.enum(["alone", "family", "friends", "agent"]);
export const primaryPainPointEnum = z.enum(["price", "location", "size", "condition", "amenities", "other"]);

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

// Verify visit OTP schema (requires location capture)
export const verifyVisitOTPSchema = z.object({
  visitId: uuidSchema,
  otpCode: z.string().length(4, "OTP must be 4 digits"),
  geoData: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  feedbackText: z.string().optional(),
  feedbackRating: z.number().int().min(1).max(5).optional(),
  feedback: z.string().optional(),
  buyerScore: z.number().min(0).max(10).optional(),
  primaryPainPoint: primaryPainPointEnum.optional(),
});

// Update visit status schema
export const updateVisitStatusSchema = z.object({
  status: z.enum(["pending", "scheduled", "in_progress", "completed", "cancelled", "no_show"]),
  feedbackText: z.string().optional(),
  feedbackRating: z.number().int().min(1).max(5).optional(),
});

// Update visit schema (for general updates)
export const updateVisitSchema = z.object({
  visitorName: z.string().optional().nullable(),
  homesVisited: z.string().optional().nullable(),
  scheduledAt: z.coerce.date().optional().nullable(),
  status: z.enum(["pending", "scheduled", "in_progress", "completed", "cancelled", "no_show"]).optional(),
  visitCompleted: z.boolean().optional(),
  visitCanceled: z.boolean().optional(),
  visitConfirmed: z.boolean().optional(),
  dropReason: dropReasonEnum.optional().nullable(),
  visitedWith: visitedWithEnum.optional().nullable(),
  secondaryPhone: indianPhoneSchema.optional().nullable(),
  visitLocation: z.string().optional().nullable(),
  primaryPainPoint: primaryPainPointEnum.optional().nullable(),
  buyerScore: z.number().min(0).max(10).optional().nullable(),
  rescheduleTime: z.coerce.date().optional().nullable(),
  rescheduleRequested: z.boolean().optional(),
  feedbackText: z.string().optional().nullable(),
  feedback: z.string().optional().nullable(),
  feedbackRating: z.number().int().min(1).max(5).optional().nullable(),
  bsaBool: z.boolean().optional(),
});

// Visit workflow action schemas
export const confirmVisitSchema = z.object({
  visitId: uuidSchema,
});

export const cancelVisitSchema = z.object({
  visitId: uuidSchema,
  dropReason: dropReasonEnum,
});

export const rescheduleVisitSchema = z.object({
  visitId: uuidSchema,
  newScheduledAt: z.coerce.date(),
});

export const completeVisitSchema = z.object({
  visitId: uuidSchema,
  otpCode: z.string().length(4, "OTP must be 4 digits"),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  feedback: z.string().optional(),
  feedbackRating: z.number().int().min(1).max(5).optional(),
  buyerScore: z.number().min(0).max(10).optional(),
  primaryPainPoint: primaryPainPointEnum.optional(),
});

// Type exports
export type CreateTourRequest = z.infer<typeof createTourRequestSchema>;
export type CreateVisitRequest = z.infer<typeof createVisitRequestSchema>;
export type VerifyVisitOTP = z.infer<typeof verifyVisitOTPSchema>;
export type UpdateVisitStatus = z.infer<typeof updateVisitStatusSchema>;
export type UpdateVisit = z.infer<typeof updateVisitSchema>;
export type ConfirmVisit = z.infer<typeof confirmVisitSchema>;
export type CancelVisit = z.infer<typeof cancelVisitSchema>;
export type RescheduleVisit = z.infer<typeof rescheduleVisitSchema>;
export type CompleteVisit = z.infer<typeof completeVisitSchema>;

