import { z } from "zod";
import { indianPhoneSchema } from "./common";

// Seller lead status options
export const sellerLeadStatusOptions = [
  { value: "new", label: "New" },
  { value: "proposal_sent", label: "Proposal Sent" },
  { value: "proposal_accepted", label: "Proposal Accepted" },
  { value: "dropped", label: "Dropped" },
] as const;

// Seller lead source options
export const sellerLeadSourceOptions = [
  { value: "website", label: "Website" },
  { value: "99acres", label: "99Acres" },
  { value: "magicbricks", label: "Magicbricks" },
  { value: "housing", label: "Housing.com" },
  { value: "nobroker", label: "NoBroker" },
  { value: "mygate", label: "MyGate" },
  { value: "referral", label: "Referral" },
] as const;

// Drop reason enum
export const dropReasonOptions = [
  { value: "not_interested", label: "Not Interested" },
  { value: "price_too_high", label: "Price Too High" },
  { value: "found_elsewhere", label: "Found Elsewhere" },
  { value: "invalid_lead", label: "Invalid Lead" },
  { value: "duplicate", label: "Duplicate" },
  { value: "other", label: "Other" },
] as const;

// Create seller lead schema (for form validation)
// Contact info (name, phone, email) is now used to create/find a Contact,
// not stored directly on seller_leads.
export const createSellerLeadSchema = z.object({
  // Contact info — used to create/find contact
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: indianPhoneSchema,
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  // Seller lead fields
  status: z.enum(["new", "proposal_sent", "proposal_accepted", "dropped"]).default("new"),
  source: z.enum(["website", "99acres", "magicbricks", "housing", "nobroker", "mygate", "referral"]),
  sourceUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  sourceListingUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  dropReason: z.enum(["not_interested", "price_too_high", "found_elsewhere", "invalid_lead", "duplicate", "other"]).optional().nullable(),
  referredById: z.string().uuid().optional().nullable(),
  buildingId: z.string().uuid().optional().nullable(),
  unitId: z.string().uuid().optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable(),
  followUpDate: z.string().optional().nullable(),
  isNri: z.boolean().default(false),
});

// Create seller (contact) schema
// Validates the input for creating a new seller contact
export const createSellerSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: indianPhoneSchema,
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
});

// Update seller lead schema (partial for updates)
export const updateSellerLeadSchema = createSellerLeadSchema.partial();

export type CreateSellerLeadRequest = z.infer<typeof createSellerLeadSchema>;
export type UpdateSellerLeadRequest = z.infer<typeof updateSellerLeadSchema>;
