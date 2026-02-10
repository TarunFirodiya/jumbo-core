import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { logActivity, computeChanges } from "@/lib/audit";
import { createSellerLeadSchema } from "@/lib/validations/seller";
import { z } from "zod";
import * as sellerLeadService from "@/services/seller-lead.service";

/**
 * GET /api/v1/seller-leads
 * List seller leads with filtering and pagination
 */
export const GET = withAuth(
  async (request: NextRequest, { profile }) => {
    try {
      if (!profile) {
        throw new Error("User profile not found");
      }

      const searchParams = request.nextUrl.searchParams;
      const page = Number(searchParams.get("page")) || 1;
      const limit = Number(searchParams.get("limit")) || 20;
      const status = searchParams.get("status");
      const source = searchParams.get("source");
      const assignedToId = searchParams.get("assignedToId");

      let effectiveAssignedToId = assignedToId;
      if (profile.role !== "super_admin" && profile.role !== "team_lead") {
        effectiveAssignedToId = profile.id;
      }

      const result = await sellerLeadService.getSellerLeads({
        page,
        limit,
        status: status || undefined,
        source: source || undefined,
        assignedToId: effectiveAssignedToId || undefined,
      });

      return {
        data: result.data,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error("Error fetching seller leads:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`Failed to fetch seller leads: ${errorMessage}`);
    }
  },
  "seller_leads:read"
);

/**
 * POST /api/v1/seller-leads
 * Create a new seller lead.
 * Creates/finds a Contact by phone, then creates the seller lead referencing it.
 */
export const POST = withAuth<{ data: unknown; message: string } | { error: string; message: string; details?: unknown }>(
  async (request: NextRequest, { user }) => {
    try {
      const body = await request.json();
      const validatedData = createSellerLeadSchema.parse(body);

      // Create seller lead with contact
      const newLead = await sellerLeadService.createSellerLeadWithContact({
        contact: {
          name: validatedData.name,
          phone: validatedData.phone,
          email: validatedData.email || undefined,
        },
        source: validatedData.source,
        status: validatedData.status,
        sourceUrl: validatedData.sourceUrl || undefined,
        sourceListingUrl: validatedData.sourceListingUrl || undefined,
        dropReason: validatedData.dropReason || undefined,
        referredById: validatedData.referredById || undefined,
        buildingId: validatedData.buildingId || undefined,
        unitId: validatedData.unitId || undefined,
        assignedToId: validatedData.assignedToId || undefined,
        followUpDate: validatedData.followUpDate ? new Date(validatedData.followUpDate) : undefined,
        isNri: validatedData.isNri,
        createdById: user.id,
      });

      // Log the creation
      const changes = computeChanges(null, newLead as unknown as Record<string, unknown>);
      await logActivity({
        entityType: "seller_lead",
        entityId: newLead.id,
        action: "create",
        changes,
        performedById: user.id,
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
          { error: "Validation Error", message: "Invalid request body", details: (error as unknown as { errors: unknown[] }).errors },
          { status: 400 }
        );
      }

      throw error;
    }
  },
  "seller_leads:create"
);
