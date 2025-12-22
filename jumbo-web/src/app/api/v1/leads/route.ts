import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, profiles } from "@/lib/db/schema";
import { createLeadRequestSchema, leadQuerySchema } from "@/lib/validations";
import { eq, and, ilike, sql, desc } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/v1/leads
 * List leads with filtering and pagination
 */
export async function GET(request: NextRequest) {
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

    // Parse and validate query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = leadQuerySchema.parse(searchParams);

    // Build query conditions
    const conditions = [];

    if (query.status) {
      conditions.push(eq(leads.status, query.status));
    }

    if (query.source) {
      conditions.push(eq(leads.source, query.source));
    }

    if (query.agentId) {
      conditions.push(eq(leads.assignedAgentId, query.agentId));
    }

    // Soft delete filter
    conditions.push(sql`${leads.deletedAt} IS NULL`);

    // Execute query with pagination
    const offset = (query.page - 1) * query.limit;

    const [leadsData, countResult] = await Promise.all([
      db.query.leads.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: {
          profile: true,
          assignedAgent: true,
        },
        limit: query.limit,
        offset,
        orderBy: [desc(leads.createdAt)],
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(leads)
        .where(conditions.length > 0 ? and(...conditions) : undefined),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return NextResponse.json({
      data: leadsData,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    console.error("Error fetching leads:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation Error", message: "Invalid query parameters" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/leads
 * Create a new lead (internal or from webhooks)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createLeadRequestSchema.parse(body);

    // Check if profile already exists by phone
    let profile = await db.query.profiles.findFirst({
      where: eq(profiles.phone, validatedData.profile.phone),
    });

    // Create profile if not exists
    if (!profile) {
      const [newProfile] = await db
        .insert(profiles)
        .values({
          fullName: validatedData.profile.fullName,
          phone: validatedData.profile.phone,
          email: validatedData.profile.email,
          role: "buyer_agent", // Default role for leads/buyers
        })
        .returning();
      profile = newProfile;
    }

    // Create the lead
    const [newLead] = await db
      .insert(leads)
      .values({
        profileId: profile.id,
        source: validatedData.source,
        status: "new",
        requirementJson: validatedData.requirements,
      })
      .returning();

    // Fetch lead with relations
    const leadWithRelations = await db.query.leads.findFirst({
      where: eq(leads.id, newLead.id),
      with: {
        profile: true,
        assignedAgent: true,
      },
    });

    return NextResponse.json(
      {
        data: leadWithRelations,
        message: "Lead created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating lead:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation Error", message: "Invalid request body", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to create lead" },
      { status: 500 }
    );
  }
}

