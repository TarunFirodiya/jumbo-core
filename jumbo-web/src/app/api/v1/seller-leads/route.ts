import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sellerLeads, profiles, buildings, units } from "@/lib/db/schema";
import { eq, and, ilike, or, sql, desc } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { logActivity, computeChanges } from "@/lib/audit";
import { z } from "zod";

// Validation schema for creating a seller lead
const createSellerLeadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Phone is required"),
  email: z.string().email().optional().or(z.literal("")),
  status: z.enum(["new", "proposal_sent", "proposal_accepted", "dropped"]).default("new"),
  source: z.enum(["website", "99acres", "magicbricks", "housing", "nobroker", "mygate", "referral"]),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  referredById: z.string().uuid().optional().nullable(),
  buildingId: z.string().uuid().optional().nullable(),
  unitId: z.string().uuid().optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable(),
  followUpDate: z.string().datetime().optional().nullable(),
  isNri: z.boolean().default(false),
  notes: z.string().optional(),
});

// Validation schema for updating a seller lead
const updateSellerLeadSchema = createSellerLeadSchema.partial();

/**
 * GET /api/v1/seller-leads
 * List seller leads with filtering and pagination
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
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const assignedToId = searchParams.get("assignedToId");

    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions = [sql`${sellerLeads.deletedAt} IS NULL`];

    if (search) {
      conditions.push(
        or(
          ilike(sellerLeads.name, `%${search}%`),
          ilike(sellerLeads.email, `%${search}%`),
          ilike(sellerLeads.phone, `%${search}%`)
        )!
      );
    }

    if (status) {
      conditions.push(eq(sellerLeads.status, status as any));
    }

    if (source) {
      conditions.push(eq(sellerLeads.source, source as any));
    }

    if (assignedToId) {
      conditions.push(eq(sellerLeads.assignedToId, assignedToId));
    }

    const [data, countResult] = await Promise.all([
      db.query.sellerLeads.findMany({
        where: and(...conditions),
        with: {
          building: true,
          unit: true,
          assignedTo: true,
          referredBy: true,
        },
        limit: limit,
        offset: offset,
        orderBy: [desc(sellerLeads.createdAt)],
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(sellerLeads)
        .where(and(...conditions)),
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
    console.error("Error fetching seller leads:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to fetch seller leads",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/seller-leads
 * Create a new seller lead
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // if (!user) {
    //   return NextResponse.json(
    //     { error: "Unauthorized", message: "Authentication required" },
    //     { status: 401 }
    //   );
    // }

    const body = await request.json();
    const validatedData = createSellerLeadSchema.parse(body);

    // Create the seller lead
    const [newLead] = await db
      .insert(sellerLeads)
      .values({
        name: validatedData.name,
        phone: validatedData.phone,
        email: validatedData.email || null,
        status: validatedData.status,
        source: validatedData.source,
        sourceUrl: validatedData.sourceUrl || null,
        referredById: validatedData.referredById || null,
        buildingId: validatedData.buildingId || null,
        unitId: validatedData.unitId || null,
        assignedToId: validatedData.assignedToId || null,
        followUpDate: validatedData.followUpDate ? new Date(validatedData.followUpDate) : null,
        isNri: validatedData.isNri,
        notes: validatedData.notes || null,
        createdById: user?.id || null,
      })
      .returning();

    // Log the creation
    const changes = computeChanges(null, newLead);
    await logActivity({
      entityType: "seller_lead",
      entityId: newLead.id,
      action: "create",
      changes,
      performedById: user?.id || null,
    });

    return NextResponse.json(
      {
        data: newLead,
        message: "Seller lead created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating seller lead:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation Error", message: "Invalid request body", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to create seller lead" },
      { status: 500 }
    );
  }
}

