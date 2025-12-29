import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { communications } from "@/lib/db/schema";
import { uuidSchema } from "./common";

// Base schema from Drizzle
export const insertCommunicationSchema = createInsertSchema(communications, {
  channel: z.enum(["whatsapp", "call", "email", "sms", "in_person"]),
  direction: z.enum(["inbound", "outbound"]),
  content: z.string().min(1, "Content is required"),
  recordingUrl: z.string().url().optional().nullable(),
  metadata: z.object({
    duration: z.number().optional(),
    wa_message_id: z.string().optional(),
  }).optional(),
});

// Create communication request schema
export const createCommunicationSchema = z.object({
  leadId: uuidSchema.optional(),
  sellerLeadId: uuidSchema.optional(),
  agentId: uuidSchema,
  channel: z.enum(["whatsapp", "call", "email", "sms", "in_person"]),
  direction: z.enum(["inbound", "outbound"]),
  content: z.string().min(1, "Content is required"),
  recordingUrl: z.string().url().optional().nullable(),
  metadata: z.object({
    duration: z.number().optional(),
    wa_message_id: z.string().optional(),
  }).optional(),
}).refine(
  (data) => data.leadId || data.sellerLeadId,
  { message: "Either leadId or sellerLeadId must be provided" }
);

// Type exports
export type CreateCommunication = z.infer<typeof createCommunicationSchema>;

