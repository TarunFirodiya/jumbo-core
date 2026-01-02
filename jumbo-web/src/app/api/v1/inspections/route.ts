import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { logActivity, computeChanges } from "@/lib/audit";
import { createInspectionSchema, queryInspectionsSchema } from "@/lib/validations/inspection";
import * as inspectionService from "@/services/inspection.service";

/**
 * GET /api/v1/inspections
 * List inspections with filtering
 */
export const GET = withAuth<{ data: unknown[] } | { error: string; message: string }>(
  async (request: NextRequest, { user, profile }) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const query = queryInspectionsSchema.parse({
        listingId: searchParams.get("listingId") || undefined,
        status: searchParams.get("status") || undefined,
      });

      const result = await inspectionService.getInspections({
        listingId: query.listingId,
        status: query.status,
      });

      return NextResponse.json({ data: result.data });
    } catch (error) {
      console.error("Error fetching inspections:", error);
      return NextResponse.json(
        { error: "Internal Server Error", message: "Failed to fetch inspections" },
        { status: 500 }
      );
    }
  },
  "inspections:read"
);

/**
 * POST /api/v1/inspections
 * Create a new inspection
 */
export const POST = withAuth<{ data: unknown; message: string } | { error: string; message: string; details?: unknown }>(
  async (request: NextRequest, { user, profile }) => {
    try {
      const body = await request.json();
      const validatedData = createInspectionSchema.parse(body);

      const newInspection = await inspectionService.createInspection({
        listingId: validatedData.listingId || null,
        name: validatedData.name || null,
        location: validatedData.location || null,
        inspectedOn: validatedData.inspectedOn ? new Date(validatedData.inspectedOn) : null,
        inspectedById: validatedData.inspectedById,
        inspectionLatitude: validatedData.inspectionLatitude || null,
        inspectionLongitude: validatedData.inspectionLongitude || null,
        inspectionScore: validatedData.inspectionScore?.toString() || null,
        attempts: validatedData.attempts || 0,
        notes: validatedData.notes || null,
        cauveryChecklist: validatedData.cauveryChecklist || false,
        knownIssues: validatedData.knownIssues || null,
        imagesJsonUrl: validatedData.imagesJsonUrl || null,
        buildingJsonUrl: validatedData.buildingJsonUrl || null,
        videoLink: validatedData.videoLink || null,
        thumbnailUrl: validatedData.thumbnailUrl || null,
        status: validatedData.status || "pending",
      });

      await logActivity({
        entityType: "home_inspection",
        entityId: newInspection.id,
        action: "create",
        changes: computeChanges(null, newInspection),
        performedById: user.id,
      });

      return NextResponse.json(
        {
          data: newInspection,
          message: "Inspection created successfully",
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("Error creating inspection:", error);

      if (error instanceof Error && error.name === "ZodError") {
        return NextResponse.json(
          { error: "Validation Error", message: "Invalid request body", details: (error as unknown as { errors: unknown[] }).errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Internal Server Error", message: "Failed to create inspection" },
        { status: 500 }
      );
    }
  },
  "inspections:create"
);
