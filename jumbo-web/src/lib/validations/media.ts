import { z } from "zod";
import { uuidSchema } from "./common";

// Media type enum
export const mediaTypeEnum = z.enum(["image", "video", "floor_plan", "document"]);

// Entity types that can have media
export const mediaEntityTypeEnum = z.enum([
  "listing",
  "building",
  "home_inspection",
  "home_catalogue",
]);

// Upload media schema
export const uploadMediaSchema = z.object({
  entityType: mediaEntityTypeEnum,
  entityId: uuidSchema,
  mediaType: mediaTypeEnum,
  tag: z.string().optional(), // 'living_room', 'kitchen', 'bedroom_1', 'facade', etc.
  cloudinaryUrl: z.string().url("Invalid Cloudinary URL"),
  cloudinaryPublicId: z.string().optional(),
  order: z.number().int().min(0).default(0),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Update media schema (for reordering, changing tags)
export const updateMediaSchema = z.object({
  tag: z.string().optional(),
  order: z.number().int().min(0).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Query media schema
export const queryMediaSchema = z.object({
  entityType: mediaEntityTypeEnum,
  entityId: uuidSchema,
  tag: z.string().optional(),
});

// Update media order schema (for bulk reordering)
export const updateMediaOrderSchema = z.object({
  mediaItems: z.array(z.object({
    id: uuidSchema,
    order: z.number().int().min(0),
  })),
});

// Type exports
export type UploadMediaRequest = z.infer<typeof uploadMediaSchema>;
export type UpdateMediaRequest = z.infer<typeof updateMediaSchema>;
export type QueryMediaRequest = z.infer<typeof queryMediaSchema>;
export type UpdateMediaOrderRequest = z.infer<typeof updateMediaOrderSchema>;

