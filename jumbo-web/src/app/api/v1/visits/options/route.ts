import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, profiles, listings, units, buildings } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    // Fetch Buyers (Leads)
    const buyers = await db
      .select({
        id: leads.id,
        status: leads.status,
        name: profiles.fullName,
        phone: profiles.phone,
      })
      .from(leads)
      .leftJoin(profiles, eq(leads.profileId, profiles.id))
      .orderBy(desc(leads.createdAt));

    // Fetch Listings
    const activeListings = await db
      .select({
        id: listings.id,
        status: listings.status,
        price: listings.askingPrice,
        unitNumber: units.unitNumber,
        bhk: units.bhk,
        floor: units.floorNumber,
        size: units.carpetArea,
        buildingName: buildings.name,
        locality: buildings.locality,
      })
      .from(listings)
      .leftJoin(units, eq(listings.unitId, units.id))
      .leftJoin(buildings, eq(units.buildingId, buildings.id))
      .where(eq(listings.status, "active"))
      .orderBy(desc(listings.createdAt));

    return NextResponse.json({
      data: {
        buyers,
        listings: activeListings,
      },
    });
  } catch (error) {
    console.error("Error fetching visit options:", error);
    return NextResponse.json(
      { error: "Failed to fetch options" },
      { status: 500 }
    );
  }
}

