import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { logActivity, computeChanges } from "@/lib/audit";
import { listingQuerySchema, createListingRequestSchema } from "@/lib/validations/listing";
import * as listingService from "@/services/listing.service";

/**
 * GET /api/v1/listings
 * List listings with filtering and pagination
 */
export const GET = withAuth(
  async (request: NextRequest) => {
    try {
      const searchParams = Object.fromEntries(request.nextUrl.searchParams);
      const query = listingQuerySchema.parse(searchParams);

      const result = await listingService.getListings({
        page: query.page,
        limit: query.limit,
        status: query.status,
        isVerified: query.isVerified,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        bhk: query.bhk,
        locality: query.locality,
        city: query.city,
      });

      return {
        data: result.data,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error("Error fetching listings:", error);
      throw new Error("Failed to fetch listings");
    }
  },
  "listings:read"
);

/**
 * POST /api/v1/listings
 * Create a new listing
 */
export const POST = withAuth(
  async (request: NextRequest, { user }) => {
    try {
      const body = await request.json();
      const validatedData = createListingRequestSchema.parse(body);

      const listing = await listingService.upsertListing({
        building: validatedData.building,
        unit: validatedData.unit,
        askingPrice: validatedData.askingPrice,
        listingAgentId: user.id,
        externalIds: validatedData.externalIds,
      });

      await logActivity({
        entityType: "listing",
        entityId: listing.id,
        action: "create",
        changes: computeChanges(null, listing),
        performedById: user.id,
      });

      return NextResponse.json(
        {
          data: listing,
          message: "Listing created successfully",
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("Error creating listing:", error);
      throw new Error("Failed to create listing");
    }
  },
  "listings:create"
);
