import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { logActivity, computeChanges } from "@/lib/audit";
import { createCatalogueSchema, queryCataloguesSchema } from "@/lib/validations/catalogue";
import * as catalogueService from "@/services/catalogue.service";

/**
 * GET /api/v1/catalogues
 * List catalogues with filtering
 */
export const GET = withAuth<{ data: unknown[] } | { error: string; message: string }>(
  async (request: NextRequest, { user, profile }) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const query = queryCataloguesSchema.parse({
        listingId: searchParams.get("listingId") || undefined,
        inspectionId: searchParams.get("inspectionId") || undefined,
        status: searchParams.get("status") || undefined,
      });

      const result = await catalogueService.getCatalogues({
        listingId: query.listingId,
        status: query.status,
      });

      return NextResponse.json({ data: result.data });
    } catch (error) {
      console.error("Error fetching catalogues:", error);
      return NextResponse.json(
        { error: "Internal Server Error", message: "Failed to fetch catalogues" },
        { status: 500 }
      );
    }
  },
  "catalogues:read"
);

/**
 * POST /api/v1/catalogues
 * Create a new catalogue
 */
export const POST = withAuth<{ data: unknown; message: string } | { error: string; message: string; details?: unknown }>(
  async (request: NextRequest, { user, profile }) => {
    try {
      const body = await request.json();
      const validatedData = createCatalogueSchema.parse(body);

      const newCatalogue = await catalogueService.createCatalogue({
        listingId: validatedData.listingId,
        inspectionId: validatedData.inspectionId || null,
        name: validatedData.name || null,
        inspectedOn: validatedData.inspectedOn ? new Date(validatedData.inspectedOn) : null,
        cataloguedById: validatedData.cataloguedById,
        cataloguingScore: validatedData.cataloguingScore?.toString() || null,
        cauveryChecklist: validatedData.cauveryChecklist || false,
        thumbnailUrl: validatedData.thumbnailUrl || null,
        floorPlanUrl: validatedData.floorPlanUrl || null,
        buildingJsonUrl: validatedData.buildingJsonUrl || null,
        listingJsonUrl: validatedData.listingJsonUrl || null,
        video30SecUrl: validatedData.video30SecUrl || null,
        status: validatedData.status || "pending",
      });

      await logActivity({
        entityType: "home_catalogue",
        entityId: newCatalogue.id,
        action: "create",
        changes: computeChanges(null, newCatalogue),
        performedById: user.id,
      });

      return NextResponse.json(
        {
          data: newCatalogue,
          message: "Catalogue created successfully",
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("Error creating catalogue:", error);

      if (error instanceof Error && error.name === "ZodError") {
        return NextResponse.json(
          { error: "Validation Error", message: "Invalid request body", details: (error as unknown as { errors: unknown[] }).errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Internal Server Error", message: "Failed to create catalogue" },
        { status: 500 }
      );
    }
  },
  "catalogues:create"
);
