import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { logActivity, computeChanges } from "@/lib/audit";
import { createSellerLeadSchema } from "@/lib/validations/seller";
import { z } from "zod";
import * as sellerLeadService from "@/services/seller-lead.service";
import * as profileService from "@/services/profile.service";

/**
 * GET /api/v1/seller-leads
 * List seller leads with filtering and pagination
 */
export const GET = withAuth(
  async (request: NextRequest, { profile }) => {
    try {
      // Ensure profile exists
      if (!profile) {
        throw new Error("User profile not found");
      }

      const searchParams = request.nextUrl.searchParams;
      const page = Number(searchParams.get("page")) || 1;
      const limit = Number(searchParams.get("limit")) || 20;
      const status = searchParams.get("status");
      const source = searchParams.get("source");
      const assignedToId = searchParams.get("assignedToId");

      // Filter by assigned agent if user is not super_admin or team_lead
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
 * Create a new seller lead
 */
export const POST = withAuth<{ data: unknown; message: string } | { error: string; message: string; details?: unknown }>(
  async (request: NextRequest, { user, profile }) => {
    try {
      const body = await request.json();
      const validatedData = createSellerLeadSchema.parse(body);

      // Create or link profile if profileId provided
      let profileId = validatedData.profileId;
      if (!profileId) {
        // Check if profile exists by phone
        const existingProfile = await profileService.getProfileByPhone(validatedData.phone);
        
        if (existingProfile) {
          profileId = existingProfile.id;
        } else {
          // Create new profile
          const newProfile = await profileService.createProfile({
            fullName: validatedData.name,
            phone: validatedData.phone,
            email: validatedData.email || null,
          });
          profileId = newProfile.id;
        }
      }

      // Create the seller lead
      const newLead = await sellerLeadService.createSellerLead({
        profileId: profileId || null,
        name: validatedData.name,
        phone: validatedData.phone,
        email: validatedData.email || null,
        secondaryPhone: validatedData.secondaryPhone || null,
        status: validatedData.status,
        source: validatedData.source,
        sourceUrl: validatedData.sourceUrl || null,
        sourceListingUrl: validatedData.sourceListingUrl || null,
        dropReason: validatedData.dropReason || null,
        referredById: validatedData.referredById || null,
        buildingId: validatedData.buildingId || null,
        unitId: validatedData.unitId || null,
        assignedToId: validatedData.assignedToId || null,
        followUpDate: validatedData.followUpDate ? new Date(validatedData.followUpDate) : null,
        isNri: validatedData.isNri,
        createdById: user.id,
      });

      // Log the creation
      const changes = computeChanges(null, newLead);
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
