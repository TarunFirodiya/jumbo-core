import { z } from "zod";
import { indianPhoneSchema } from "./common";

// Lead source options (same as seller leads + manual entry options)
export const leadSourceOptions = [
  { value: "website", label: "Website" },
  { value: "99acres", label: "99Acres" },
  { value: "magicbricks", label: "Magicbricks" },
  { value: "housing", label: "Housing.com" },
  { value: "nobroker", label: "NoBroker" },
  { value: "mygate", label: "MyGate" },
  { value: "referral", label: "Referral" },
  { value: "manual_entry", label: "Manual Entry" },
  { value: "walk_in", label: "Walk-in" },
  { value: "phone_inquiry", label: "Phone Inquiry" },
] as const;

// Lead status options
export const leadStatusOptions = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "active_visitor", label: "Active Visitor" },
  { value: "at_risk", label: "At Risk" },
  { value: "closed", label: "Closed" },
] as const;

// API request schemas
// Contact info (fullName, phone, email) is used to create/find a Contact.
// No secondaryPhone — that now goes in contacts.metadata.
export const createLeadRequestSchema = z.object({
  // Contact info — used to create/find contact
  profile: z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    phone: indianPhoneSchema,
    email: z.string().email().optional().nullable(),
  }),
  // Lead specific info
  leadId: z.string().optional(),
  source: z.string().min(1, "Source is required"),
  status: z.enum(["new", "contacted", "active_visitor", "at_risk", "closed"]).default("new"),
  externalId: z.string().optional(),
  sourceListingId: z.string().optional().nullable(),
  dropReason: z.string().optional().nullable(),
  locality: z.string().optional(),
  zone: z.string().optional(),
  pipeline: z.boolean().default(false),
  referredBy: z.string().optional(),
  testListingId: z.string().optional(),
  requirements: z.object({
    bhk: z.array(z.number().int().min(1).max(10)).optional(),
    budget_min: z.number().positive().optional(),
    budget_max: z.number().positive().optional(),
    localities: z.array(z.string()).optional(),
  }).optional(),
  preferences: z.object({
    configuration: z.array(z.string()).optional(),
    max_cap: z.string().optional(),
    landmark: z.string().optional(),
    property_type: z.string().optional(),
    floor_preference: z.string().optional(),
    khata: z.string().optional(),
    main_door_facing: z.string().optional(),
    must_haves: z.array(z.string()).optional(),
    buy_reason: z.string().optional(),
    preferred_buildings: z.array(z.string().uuid()).optional(),
  }).optional(),
  assignedAgentId: z.string().uuid().optional().nullable(),
});

// Form schema for creating leads from UI (flattened structure)
export const createLeadFormSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: indianPhoneSchema,
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  source: z.enum(["website", "99acres", "magicbricks", "housing", "nobroker", "mygate", "referral", "manual_entry", "walk_in", "phone_inquiry"]),
  status: z.enum(["new", "contacted", "active_visitor", "at_risk", "closed"]).default("new"),
  assignedAgentId: z.string().uuid().optional().nullable(),
});

export const updateLeadStatusSchema = z.object({
  status: z.enum(["new", "contacted", "active_visitor", "at_risk", "closed"]),
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
export type CreateLeadFormData = z.infer<typeof createLeadFormSchema>;
export type UpdateLeadStatus = z.infer<typeof updateLeadStatusSchema>;
export type AssignLead = z.infer<typeof assignLeadSchema>;
export type HousingWebhook = z.infer<typeof housingWebhookSchema>;
export type LeadQuery = z.infer<typeof leadQuerySchema>;
