/**
 * Media Service
 * Handles all database operations for media items
 */

import { db } from "@/lib/db";
import { mediaItems, type NewMediaItem, type MediaItem } from "@/lib/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { NotFoundError } from "./errors";

/**
 * Upload (create) a media item
 */
export async function uploadMedia(data: {
  entityType: string;
  entityId: string;
  mediaType: "image" | "video" | "floor_plan" | "document";
  cloudinaryUrl: string;
  cloudinaryPublicId?: string;
  tag?: string;
  order?: number;
  metadata?: Record<string, unknown>;
  uploadedById: string;
}): Promise<MediaItem> {
  const [media] = await db
    .insert(mediaItems)
    .values({
      entityType: data.entityType,
      entityId: data.entityId,
      mediaType: data.mediaType,
      cloudinaryUrl: data.cloudinaryUrl,
      cloudinaryPublicId: data.cloudinaryPublicId ?? null,
      tag: data.tag ?? null,
      order: data.order ?? 0,
      metadata: data.metadata ?? null,
      uploadedById: data.uploadedById,
    })
    .returning();

  return media;
}

/**
 * Get media item by ID
 */
export async function getMediaById(id: string): Promise<MediaItem | null> {
  return db.query.mediaItems.findFirst({
    where: and(eq(mediaItems.id, id), isNull(mediaItems.deletedAt)),
    with: {
      uploadedBy: true,
    },
  });
}

/**
 * Get media by entity
 */
export async function getMediaByEntity(
  entityType: string,
  entityId: string,
  tag?: string
): Promise<MediaItem[]> {
  const conditions = [
    eq(mediaItems.entityType, entityType),
    eq(mediaItems.entityId, entityId),
    isNull(mediaItems.deletedAt),
  ];

  if (tag) {
    conditions.push(eq(mediaItems.tag, tag));
  }

  return db.query.mediaItems.findMany({
    where: and(...conditions),
    with: {
      uploadedBy: true,
    },
    orderBy: [mediaItems.order, desc(mediaItems.createdAt)],
  });
}

/**
 * Update media order (bulk)
 */
export async function updateMediaOrder(
  items: Array<{ id: string; order: number }>
): Promise<void> {
  await Promise.all(
    items.map((item) =>
      db
        .update(mediaItems)
        .set({ order: item.order })
        .where(eq(mediaItems.id, item.id))
    )
  );
}

/**
 * Update a media item
 */
export async function updateMedia(
  id: string,
  data: Partial<NewMediaItem>
): Promise<MediaItem> {
  const existing = await getMediaById(id);
  if (!existing) {
    throw new NotFoundError("MediaItem", id);
  }

  const [updated] = await db
    .update(mediaItems)
    .set(data)
    .where(eq(mediaItems.id, id))
    .returning();

  return updated;
}

/**
 * Soft delete a media item
 */
export async function deleteMedia(id: string): Promise<void> {
  const existing = await getMediaById(id);
  if (!existing) {
    throw new NotFoundError("MediaItem", id);
  }

  await db
    .update(mediaItems)
    .set({ deletedAt: new Date() })
    .where(eq(mediaItems.id, id));
}

/**
 * Get media count by entity
 */
export async function getMediaCountByEntity(
  entityType: string,
  entityId: string
): Promise<number> {
  const result = await db.query.mediaItems.findMany({
    where: and(
      eq(mediaItems.entityType, entityType),
      eq(mediaItems.entityId, entityId),
      isNull(mediaItems.deletedAt)
    ),
  });

  return result.length;
}

