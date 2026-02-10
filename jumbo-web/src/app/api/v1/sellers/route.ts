import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contacts } from "@/lib/db/schema";
import { createSellerSchema } from "@/lib/validations/seller";
import { eq, or, ilike, sql, and } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

/**
 * GET /api/v1/sellers
 * List seller contacts with filtering and pagination.
 * Now queries the contacts table instead of profiles.
 */
export const GET = withAuth(
  async (request: NextRequest) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const page = Number(searchParams.get("page")) || 1;
      const limit = Number(searchParams.get("limit")) || 20;
      const search = searchParams.get("search");

      const offset = (page - 1) * limit;

      const conditions = [];

      if (search) {
        conditions.push(
          or(
            ilike(contacts.name, `%${search}%`),
            ilike(contacts.email, `%${search}%`),
            ilike(contacts.phone, `%${search}%`)
          )
        );
      }

      const [data, countResult] = await Promise.all([
        db.query.contacts.findMany({
          where: conditions.length > 0 ? and(...conditions) : undefined,
          limit: limit,
          offset: offset,
        }),
        db
          .select({ count: sql<number>`count(*)` })
          .from(contacts)
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
 * Create a new seller contact
 */
export const POST = withAuth<{ data: unknown; message: string } | { error: string; message: string }>(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const validatedData = createSellerSchema.parse(body);

      // Check if contact already exists
      const existingContact = await db.query.contacts.findFirst({
        where: eq(contacts.phone, validatedData.phone),
      });

      if (existingContact) {
        return NextResponse.json(
          { error: "Conflict", message: "A contact with this phone number already exists" },
          { status: 409 }
        );
      }

      // Create contact
      const [newContact] = await db
        .insert(contacts)
        .values({
          name: validatedData.fullName,
          phone: validatedData.phone,
          email: validatedData.email || null,
          type: "customer",
        })
        .returning();

      return NextResponse.json(
        {
          data: newContact,
          message: "Seller contact created successfully",
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
