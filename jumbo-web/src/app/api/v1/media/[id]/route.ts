import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mediaItems } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { logActivity, computeChanges } from "@/lib/audit";
import { updateMediaSchema } from "@/lib/validations/media";

/**
 * GET /api/v1/media/[id]
 * Get a single media item by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const media = await db.query.mediaItems.findFirst({
      where: and(
        eq(mediaItems.id, id),
        sql`${mediaItems.deletedAt} IS NULL`
      ),
      with: {
        uploadedBy: true,
      },
    });

    if (!media) {
      return NextResponse.json(
        { error: "Not Found", message: "Media item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: media });
  } catch (error) {
    console.error("Error fetching media:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to fetch media" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/media/[id]
 * Update a media item (tag, order, metadata)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify authentication
    const { user, profile } = await requireAuth();
    if (!user || !profile) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    // Get existing media
    const existingMedia = await db.query.mediaItems.findFirst({
      where: and(
        eq(mediaItems.id, id),
        sql`${mediaItems.deletedAt} IS NULL`
      ),
    });

    if (!existingMedia) {
      return NextResponse.json(
        { error: "Not Found", message: "Media item not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateMediaSchema.parse(body);
    
    const updateData: Record<string, unknown> = {};

    if (validatedData.tag !== undefined) updateData.tag = validatedData.tag;
    if (validatedData.order !== undefined) updateData.order = validatedData.order;
    if (validatedData.metadata !== undefined) updateData.metadata = validatedData.metadata;

    const [updatedMedia] = await db
      .update(mediaItems)
      .set(updateData)
      .where(eq(mediaItems.id, id))
      .returning();

    // Log the update
    const changes = computeChanges(existingMedia as Record<string, unknown>, updatedMedia as Record<string, unknown>);
    if (changes) {
      await logActivity({
        entityType: "media_item",
        entityId: id,
        action: "update",
        changes,
        performedById: user.id,
      });
    }

    const mediaWithRelations = await db.query.mediaItems.findFirst({
      where: eq(mediaItems.id, id),
      with: {
        uploadedBy: true,
      },
    });

    return NextResponse.json({
      data: mediaWithRelations,
      message: "Media updated successfully",
    });
  } catch (error) {
    console.error("Error updating media:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation Error", message: "Invalid request body", details: (error as any).errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to update media" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/media/[id]
 * Soft delete a media item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify authentication
    const { user, profile } = await requireAuth();
    if (!user || !profile) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if media exists
    const existingMedia = await db.query.mediaItems.findFirst({
      where: and(
        eq(mediaItems.id, id),
        sql`${mediaItems.deletedAt} IS NULL`
      ),
    });

    if (!existingMedia) {
      return NextResponse.json(
        { error: "Not Found", message: "Media item not found" },
        { status: 404 }
      );
    }

    // Soft delete
    await db
      .update(mediaItems)
      .set({ deletedAt: new Date() })
      .where(eq(mediaItems.id, id));

    // Log the deletion
    await logActivity({
      entityType: "media_item",
      entityId: id,
      action: "delete",
      changes: null,
      performedById: user.id,
    });

    return NextResponse.json({
      message: "Media deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting media:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to delete media" },
      { status: 500 }
    );
  }
}
