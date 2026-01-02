import { z } from "zod";
import { uuidSchema } from "./common";

// Offer status enum
export const offerStatusEnum = z.enum(["pending", "accepted", "rejected", "countered"]);

// Create offer schema
export const createOfferSchema = z.object({
  listingId: uuidSchema,
  leadId: uuidSchema,
  offerAmount: z.number().positive("Offer amount must be positive"),
  terms: z.record(z.string(), z.unknown()).optional(),
});

// Update offer schema
export const updateOfferSchema = z.object({
  offerAmount: z.number().positive().optional(),
  terms: z.record(z.string(), z.unknown()).optional(),
  status: offerStatusEnum.optional(),
});

// Accept/reject/counter offer schema
export const respondToOfferSchema = z.object({
  offerId: uuidSchema,
  action: z.enum(["accept", "reject", "counter"]),
  counterAmount: z.number().positive().optional(), // Required if action is "counter"
  reason: z.string().optional(),
  terms: z.record(z.string(), z.unknown()).optional(),
}).refine(
  (data) => {
    if (data.action === "counter") {
      return data.counterAmount !== undefined;
    }
    return true;
  },
  { message: "Counter amount is required when countering an offer" }
);

// Query offers schema
export const queryOffersSchema = z.object({
  listingId: uuidSchema.optional(),
  leadId: uuidSchema.optional(),
  status: offerStatusEnum.optional(),
});

// Type exports
export type CreateOfferRequest = z.infer<typeof createOfferSchema>;
export type UpdateOfferRequest = z.infer<typeof updateOfferSchema>;
export type RespondToOfferRequest = z.infer<typeof respondToOfferSchema>;
export type QueryOffersRequest = z.infer<typeof queryOffersSchema>;

