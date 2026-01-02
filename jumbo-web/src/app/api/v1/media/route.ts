import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { logActivity, computeChanges } from "@/lib/audit";
import { uploadMediaSchema, queryMediaSchema, updateMediaOrderSchema } from "@/lib/validations/media";
import * as mediaService from "@/services/media.service";

/**
 * GET /api/v1/media
 * List media items by entity type and entity ID
 */
export const GET = withAuth(
  async (request: NextRequest) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const query = queryMediaSchema.parse({
        entityType: searchParams.get("entityType"),
        entityId: searchParams.get("entityId"),
        tag: searchParams.get("tag") || undefined,
      });

      const mediaList = await mediaService.getMediaByEntity(
        query.entityType,
        query.entityId,
        query.tag
      );

      return { data: mediaList };
    } catch (error) {
      console.error("Error fetching media:", error);
      throw new Error("Failed to fetch media");
    }
  },
  "media:read"
);

/**
 * POST /api/v1/media
 * Upload/create a new media item
 */
export const POST = withAuth<{ data: unknown; message: string } | { error: string; message: string; details?: unknown }>(
  async (request: NextRequest, { user, profile }) => {
    try {
      const body = await request.json();
      const validatedData = uploadMediaSchema.parse(body);

      const newMedia = await mediaService.uploadMedia({
        entityType: validatedData.entityType,
        entityId: validatedData.entityId,
        mediaType: validatedData.mediaType as "image" | "video" | "floor_plan" | "document",
        tag: validatedData.tag,
        cloudinaryUrl: validatedData.cloudinaryUrl,
        cloudinaryPublicId: validatedData.cloudinaryPublicId,
        order: validatedData.order,
        metadata: validatedData.metadata,
        uploadedById: user.id,
      });

      await logActivity({
        entityType: "media_item",
        entityId: newMedia.id,
        action: "create",
        changes: computeChanges(null, newMedia),
        performedById: user.id,
      });

      return NextResponse.json(
        {
          data: newMedia,
          message: "Media uploaded successfully",
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("Error uploading media:", error);

      if (error instanceof Error && error.name === "ZodError") {
        return NextResponse.json(
          { error: "Validation Error", message: "Invalid request body", details: (error as unknown as { errors: unknown[] }).errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Internal Server Error", message: "Failed to upload media" },
        { status: 500 }
      );
    }
  },
  "media:create"
);

/**
 * PATCH /api/v1/media
 * Update media order (bulk reordering)
 */
export const PATCH = withAuth(
  async (request: NextRequest, { user }) => {
    try {
      const body = await request.json();
      const validatedData = updateMediaOrderSchema.parse(body);

      await mediaService.updateMediaOrder(validatedData.mediaItems);

      await logActivity({
        entityType: "media_item",
        entityId: "bulk",
        action: "update",
        changes: { order: { old: "previous", new: "updated" } },
        performedById: user.id,
      });

      return NextResponse.json({
        message: "Media order updated successfully",
      });
    } catch (error) {
      console.error("Error updating media order:", error);

      if (error instanceof Error && error.name === "ZodError") {
        return NextResponse.json(
          { error: "Validation Error", message: "Invalid request body", details: (error as unknown as { errors: unknown[] }).errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Internal Server Error", message: "Failed to update media order" },
        { status: 500 }
      );
    }
  },
  "media:update"
);
