import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { homeCatalogues, mediaItems } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { logActivity, computeChanges } from "@/lib/audit";
import { updateCatalogueSchema, approveCatalogueSchema } from "@/lib/validations/catalogue";

/**
 * GET /api/v1/catalogues/[id]
 * Get a single catalogue by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const catalogue = await db.query.homeCatalogues.findFirst({
      where: eq(homeCatalogues.id, id),
      with: {
        listing: {
          with: {
            unit: {
              with: {
                building: true,
              },
            },
          },
        },
        inspection: {
          with: {
            inspectedBy: true,
          },
        },
        cataloguedBy: true,
        mediaItems: {
          where: sql`${mediaItems.deletedAt} IS NULL`,
          orderBy: [mediaItems.order, mediaItems.createdAt],
          with: {
            uploadedBy: true,
          },
        },
      },
    });

    if (!catalogue) {
      return NextResponse.json(
        { error: "Not Found", message: "Catalogue not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: catalogue });
  } catch (error) {
    console.error("Error fetching catalogue:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to fetch catalogue" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/catalogues/[id]
 * Update a catalogue
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

    // Get existing catalogue
    const existingCatalogue = await db.query.homeCatalogues.findFirst({
      where: eq(homeCatalogues.id, id),
    });

    if (!existingCatalogue) {
      return NextResponse.json(
        { error: "Not Found", message: "Catalogue not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateCatalogueSchema.parse(body);
    
    const updateData: Record<string, unknown> = {};

    // Map all fields from validated data
    Object.keys(validatedData).forEach((key) => {
      if (validatedData[key as keyof typeof validatedData] !== undefined) {
        if (key === "inspectedOn") {
          const value = validatedData[key as keyof typeof validatedData];
          updateData[key] = value ? new Date(value as string) : null;
        } else {
          updateData[key] = validatedData[key as keyof typeof validatedData];
        }
      }
    });

    updateData.updatedAt = new Date();

    const [updatedCatalogue] = await db
      .update(homeCatalogues)
      .set(updateData)
      .where(eq(homeCatalogues.id, id))
      .returning();

    // Log the update
    const changes = computeChanges(existingCatalogue as Record<string, unknown>, updatedCatalogue as Record<string, unknown>);
    if (changes) {
      await logActivity({
        entityType: "home_catalogue",
        entityId: id,
        action: "update",
        changes,
        performedById: user.id,
      });
    }

    const catalogueWithRelations = await db.query.homeCatalogues.findFirst({
      where: eq(homeCatalogues.id, id),
      with: {
        listing: true,
        inspection: true,
        cataloguedBy: true,
      },
    });

    return NextResponse.json({
      data: catalogueWithRelations,
      message: "Catalogue updated successfully",
    });
  } catch (error) {
    console.error("Error updating catalogue:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation Error", message: "Invalid request body", details: (error as any).errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to update catalogue" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/catalogues/[id]
 * Approve/reject a catalogue
 */
export async function POST(
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

    // Check permissions - only team leads and super admins can approve/reject
    if (profile.role !== "super_admin" && profile.role !== "team_lead") {
      return NextResponse.json(
        { error: "Forbidden", message: "You don't have permission to approve/reject catalogues" },
        { status: 403 }
      );
    }

    // Get existing catalogue
    const existingCatalogue = await db.query.homeCatalogues.findFirst({
      where: eq(homeCatalogues.id, id),
    });

    if (!existingCatalogue) {
      return NextResponse.json(
        { error: "Not Found", message: "Catalogue not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = approveCatalogueSchema.parse(body);

    const updateData: Record<string, unknown> = {
      status: validatedData.status,
      updatedAt: new Date(),
    };

    if (validatedData.status === "approved") {
      updateData.approvedAt = new Date();
    }

    await db
      .update(homeCatalogues)
      .set(updateData)
      .where(eq(homeCatalogues.id, id));

    await logActivity({
      entityType: "home_catalogue",
      entityId: id,
      action: "update",
      changes: { 
        status: { old: existingCatalogue.status, new: validatedData.status },
        ...(validatedData.reason ? { reason: { old: null, new: validatedData.reason } } : {}),
      },
      performedById: user.id,
    });

    const catalogueWithRelations = await db.query.homeCatalogues.findFirst({
      where: eq(homeCatalogues.id, id),
      with: {
        listing: true,
        inspection: true,
        cataloguedBy: true,
      },
    });

    return NextResponse.json({
      data: catalogueWithRelations,
      message: `Catalogue ${validatedData.status} successfully`,
    });
  } catch (error) {
    console.error("Error approving/rejecting catalogue:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation Error", message: "Invalid request body", details: (error as any).errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to process catalogue approval" },
      { status: 500 }
    );
  }
}
