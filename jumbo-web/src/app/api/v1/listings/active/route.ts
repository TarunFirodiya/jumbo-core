import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { listings } from "@/lib/db/schema";
import { publicListingQuerySchema } from "@/lib/validations";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";

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

    // Build query conditions
    const conditions = [
      eq(listings.status, "active"),
      eq(listings.isVerified, true),
      sql`${listings.deletedAt} IS NULL`,
    ];

    if (query.minPrice) {
      conditions.push(gte(listings.askingPrice, query.minPrice.toString()));
    }

    if (query.maxPrice) {
      conditions.push(lte(listings.askingPrice, query.maxPrice.toString()));
    }

    // Execute query with pagination
    const offset = (query.page - 1) * query.limit;

    const [listingsData, countResult] = await Promise.all([
      db.query.listings.findMany({
        where: and(...conditions),
        with: {
          unit: {
            with: {
              building: true,
            },
          },
        },
        limit: query.limit,
        offset,
        orderBy: [desc(listings.createdAt)],
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(listings)
        .where(and(...conditions)),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    // Transform data for public consumption (hide sensitive fields)
    const publicListings = listingsData.map((listing) => ({
      id: listing.id,
      status: listing.status,
      askingPrice: listing.askingPrice,
      isVerified: listing.isVerified,
      unit: listing.unit
        ? {
            bhk: listing.unit.bhk,
            floorNumber: listing.unit.floorNumber,
            carpetArea: listing.unit.carpetArea,
            building: listing.unit.building
              ? {
                  name: listing.unit.building.name,
                  locality: listing.unit.building.locality,
                  city: listing.unit.building.city,
                  amenities: listing.unit.building.amenitiesJson,
                }
              : null,
          }
        : null,
    }));

    return NextResponse.json({
      data: publicListings,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
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

