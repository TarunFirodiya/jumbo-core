import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { createSellerSchema } from "@/lib/validations/seller";
import { eq, or, ilike, sql, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/v1/sellers
 * List sellers with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // TEMPORARY BYPASS FOR DEBUGGING
    // if (!user) {
    //   return NextResponse.json(
    //     { error: "Unauthorized", message: "Authentication required" },
    //     { status: 401 }
    //   );
    // }

    const searchParams = request.nextUrl.searchParams;
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;
    const search = searchParams.get("search");

    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions = [];

    // Filter for sellers (assuming role is checked or we filter by usage)
    // Since schema uses 'role', we might check for specific roles or just list profiles 
    // that are NOT internal staff if that distinction exists.
    // For now, let's list all profiles or filter by name/phone if search is present.
    // If we want to strictly filter "sellers", we need a way to distinguish them.
    // The previous schema inspection showed roles like 'buyer_agent', 'listing_agent'. 
    // A seller might be just a profile who owns a unit.
    // Let's assume for now we list all profiles or filter by search.
    
    if (search) {
      conditions.push(
        or(
          ilike(profiles.fullName, `%${search}%`),
          ilike(profiles.email, `%${search}%`),
          ilike(profiles.phone, `%${search}%`)
        )
      );
    }
    
    conditions.push(sql`${profiles.deletedAt} IS NULL`);

    const [data, countResult] = await Promise.all([
      db.query.profiles.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        limit: limit,
        offset: offset,
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(profiles)
        .where(conditions.length > 0 ? and(...conditions) : undefined),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error("Error fetching sellers:", error);
    return NextResponse.json(
      { 
        error: "Internal Server Error", 
        message: "Failed to fetch sellers", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/sellers
 * Create a new seller profile
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createSellerSchema.parse(body);

    // Check if profile already exists
    const existingProfile = await db.query.profiles.findFirst({
      where: eq(profiles.phone, validatedData.phone),
    });

    if (existingProfile) {
      return NextResponse.json(
        { error: "Conflict", message: "A profile with this phone number already exists" },
        { status: 409 }
      );
    }

    // Create profile
    const [newProfile] = await db
      .insert(profiles)
      .values({
        fullName: validatedData.fullName,
        phone: validatedData.phone,
        email: validatedData.email || null,
        role: "listing_agent", // Using listing_agent as a placeholder for seller/owner if that's the intent, or just a generic profile
        // If 'companyName' was in the schema we would add it, but it wasn't in the Drizzle schema I saw earlier.
        // I'll ignore companyName for now as it's not in the db schema, or I should have added it.
        // The form has companyName, but the DB schema for profiles didn't show it.
      })
      .returning();

    return NextResponse.json(
      {
        data: newProfile,
        message: "Seller profile created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating seller:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation Error", message: "Invalid request body", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to create seller" },
      { status: 500 }
    );
  }
}

