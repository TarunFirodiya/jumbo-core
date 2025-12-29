import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { sellerLeads } from "@/lib/db/schema";
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

// Base schema from Drizzle for seller leads
export const insertSellerLeadSchema = createInsertSchema(sellerLeads, {
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: indianPhoneSchema,
  email: z.string().email("Invalid email address").optional().nullable(),
});

// Create seller lead schema (for form validation)
export const createSellerLeadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: indianPhoneSchema,
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  status: z.enum(["new", "proposal_sent", "proposal_accepted", "dropped"]).default("new"),
  source: z.enum(["website", "99acres", "magicbricks", "housing", "nobroker", "mygate", "referral"]),
  sourceUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  referredById: z.string().uuid().optional().nullable(),
  buildingId: z.string().uuid().optional().nullable(),
  unitId: z.string().uuid().optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable(),
  followUpDate: z.string().optional().nullable(),
  isNri: z.boolean().default(false),
  notes: z.string().optional(),
});

// Create seller (profile) schema
// Validates the input for creating a new seller profile
export const createSellerSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: indianPhoneSchema,
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
});

// Update seller lead schema (partial for updates)
export const updateSellerLeadSchema = createSellerLeadSchema.partial();

export type CreateSellerLeadRequest = z.infer<typeof createSellerLeadSchema>;
export type UpdateSellerLeadRequest = z.infer<typeof updateSellerLeadSchema>;

