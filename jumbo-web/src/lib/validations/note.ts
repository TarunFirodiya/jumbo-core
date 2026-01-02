import { z } from "zod";
import { uuidSchema } from "./common";

// Entity types that can have notes
export const noteEntityTypeEnum = z.enum([
  "seller_lead",
  "buyer_lead",
  "listing",
  "visit",
  "building",
  "unit",
  "inspection",
  "catalogue",
]);

// Create note schema
export const createNoteSchema = z.object({
  entityType: noteEntityTypeEnum,
  entityId: uuidSchema,
  content: z.string().min(1, "Note content is required"),
});

// Update note schema
export const updateNoteSchema = z.object({
  content: z.string().min(1, "Note content is required"),
});

// Query notes schema
export const queryNotesSchema = z.object({
  entityType: noteEntityTypeEnum,
  entityId: uuidSchema,
});

// Type exports
export type CreateNoteRequest = z.infer<typeof createNoteSchema>;
export type UpdateNoteRequest = z.infer<typeof updateNoteSchema>;
export type QueryNotesRequest = z.infer<typeof queryNotesSchema>;

