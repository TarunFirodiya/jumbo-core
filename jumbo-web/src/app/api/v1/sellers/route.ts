import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { createSellerSchema } from "@/lib/validations/seller";
import { eq, or, ilike, sql, and } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

/**
 * GET /api/v1/sellers
 * List sellers with filtering and pagination
 */
export const GET = withAuth(
  async (request: NextRequest) => {
    try {

      const searchParams = request.nextUrl.searchParams;
      const page = Number(searchParams.get("page")) || 1;
      const limit = Number(searchParams.get("limit")) || 20;
      const search = searchParams.get("search");

      const offset = (page - 1) * limit;

      // Build query conditions
      const conditions = [];
    
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

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Error fetching sellers:", error);
      throw error;
    }
  },
  "sellers:read"
);

/**
 * POST /api/v1/sellers
 * Create a new seller profile
 */
export const POST = withAuth<{ data: unknown; message: string } | { error: string; message: string }>(
  async (request: NextRequest, { user, profile }) => {
    try {

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
          role: "listing_agent",
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

      throw error;
    }
  },
  "sellers:create"
);

