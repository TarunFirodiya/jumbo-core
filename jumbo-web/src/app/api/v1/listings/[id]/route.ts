import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { logActivity, computeChanges } from "@/lib/audit";
import { updateListingSchema, updateListingStatusSchema } from "@/lib/validations/listing";
import * as listingService from "@/services/listing.service";

/**
 * GET /api/v1/listings/[id]
 * Get a single listing by ID with all relations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const listing = await listingService.getListingByIdWithRelations(id);

    if (!listing) {
      return NextResponse.json(
        { error: "Not Found", message: "Listing not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: listing });
  } catch (error) {
    console.error("Error fetching listing:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to fetch listing" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/listings/[id]
 * Update a listing
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

    // Get existing listing
    const existingListing = await listingService.getListingById(id);

    if (!existingListing) {
      return NextResponse.json(
        { error: "Not Found", message: "Listing not found" },
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
        { error: "Forbidden", message: "You don't have permission to update listings" },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Handle status update separately
    if (body.status) {
      const validatedData = updateListingStatusSchema.parse(body);
      await listingService.updateListingStatus(id, validatedData.status);
      
      await logActivity({
        entityType: "listing",
        entityId: id,
        action: "update",
        changes: { status: { old: existingListing.status, new: validatedData.status } },
        performedById: user.id,
      });

      const updatedListing = await listingService.getListingById(id);

      return NextResponse.json({
        data: updatedListing,
        message: "Listing status updated successfully",
      });
    }

    // Full update
    const validatedData = updateListingSchema.parse(body);
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Map all fields from validated data
    Object.keys(validatedData).forEach((key) => {
      if (validatedData[key as keyof typeof validatedData] !== undefined) {
        // Handle date strings
        if (key.includes("Date") || key.includes("At") || key.includes("Scheduled") || key.includes("Completed") || key.includes("Live")) {
          const value = validatedData[key as keyof typeof validatedData];
          updateData[key] = value ? new Date(value as string) : null;
        } else {
          updateData[key] = validatedData[key as keyof typeof validatedData];
        }
      }
    });

    const updatedListing = await listingService.updateListing(id, updateData);

    // Log the update
    const changes = computeChanges(existingListing as Record<string, unknown>, updatedListing as Record<string, unknown>);
    if (changes) {
      await logActivity({
        entityType: "listing",
        entityId: id,
        action: "update",
        changes,
        performedById: user.id,
      });
    }

    const listingWithRelations = await listingService.getListingById(id);

    return NextResponse.json({
      data: listingWithRelations,
      message: "Listing updated successfully",
    });
  } catch (error) {
    console.error("Error updating listing:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation Error", message: "Invalid request body", details: (error as unknown as { errors: unknown[] }).errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to update listing" },
      { status: 500 }
    );
  }
}
