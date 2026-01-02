import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { homeInspections, mediaItems } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { logActivity, computeChanges } from "@/lib/audit";
import { updateInspectionSchema, completeInspectionSchema } from "@/lib/validations/inspection";

/**
 * GET /api/v1/inspections/[id]
 * Get a single inspection by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const inspection = await db.query.homeInspections.findFirst({
      where: eq(homeInspections.id, id),
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
        inspectedBy: true,
        mediaItems: {
          where: sql`${mediaItems.deletedAt} IS NULL`,
          orderBy: [mediaItems.order, mediaItems.createdAt],
          with: {
            uploadedBy: true,
          },
        },
        catalogues: {
          with: {
            cataloguedBy: true,
          },
        },
      },
    });

    if (!inspection) {
      return NextResponse.json(
        { error: "Not Found", message: "Inspection not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: inspection });
  } catch (error) {
    console.error("Error fetching inspection:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to fetch inspection" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/inspections/[id]
 * Update an inspection
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

    // Get existing inspection
    const existingInspection = await db.query.homeInspections.findFirst({
      where: eq(homeInspections.id, id),
    });

    if (!existingInspection) {
      return NextResponse.json(
        { error: "Not Found", message: "Inspection not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateInspectionSchema.parse(body);
    
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

    const [updatedInspection] = await db
      .update(homeInspections)
      .set(updateData)
      .where(eq(homeInspections.id, id))
      .returning();

    // Log the update
    const changes = computeChanges(existingInspection as Record<string, unknown>, updatedInspection as Record<string, unknown>);
    if (changes) {
      await logActivity({
        entityType: "home_inspection",
        entityId: id,
        action: "update",
        changes,
        performedById: user.id,
      });
    }

    const inspectionWithRelations = await db.query.homeInspections.findFirst({
      where: eq(homeInspections.id, id),
      with: {
        listing: true,
        inspectedBy: true,
      },
    });

    return NextResponse.json({
      data: inspectionWithRelations,
      message: "Inspection updated successfully",
    });
  } catch (error) {
    console.error("Error updating inspection:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation Error", message: "Invalid request body", details: (error as any).errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to update inspection" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/inspections/[id]
 * Complete an inspection (with location capture)
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

    // Get existing inspection
    const existingInspection = await db.query.homeInspections.findFirst({
      where: eq(homeInspections.id, id),
    });

    if (!existingInspection) {
      return NextResponse.json(
        { error: "Not Found", message: "Inspection not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = completeInspectionSchema.parse(body);

    await db
      .update(homeInspections)
      .set({
        status: "completed",
        inspectionLatitude: validatedData.location.latitude,
        inspectionLongitude: validatedData.location.longitude,
        inspectionScore: validatedData.inspectionScore?.toString(),
        notes: validatedData.notes,
        knownIssues: validatedData.knownIssues,
        updatedAt: new Date(),
      })
      .where(eq(homeInspections.id, id));

    await logActivity({
      entityType: "home_inspection",
      entityId: id,
      action: "update",
      changes: { status: { old: existingInspection.status, new: "completed" } },
      performedById: user.id,
    });

    const inspectionWithRelations = await db.query.homeInspections.findFirst({
      where: eq(homeInspections.id, id),
      with: {
        listing: true,
        inspectedBy: true,
      },
    });

    return NextResponse.json({
      data: inspectionWithRelations,
      message: "Inspection completed successfully",
    });
  } catch (error) {
    console.error("Error completing inspection:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation Error", message: "Invalid request body", details: (error as any).errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to complete inspection" },
      { status: 500 }
    );
  }
}
