import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { logActivity, computeChanges } from "@/lib/audit";
import { createBuildingSchema } from "@/lib/validations/building";
import { z } from "zod";
import * as buildingService from "@/services/building.service";

// Query schema for buildings
const queryBuildingsSchema = z.object({
  search: z.string().optional(),
  city: z.string().optional(),
  locality: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * GET /api/v1/buildings
 * List buildings with filtering and pagination
 */
export const GET = withAuth(
  async (request: NextRequest) => {
    try {
      const searchParams = Object.fromEntries(request.nextUrl.searchParams);
      const query = queryBuildingsSchema.parse(searchParams);

      // If search is provided, use the search function
      if (query.search) {
        const data = await buildingService.searchBuildings(query.search, query.limit);
        return {
          data,
          pagination: {
            page: 1,
            limit: query.limit,
            total: data.length,
            totalPages: 1,
          },
        };
      }

      const result = await buildingService.getBuildings({
        page: query.page,
        limit: query.limit,
        city: query.city,
        locality: query.locality,
      });

      return {
        data: result.data,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error("Error fetching buildings:", error);
      throw error;
    }
  },
  "buildings:read"
);

/**
 * POST /api/v1/buildings
 * Create a new building
 */
export const POST = withAuth(
  async (request: NextRequest, { user }) => {
    try {
      const body = await request.json();
      const validatedData = createBuildingSchema.parse(body);

      const newBuilding = await buildingService.createBuilding({
        name: validatedData.name,
        locality: validatedData.locality || null,
        city: validatedData.city || null,
        nearestLandmark: validatedData.nearestLandmark || null,
        possessionDate: validatedData.possessionDate ? new Date(validatedData.possessionDate) : null,
        totalFloors: validatedData.totalFloors || null,
        totalUnits: validatedData.totalUnits || null,
        acres: validatedData.acres ? validatedData.acres.toString() : null,
        mapLink: validatedData.mapLink || null,
        latitude: validatedData.latitude || null,
        longitude: validatedData.longitude || null,
        amenitiesJson: validatedData.amenitiesJson || null,
        waterSource: validatedData.waterSource || null,
        khata: validatedData.khata || null,
        reraNumber: validatedData.reraNumber || null,
        jumboPriceEstimate: validatedData.jumboPriceEstimate ? validatedData.jumboPriceEstimate.toString() : null,
        underConstruction: validatedData.underConstruction ?? false,
        isModelFlatAvailable: validatedData.isModelFlatAvailable ?? false,
        googleRating: validatedData.googleRating ? validatedData.googleRating.toString() : null,
        gtmHousingName: validatedData.gtmHousingName || null,
        gtmHousingId: validatedData.gtmHousingId || null,
        mediaJson: validatedData.mediaJson || null,
        createdById: user.id,
      });

      await logActivity({
        entityType: "building",
        entityId: newBuilding.id,
        action: "create",
        changes: computeChanges(null, newBuilding),
        performedById: user.id,
      });

      return NextResponse.json(
        {
          data: newBuilding,
          message: "Building created successfully",
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("Error creating building:", error);
      if (error instanceof Error && error.name === "ZodError") {
        throw new Error("Invalid request body");
      }
      throw new Error("Failed to create building");
    }
  },
  "buildings:create"
);
