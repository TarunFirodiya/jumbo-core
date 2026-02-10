import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildings, units, listings } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { logActivity, computeChanges } from "@/lib/audit";
import { updateBuildingSchema } from "@/lib/validations/building";

/**
 * GET /api/v1/buildings/[id]
 * Get a single building by ID with all relations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const building = await db.query.buildings.findFirst({
      where: and(
        eq(buildings.id, id),
        sql`${buildings.deletedAt} IS NULL`
      ),
      with: {
        createdBy: true,
        units: {
          where: sql`${units.deletedAt} IS NULL`,
          with: {
            owner: true,
            listings: {
              where: sql`${listings.deletedAt} IS NULL`,
              limit: 10,
            },
          },
        },
        sellerLeads: {
          limit: 10,
        },
      },
    });

    if (!building) {
      return NextResponse.json(
        { error: "Not Found", message: "Building not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: building });
  } catch (error) {
    console.error("Error fetching building:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to fetch building" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/buildings/[id]
 * Update a building
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

    // Get existing building
    const existingBuilding = await db.query.buildings.findFirst({
      where: and(
        eq(buildings.id, id),
        sql`${buildings.deletedAt} IS NULL`
      ),
    });

    if (!existingBuilding) {
      return NextResponse.json(
        { error: "Not Found", message: "Building not found" },
        { status: 404 }
      );
    }

    // Check permissions - only listing agents, team leads, and super admins can update
    if (
      profile.role !== "super_admin" &&
      profile.role !== "team_lead" &&
      profile.role !== "listing_agent"
    ) {
      return NextResponse.json(
        { error: "Forbidden", message: "You don't have permission to update buildings" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateBuildingSchema.parse(body);
    
    const updateData: Record<string, unknown> = {};

    // Map all fields from validated data
    Object.keys(validatedData).forEach((key) => {
      if (validatedData[key as keyof typeof validatedData] !== undefined) {
        // Handle date strings
        if (key === "possessionDate") {
          const value = validatedData[key as keyof typeof validatedData];
          updateData[key] = value ? new Date(value as string) : null;
        } else {
          updateData[key] = validatedData[key as keyof typeof validatedData];
        }
      }
    });

    const [updatedBuilding] = await db
      .update(buildings)
      .set(updateData)
      .where(eq(buildings.id, id))
      .returning();

    // Log the update
    const changes = computeChanges(existingBuilding as Record<string, unknown>, updatedBuilding as Record<string, unknown>);
    if (changes) {
      await logActivity({
        entityType: "building",
        entityId: id,
        action: "update",
        changes,
        performedById: user.id,
      });
    }

    const buildingWithRelations = await db.query.buildings.findFirst({
      where: eq(buildings.id, id),
      with: {
        createdBy: true,
        units: {
          limit: 5,
        },
      },
    });

    return NextResponse.json({
      data: buildingWithRelations,
      message: "Building updated successfully",
    });
  } catch (error) {
    console.error("Error updating building:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation Error", message: "Invalid request body", details: (error as any).errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to update building" },
      { status: 500 }
    );
  }
}
