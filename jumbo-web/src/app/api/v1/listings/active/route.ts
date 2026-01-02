import { NextRequest, NextResponse } from "next/server";
import { publicListingQuerySchema } from "@/lib/validations";
import * as listingService from "@/services/listing.service";

/**
 * GET /api/v1/listings/active
 * Public API endpoint for jumbohomes.in
 * Returns only verified, active listings with watermarked media
 */
export async function GET(request: NextRequest) {
  try {
    // Parse and validate query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = publicListingQuerySchema.parse(searchParams);

    const result = await listingService.getActiveListings({
      page: query.page,
      limit: query.limit,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
    });

    // Transform data for public consumption (hide sensitive fields)
    const publicListings = result.data.map((listing) => {
      const listingWithUnit = listing as typeof listing & { unit?: { bhk: number; floorNumber: number | null; carpetArea: number | null; building?: { name: string; locality: string | null; city: string | null; amenitiesJson: unknown } | null } | null };
      const unit = listingWithUnit.unit;
      return {
        id: listing.id,
        status: listing.status,
        askingPrice: listing.askingPrice,
        isVerified: listing.isVerified,
        unit: unit
          ? {
              bhk: unit.bhk,
              floorNumber: unit.floorNumber,
              carpetArea: unit.carpetArea,
              building: unit.building
                ? {
                    name: unit.building.name,
                    locality: unit.building.locality,
                    city: unit.building.city,
                    amenities: unit.building.amenitiesJson,
                  }
                : null,
            }
          : null,
      };
    });

    return NextResponse.json({
      data: publicListings,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error fetching active listings:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation Error", message: "Invalid query parameters" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to fetch listings" },
      { status: 500 }
    );
  }
}
