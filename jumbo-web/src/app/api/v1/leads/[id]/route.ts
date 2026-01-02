import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { logActivity, computeChanges } from "@/lib/audit";
import { createLeadRequestSchema, updateLeadStatusSchema, assignLeadSchema } from "@/lib/validations/lead";
import { z } from "zod";
import * as leadService from "@/services/lead.service";

// Update lead schema (partial of create schema)
const updateLeadSchema = createLeadRequestSchema.partial().extend({
  profile: z.object({
    fullName: z.string().min(2).optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().nullable(),
  }).optional(),
});

/**
 * GET /api/v1/leads/[id]
 * Get a single lead by ID with all relations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify authentication
    const { user, profile } = await requireAuth();
    if (!user || !profile) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    const lead = await leadService.getLeadByIdWithRelations(id);

    if (!lead) {
      return NextResponse.json(
        { error: "Not Found", message: "Lead not found" },
        { status: 404 }
      );
    }

    // Check permissions - agents can only see their own leads unless they're admin/team_lead
    if (profile.role !== "super_admin" && profile.role !== "team_lead") {
      if (lead.assignedAgentId !== profile.id) {
        return NextResponse.json(
          { error: "Forbidden", message: "You don't have permission to view this lead" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ data: lead });
  } catch (error) {
    console.error("Error fetching lead:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to fetch lead" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/leads/[id]
 * Update a lead
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify authentication
    const { user, profile } = await requireAuth();
    if (!user || !profile) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    // Get existing lead
    const existingLead = await leadService.getLeadById(id);

    if (!existingLead) {
      return NextResponse.json(
        { error: "Not Found", message: "Lead not found" },
        { status: 404 }
      );
    }

    // Check permissions
    if (profile.role !== "super_admin" && profile.role !== "team_lead") {
      if (existingLead.assignedAgentId !== profile.id) {
        return NextResponse.json(
          { error: "Forbidden", message: "You don't have permission to update this lead" },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    
    // Handle different update types
    if (body.status) {
      const validatedData = updateLeadStatusSchema.parse(body);
      await leadService.updateLeadStatus(id, validatedData.status);
      
      await logActivity({
        entityType: "lead",
        entityId: id,
        action: "update",
        changes: { status: { old: existingLead.status, new: validatedData.status } },
        performedById: user.id,
      });

      const updatedLead = await leadService.getLeadById(id);

      return NextResponse.json({
        data: updatedLead,
        message: "Lead status updated successfully",
      });
    }

    if (body.agentId) {
      const validatedData = assignLeadSchema.parse(body);
      await leadService.assignLead(id, validatedData.agentId);
      
      await logActivity({
        entityType: "lead",
        entityId: id,
        action: "update",
        changes: { assignedAgentId: { old: existingLead.assignedAgentId, new: validatedData.agentId } },
        performedById: user.id,
      });

      const updatedLead = await leadService.getLeadById(id);

      return NextResponse.json({
        data: updatedLead,
        message: "Lead assigned successfully",
      });
    }

    // Full update
    const validatedData = updateLeadSchema.parse(body);
    const updateData: Record<string, unknown> = {};

    if (validatedData.profileId !== undefined) updateData.profileId = validatedData.profileId;
    if (validatedData.leadId !== undefined) updateData.leadId = validatedData.leadId;
    if (validatedData.source !== undefined) updateData.source = validatedData.source;
    if (validatedData.externalId !== undefined) updateData.externalId = validatedData.externalId;
    if (validatedData.secondaryPhone !== undefined) updateData.secondaryPhone = validatedData.secondaryPhone;
    if (validatedData.sourceListingId !== undefined) updateData.sourceListingId = validatedData.sourceListingId;
    if (validatedData.dropReason !== undefined) updateData.dropReason = validatedData.dropReason;
    if (validatedData.locality !== undefined) updateData.locality = validatedData.locality;
    if (validatedData.zone !== undefined) updateData.zone = validatedData.zone;
    if (validatedData.pipeline !== undefined) updateData.pipeline = validatedData.pipeline;
    if (validatedData.referredBy !== undefined) updateData.referredBy = validatedData.referredBy;
    if (validatedData.testListingId !== undefined) updateData.testListingId = validatedData.testListingId;
    if (validatedData.requirements !== undefined) updateData.requirementJson = validatedData.requirements;
    if (validatedData.preferences !== undefined) updateData.preferenceJson = validatedData.preferences;
    if (validatedData.assignedAgentId !== undefined) updateData.assignedAgentId = validatedData.assignedAgentId;

    const updatedLead = await leadService.updateLead(id, updateData);

    // Log the update
    const changes = computeChanges(existingLead as Record<string, unknown>, updatedLead as Record<string, unknown>);
    if (changes) {
      await logActivity({
        entityType: "lead",
        entityId: id,
        action: "update",
        changes,
        performedById: user.id,
      });
    }

    const leadWithRelations = await leadService.getLeadById(id);

    return NextResponse.json({
      data: leadWithRelations,
      message: "Lead updated successfully",
    });
  } catch (error) {
    console.error("Error updating lead:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation Error", message: "Invalid request body", details: (error as unknown as { errors: unknown[] }).errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to update lead" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/leads/[id]
 * Soft delete a lead
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify authentication
    const { user, profile } = await requireAuth();
    if (!user || !profile) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    // Check permissions - only super_admin can delete
    if (profile.role !== "super_admin") {
      return NextResponse.json(
        { error: "Forbidden", message: "Only super admins can delete leads" },
        { status: 403 }
      );
    }

    // Check if lead exists
    const existingLead = await leadService.getLeadById(id);

    if (!existingLead) {
      return NextResponse.json(
        { error: "Not Found", message: "Lead not found" },
        { status: 404 }
      );
    }

    // Soft delete using service
    await leadService.deleteLead(id);

    // Log the deletion
    await logActivity({
      entityType: "lead",
      entityId: id,
      action: "delete",
      changes: null,
      performedById: user.id,
    });

    return NextResponse.json({
      message: "Lead deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting lead:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to delete lead" },
      { status: 500 }
    );
  }
}
