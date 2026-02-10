import { NextRequest, NextResponse } from "next/server";
import { createLeadRequestSchema, leadQuerySchema } from "@/lib/validations";
import { withAuth } from "@/lib/api-helpers";
import * as leadService from "@/services/lead.service";

/**
 * GET /api/v1/leads
 * List leads with filtering and pagination
 */
export const GET = withAuth(
  async (request: NextRequest, { profile }) => {
    try {
      // Parse and validate query params
      const searchParams = Object.fromEntries(request.nextUrl.searchParams);
      const query = leadQuerySchema.parse(searchParams);

      // For non-admin users, only show their assigned leads
      let agentId = query.agentId;
      if (profile.role !== "super_admin" && profile.role !== "team_lead") {
        agentId = profile.id;
      }

      const result = await leadService.getLeads({
        page: query.page,
        limit: query.limit,
        status: query.status,
        source: query.source,
        agentId,
      });

      return {
        data: result.data,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error("Error fetching leads:", error);

      if (error instanceof Error && error.name === "ZodError") {
        throw new Error("Invalid query parameters");
      }

      throw error;
    }
  },
  "leads:read"
);

/**
 * Verify API key for external webhook access
 */
function verifyApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-api-key");
  const expectedKey = process.env.LEADS_API_SECRET;

  if (!expectedKey) {
    console.warn("LEADS_API_SECRET is not configured");
    return false;
  }

  return apiKey === expectedKey;
}

/**
 * POST /api/v1/leads
 * Create a new lead from external webhooks (e.g., Housing.com via Make.com)
 * Creates/finds a Contact, then creates the lead referencing it.
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Verify API key
    if (!verifyApiKey(request)) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Invalid or missing API key" },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log("Received lead creation request:", JSON.stringify(body, null, 2));

    const validatedData = createLeadRequestSchema.parse(body);
    console.log("Validation successful");

    // Step 2: Check for duplicate lead using externalId + source
    if (validatedData.externalId && validatedData.source) {
      const existingLead = await leadService.findLeadByExternalId(
        validatedData.externalId,
        validatedData.source
      );

      if (existingLead) {
        console.log("Duplicate lead detected, returning existing:", existingLead.id);
        return NextResponse.json(
          {
            data: existingLead,
            message: "Lead already exists",
            duplicate: true,
          },
          { status: 200 }
        );
      }
    }

    // Step 3: Create lead with contact
    const lead = await leadService.createLeadWithContact({
      contact: {
        fullName: validatedData.profile.fullName,
        phone: validatedData.profile.phone,
        email: validatedData.profile.email || undefined,
      },
      leadId: validatedData.leadId,
      source: validatedData.source,
      externalId: validatedData.externalId || undefined,
      sourceListingId: validatedData.sourceListingId || undefined,
      dropReason: validatedData.dropReason || undefined,
      locality: validatedData.locality || undefined,
      zone: validatedData.zone || undefined,
      pipeline: validatedData.pipeline,
      referredBy: validatedData.referredBy || undefined,
      testListingId: validatedData.testListingId || undefined,
      requirements: validatedData.requirements,
      preferences: validatedData.preferences,
    });

    console.log("Created new lead:", lead.id);

    // Fetch lead with relations
    const leadWithRelations = await leadService.getLeadById(lead.id);

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
      // @ts-expect-error - ZodError is known structure
      const details = error.flatten();
      return NextResponse.json(
        { error: "Validation Error", message: "Invalid request body", details },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error", message: error instanceof Error ? error.message : "Failed to create lead" },
      { status: 500 }
    );
  }
}
