import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { leads } from "@/lib/db/schema";
import { indianPhoneSchema } from "./common";

// Base schemas from Drizzle
export const insertLeadSchema = createInsertSchema(leads, {
  source: z.string().min(1, "Source is required"),
  status: z.enum(["new", "contacted", "active_visitor", "at_risk", "closed"]).default("new"),
  requirementJson: z.object({
    bhk: z.array(z.number()).optional(),
    budget_min: z.number().positive().optional(),
    budget_max: z.number().positive().optional(),
    localities: z.array(z.string()).optional(),
  }).optional(),
});

export const selectLeadSchema = createSelectSchema(leads);

// API request schemas
export const createLeadRequestSchema = z.object({
  // Profile info (will create or find existing profile)
  profile: z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    phone: indianPhoneSchema,
    email: z.string().email().optional().nullable(),
  }),
  // Lead specific info
  source: z.string().min(1, "Source is required"),
  externalId: z.string().optional(),
  requirements: z.object({
    bhk: z.array(z.number().int().min(1).max(10)).optional(),
    budget_min: z.number().positive().optional(),
    budget_max: z.number().positive().optional(),
    localities: z.array(z.string()).optional(),
  }).optional(),
});

export const updateLeadStatusSchema = z.object({
  status: z.enum(["new", "contacted", "active_visitor", "at_risk", "closed"]),
  notes: z.string().optional(),
});

export const assignLeadSchema = z.object({
  agentId: z.string().uuid("Invalid agent ID"),
});

// Housing.com webhook schema
export const housingWebhookSchema = z.object({
  lead_id: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string().email().optional().nullable(),
  property_type: z.string().optional(),
  budget_min: z.number().optional(),
  budget_max: z.number().optional(),
  preferred_localities: z.array(z.string()).optional(),
  bhk: z.array(z.number()).optional(),
  timestamp: z.string().datetime(),
});

// Query params schema
export const leadQuerySchema = z.object({
  status: z.enum(["new", "contacted", "active_visitor", "at_risk", "closed"]).optional(),
  source: z.string().optional(),
  agentId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
});

// Type exports
export type CreateLeadRequest = z.infer<typeof createLeadRequestSchema>;
export type UpdateLeadStatus = z.infer<typeof updateLeadStatusSchema>;
export type AssignLead = z.infer<typeof assignLeadSchema>;
export type HousingWebhook = z.infer<typeof housingWebhookSchema>;
export type LeadQuery = z.infer<typeof leadQuerySchema>;

