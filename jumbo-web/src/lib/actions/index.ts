"use server";

import { db } from "@/lib/db";
import {
  buildings,
  units,
  listings,
  leads,
  profiles,
  visits,
  visitTours,
  communications,
  creditLedger,
  creditRules,
  sellerLeads,
} from "@/lib/db/schema";
import { eq, and, sql, desc, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  createLeadRequestSchema,
  updateLeadStatusSchema,
  assignLeadSchema,
  createListingRequestSchema,
  updateListingStatusSchema,
  createTourRequestSchema,
  createVisitRequestSchema,
  verifyVisitOTPSchema,
  updateVisitStatusSchema,
  updateVisitSchema,
  createCommunicationSchema,
  createSellerSchema,
  createSellerLeadSchema,
} from "@/lib/validations";
import { z } from "zod";
import { logActivity, computeChanges } from "@/lib/audit";
import type {
  CreateLeadRequest,
  UpdateLeadStatus,
  AssignLead,
  CreateListingRequest,
  UpdateListingStatus,
  CreateTourRequest,
  CreateVisitRequest,
  VerifyVisitOTP,
  UpdateVisitStatus,
  UpdateVisit,
  CreateCommunication,
} from "@/lib/validations";

// ============================================
// TYPES & HELPERS
// ============================================

type ActionResult<T = unknown> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string; message: string; details?: unknown };

// ============================================
// PHASE 1: INVENTORY MANAGEMENT
// ============================================

/**
 * Create a new building
 */
export async function createBuilding(
  data: {
    name: string;
    locality?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    amenities?: Record<string, boolean>;
    waterSource?: string;
  }
): Promise<ActionResult<{ id: string }>> {
  try {
    const [building] = await db
      .insert(buildings)
      .values({
        name: data.name,
        locality: data.locality,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        amenitiesJson: data.amenities,
        waterSource: data.waterSource,
      })
      .returning({ id: buildings.id });

    await logActivity({
      entityType: "building",
      entityId: building.id,
      action: "create",
      changes: computeChanges(null, data),
    });

    revalidatePath("/listings");
    return {
      success: true,
      data: { id: building.id },
      message: "Building created successfully",
    };
  } catch (error) {
    console.error("Error creating building:", error);
    return {
      success: false,
      error: "BUILDING_CREATE_FAILED",
      message: "Failed to create building",
      details: error,
    };
  }
}

/**
 * Create a new unit
 */
export async function createUnit(
  data: {
    buildingId: string;
    unitNumber?: string;
    bhk: number;
    floorNumber?: number;
    carpetArea?: number;
    ownerId?: string;
  }
): Promise<ActionResult<{ id: string }>> {
  try {
    const [unit] = await db
      .insert(units)
      .values({
        buildingId: data.buildingId,
        unitNumber: data.unitNumber,
        bhk: data.bhk,
        floorNumber: data.floorNumber,
        carpetArea: data.carpetArea,
        ownerId: data.ownerId,
      })
      .returning({ id: units.id });

    await logActivity({
      entityType: "unit",
      entityId: unit.id,
      action: "create",
      changes: computeChanges(null, data),
    });

    revalidatePath("/listings");
    return {
      success: true,
      data: { id: unit.id },
      message: "Unit created successfully",
    };
  } catch (error) {
    console.error("Error creating unit:", error);
    return {
      success: false,
      error: "UNIT_CREATE_FAILED",
      message: "Failed to create unit",
      details: error,
    };
  }
}

/**
 * Upsert listing (creates Building → Unit → Listing in a transaction)
 * This is the main action for the listing wizard
 */
export async function upsertListing(
  data: CreateListingRequest & { listingAgentId?: string; description?: string; images?: string[]; amenities?: string[] }
): Promise<ActionResult<{ id: string }>> {
  try {
    let buildingId: string;
    let unitId: string;

    // Use transaction for atomicity
    const result = await db.transaction(async (tx) => {
      // Step 1: Handle building (create or use existing)
      if ("id" in data.building) {
        buildingId = data.building.id;
      } else {
        const [building] = await tx
          .insert(buildings)
          .values({
            name: data.building.name,
            locality: data.building.locality,
            city: data.building.city,
            latitude: data.building.latitude,
            longitude: data.building.longitude,
            amenitiesJson: data.building.amenities,
            waterSource: data.building.waterSource,
          })
          .returning({ id: buildings.id });
        buildingId = building.id;
      }

      // Step 2: Create unit
      const [unit] = await tx
        .insert(units)
        .values({
          buildingId,
          unitNumber: data.unit.unitNumber,
          bhk: data.unit.bhk,
          floorNumber: data.unit.floorNumber,
          carpetArea: data.unit.carpetArea,
          ownerId: data.unit.ownerId,
        })
        .returning({ id: units.id });
      unitId = unit.id;

      // Step 3: Create listing
      const [listing] = await tx
        .insert(listings)
        .values({
          unitId,
          listingAgentId: data.listingAgentId,
          askingPrice: data.askingPrice.toString(),
          description: data.description,
          images: data.images || [],
          amenitiesJson: data.amenities || [],
          externalIds: data.externalIds,
          status: "draft",
        })
        .returning({ id: listings.id });

      return listing.id;
    });

    await logActivity({
      entityType: "listing",
      entityId: result,
      action: "create",
      changes: computeChanges(null, data),
    });

    revalidatePath("/listings");
    revalidatePath(`/listings/${result}`);
    return {
      success: true,
      data: { id: result },
      message: "Listing created successfully",
    };
  } catch (error) {
    console.error("Error upserting listing:", error);
    return {
      success: false,
      error: "LISTING_UPSERT_FAILED",
      message: "Failed to create listing",
      details: error,
    };
  }
}

/**
 * Update listing status
 */
export async function updateListingStatus(
  id: string,
  data: UpdateListingStatus
): Promise<ActionResult> {
  try {
    const validatedData = updateListingStatusSchema.parse(data);

    // Get current listing for audit
    const currentListing = await db.query.listings.findFirst({
      where: eq(listings.id, id),
    });

    if (!currentListing) {
      return {
        success: false,
        error: "LISTING_NOT_FOUND",
        message: "Listing not found",
      };
    }

    await db
      .update(listings)
      .set({
        status: validatedData.status,
        updatedAt: new Date(),
        publishedAt: validatedData.status === "active" ? new Date() : currentListing.publishedAt,
      })
      .where(eq(listings.id, id));

    await logActivity({
      entityType: "listing",
      entityId: id,
      action: "update",
      changes: { status: { old: currentListing.status, new: validatedData.status } },
    });

    revalidatePath("/listings");
    revalidatePath(`/listings/${id}`);
    return {
      success: true,
      message: "Listing status updated successfully",
    };
  } catch (error) {
    console.error("Error updating listing status:", error);
    return {
      success: false,
      error: "LISTING_UPDATE_FAILED",
      message: "Failed to update listing status",
      details: error,
    };
  }
}

// ============================================
// PHASE 2: CRM & LEAD MANAGEMENT
// ============================================

/**
 * Create a new lead (manual entry)
 */
export async function createLead(
  data: CreateLeadRequest
): Promise<ActionResult<{ id: string }>> {
  try {
    const validatedData = createLeadRequestSchema.parse(data);

    // Check if profile exists by phone
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
          email: validatedData.profile.email || null,
        })
        .returning({ id: profiles.id });
      profile = await db.query.profiles.findFirst({
        where: eq(profiles.id, newProfile.id),
      });
    }

    if (!profile) {
      return {
        success: false,
        error: "PROFILE_CREATE_FAILED",
        message: "Failed to create or find profile",
      };
    }

    // Create lead
    const [lead] = await db
      .insert(leads)
      .values({
        profileId: profile.id,
        source: validatedData.source,
        externalId: validatedData.externalId,
        requirementJson: validatedData.requirements || null,
        status: "new",
      })
      .returning({ id: leads.id });

    // Auto-assign using round-robin if no agent specified
    if (!validatedData.requirements) {
      await assignLeadRoundRobin(lead.id);
    }

    await logActivity({
      entityType: "lead",
      entityId: lead.id,
      action: "create",
      changes: computeChanges(null, validatedData),
    });

    revalidatePath("/buyers");
    revalidatePath(`/buyers/${lead.id}`);
    return {
      success: true,
      data: { id: lead.id },
      message: "Lead created successfully",
    };
  } catch (error) {
    console.error("Error creating lead:", error);
    return {
      success: false,
      error: "LEAD_CREATE_FAILED",
      message: "Failed to create lead",
      details: error,
    };
  }
}

/**
 * Round-robin lead assignment helper
 * Assigns lead to next available buyer_agent based on territory
 */
async function assignLeadRoundRobin(leadId: string): Promise<string | null> {
  try {
    // Get all active buyer agents
    const agents = await db.query.profiles.findMany({
      where: and(
        eq(profiles.role, "buyer_agent"),
        isNull(profiles.deletedAt)
      ),
      orderBy: [desc(profiles.createdAt)],
    });

    if (agents.length === 0) {
      return null;
    }

    // Get the agent with the least assigned leads
    const agentLeadCounts = await Promise.all(
      agents.map(async (agent) => {
        const count = await db
          .select({ count: sql<number>`count(*)` })
          .from(leads)
          .where(
            and(
              eq(leads.assignedAgentId, agent.id),
              isNull(leads.deletedAt)
            )
          );
        return {
          agentId: agent.id,
          count: Number(count[0]?.count ?? 0),
        };
      })
    );

    // Sort by count and pick the one with least leads
    agentLeadCounts.sort((a, b) => a.count - b.count);
    const assignedAgentId = agentLeadCounts[0]?.agentId;

    if (assignedAgentId) {
      await db
        .update(leads)
        .set({ assignedAgentId })
        .where(eq(leads.id, leadId));
    }

    return assignedAgentId || null;
  } catch (error) {
    console.error("Error in round-robin assignment:", error);
    return null;
  }
}

/**
 * Assign lead to an agent (manual assignment)
 */
export async function assignLead(
  leadId: string,
  data: AssignLead
): Promise<ActionResult> {
  try {
    const validatedData = assignLeadSchema.parse(data);

    const currentLead = await db.query.leads.findFirst({
      where: eq(leads.id, leadId),
    });

    if (!currentLead) {
      return {
        success: false,
        error: "LEAD_NOT_FOUND",
        message: "Lead not found",
      };
    }

    await db
      .update(leads)
      .set({ assignedAgentId: validatedData.agentId })
      .where(eq(leads.id, leadId));

    await logActivity({
      entityType: "lead",
      entityId: leadId,
      action: "update",
      changes: { assignedAgentId: { old: currentLead.assignedAgentId, new: validatedData.agentId } },
    });

    revalidatePath("/buyers");
    revalidatePath(`/buyers/${leadId}`);
    return {
      success: true,
      message: "Lead assigned successfully",
    };
  } catch (error) {
    console.error("Error assigning lead:", error);
    return {
      success: false,
      error: "LEAD_ASSIGN_FAILED",
      message: "Failed to assign lead",
      details: error,
    };
  }
}

/**
 * Update lead status
 */
export async function updateLeadStatus(
  id: string,
  data: UpdateLeadStatus
): Promise<ActionResult> {
  try {
    const validatedData = updateLeadStatusSchema.parse(data);

    const currentLead = await db.query.leads.findFirst({
      where: eq(leads.id, id),
    });

    if (!currentLead) {
      return {
        success: false,
        error: "LEAD_NOT_FOUND",
        message: "Lead not found",
      };
    }

    await db
      .update(leads)
      .set({
        status: validatedData.status,
        lastContactedAt: validatedData.status === "contacted" ? new Date() : currentLead.lastContactedAt,
      })
      .where(eq(leads.id, id));

    await logActivity({
      entityType: "lead",
      entityId: id,
      action: "update",
      changes: { status: { old: currentLead.status, new: validatedData.status } },
    });

    revalidatePath("/buyers");
    revalidatePath(`/buyers/${id}`);
    return {
      success: true,
      message: "Lead status updated successfully",
    };
  } catch (error) {
    console.error("Error updating lead status:", error);
    return {
      success: false,
      error: "LEAD_UPDATE_FAILED",
      message: "Failed to update lead status",
      details: error,
    };
  }
}

/**
 * Log a communication (WhatsApp, Call, etc.)
 */
export async function logCommunication(
  data: CreateCommunication
): Promise<ActionResult<{ id: string }>> {
  try {
    const validatedData = createCommunicationSchema.parse(data);

    const [communication] = await db
      .insert(communications)
      .values({
        leadId: validatedData.leadId || null,
        sellerLeadId: validatedData.sellerLeadId || null,
        agentId: validatedData.agentId,
        channel: validatedData.channel,
        direction: validatedData.direction,
        content: validatedData.content,
        recordingUrl: validatedData.recordingUrl,
        metadata: validatedData.metadata || null,
      })
      .returning({ id: communications.id });

    // Update lastContactedAt on lead if applicable
    if (validatedData.leadId) {
      await db
        .update(leads)
        .set({ lastContactedAt: new Date() })
        .where(eq(leads.id, validatedData.leadId));
    }

    revalidatePath("/buyers");
    if (validatedData.leadId) {
      revalidatePath(`/buyers/${validatedData.leadId}`);
    }
    return {
      success: true,
      data: { id: communication.id },
      message: "Communication logged successfully",
    };
  } catch (error) {
    console.error("Error logging communication:", error);
    return {
      success: false,
      error: "COMMUNICATION_LOG_FAILED",
      message: "Failed to log communication",
      details: error,
    };
  }
}

/**
 * Update buyer (lead + profile) - Refactored with type safety
 */
export async function updateBuyer(
  id: string,
  data: {
    status?: string;
    budget_min?: number;
    budget_max?: number;
    bhk?: number[];
    localities?: string[];
    name?: string;
    email?: string;
    mobile?: string;
    assignedAgentId?: string;
  }
): Promise<ActionResult> {
  try {
    const lead = await db.query.leads.findFirst({
      where: eq(leads.id, id),
      with: { profile: true },
    });

    if (!lead) {
      return {
        success: false,
        error: "LEAD_NOT_FOUND",
        message: "Buyer not found",
      };
    }

    // Update lead
    const leadUpdates: Partial<typeof leads.$inferInsert> = {};
    if (data.status) leadUpdates.status = data.status;
    if (data.assignedAgentId) leadUpdates.assignedAgentId = data.assignedAgentId;
    if (data.budget_min !== undefined || data.budget_max !== undefined || data.bhk || data.localities) {
      leadUpdates.requirementJson = {
        ...(lead.requirementJson as Record<string, unknown> || {}),
        ...(data.budget_min !== undefined && { budget_min: data.budget_min }),
        ...(data.budget_max !== undefined && { budget_max: data.budget_max }),
        ...(data.bhk && { bhk: data.bhk }),
        ...(data.localities && { localities: data.localities }),
      };
    }

    if (Object.keys(leadUpdates).length > 0) {
      await db.update(leads).set(leadUpdates).where(eq(leads.id, id));
    }

    // Update profile if provided
    if (lead.profileId && (data.name || data.email || data.mobile)) {
      const profileUpdates: Partial<typeof profiles.$inferInsert> = {};
      if (data.name) profileUpdates.fullName = data.name;
      if (data.email) profileUpdates.email = data.email;
      if (data.mobile) profileUpdates.phone = data.mobile;

      await db.update(profiles).set(profileUpdates).where(eq(profiles.id, lead.profileId));
    }

    // Build changes object for audit
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    if (data.status && data.status !== lead.status) {
      changes.status = { old: lead.status, new: data.status };
    }
    if (data.assignedAgentId && data.assignedAgentId !== lead.assignedAgentId) {
      changes.assignedAgentId = { old: lead.assignedAgentId, new: data.assignedAgentId };
    }
    if (lead.profile) {
      if (data.name && data.name !== lead.profile.fullName) {
        changes.fullName = { old: lead.profile.fullName, new: data.name };
      }
      if (data.email && data.email !== lead.profile.email) {
        changes.email = { old: lead.profile.email, new: data.email };
      }
      if (data.mobile && data.mobile !== lead.profile.phone) {
        changes.phone = { old: lead.profile.phone, new: data.mobile };
      }
    }

    if (Object.keys(changes).length > 0) {
      await logActivity({
        entityType: "lead",
        entityId: id,
        action: "update",
        changes,
      });
    }

    revalidatePath(`/buyers/${id}`);
    revalidatePath("/buyers");
    return {
      success: true,
      message: "Buyer updated successfully",
    };
  } catch (error) {
    console.error("Error updating buyer:", error);
    return {
      success: false,
      error: "BUYER_UPDATE_FAILED",
      message: "Failed to update buyer",
      details: error,
    };
  }
}

// ============================================
// PHASE 3: VISIT MANAGEMENT
// ============================================

/**
 * Create a visit tour
 */
export async function createTour(
  data: CreateTourRequest
): Promise<ActionResult<{ id: string }>> {
  try {
    const validatedData = createTourRequestSchema.parse(data);

    // Create tour
    // Convert Date to YYYY-MM-DD string for date column
    const tourDateStr = validatedData.tourDate instanceof Date 
      ? validatedData.tourDate.toISOString().split('T')[0]
      : validatedData.tourDate;

    const [tour] = await db
      .insert(visitTours)
      .values({
        dispatchAgentId: validatedData.dispatchAgentId,
        fieldAgentId: validatedData.fieldAgentId,
        tourDate: tourDateStr,
        optimizedRoute: validatedData.optimizedRoute || null,
        status: "planned",
      })
      .returning({ id: visitTours.id });

    // Link visits to tour
    await db
      .update(visits)
      .set({ tourId: tour.id })
      .where(sql`${visits.id} = ANY(${validatedData.visitIds})`);

    await logActivity({
      entityType: "visit_tour",
      entityId: tour.id,
      action: "create",
      changes: computeChanges(null, validatedData),
    });

    revalidatePath("/visits");
    return {
      success: true,
      data: { id: tour.id },
      message: "Tour created successfully",
    };
  } catch (error) {
    console.error("Error creating tour:", error);
    return {
      success: false,
      error: "TOUR_CREATE_FAILED",
      message: "Failed to create tour",
      details: error,
    };
  }
}

/**
 * Create a visit
 */
export async function createVisit(
  data: CreateVisitRequest
): Promise<ActionResult<{ id: string }>> {
  try {
    const validatedData = createVisitRequestSchema.parse(data);

    // Generate 4-digit OTP
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

    const [visit] = await db
      .insert(visits)
      .values({
        leadId: validatedData.leadId,
        listingId: validatedData.listingId,
        scheduledAt: validatedData.scheduledAt || null,
        tourId: validatedData.tourId || null,
        otpCode,
        status: "scheduled",
      })
      .returning({ id: visits.id });

    await logActivity({
      entityType: "visit",
      entityId: visit.id,
      action: "create",
      changes: computeChanges(null, validatedData),
    });

    revalidatePath("/visits");
    return {
      success: true,
      data: { id: visit.id },
      message: `Visit created successfully. OTP: ${otpCode}`,
    };
  } catch (error) {
    console.error("Error creating visit:", error);
    return {
      success: false,
      error: "VISIT_CREATE_FAILED",
      message: "Failed to create visit",
      details: error,
    };
  }
}

/**
 * Verify visit OTP and mark as completed
 */
export async function verifyVisitOTP(
  data: VerifyVisitOTP
): Promise<ActionResult> {
  try {
    const validatedData = verifyVisitOTPSchema.parse(data);

    const visit = await db.query.visits.findFirst({
      where: eq(visits.id, validatedData.visitId),
    });

    if (!visit) {
      return {
        success: false,
        error: "VISIT_NOT_FOUND",
        message: "Visit not found",
      };
    }

    if (!visit.otpCode) {
      return {
        success: false,
        error: "OTP_NOT_SET",
        message: "OTP not set for this visit",
      };
    }

    if (visit.otpCode !== validatedData.otpCode) {
      return {
        success: false,
        error: "OTP_MISMATCH",
        message: "Invalid OTP code",
      };
    }

    // Mark visit as completed
    await db
      .update(visits)
      .set({
        status: "completed",
        completedAt: new Date(),
        feedbackText: validatedData.feedbackText || null,
        feedbackRating: validatedData.feedbackRating || null,
        agentLatitude: validatedData.geoData?.latitude || null,
        agentLongitude: validatedData.geoData?.longitude || null,
      })
      .where(eq(visits.id, validatedData.visitId));

    // Award coins to visit agent (if tour exists)
    if (visit.tourId) {
      const tour = await db.query.visitTours.findFirst({
        where: eq(visitTours.id, visit.tourId),
      });
      if (tour?.fieldAgentId) {
        await awardCoins(tour.fieldAgentId, "visit_completed", visit.id);
      }
    }

    await logActivity({
      entityType: "visit",
      entityId: validatedData.visitId,
      action: "update",
      changes: {
        status: { old: visit.status, new: "completed" },
        completedAt: { old: visit.completedAt, new: new Date() },
      },
    });

    revalidatePath("/visits");
    revalidatePath(`/visits/${validatedData.visitId}`);
    return {
      success: true,
      message: "Visit completed successfully",
    };
  } catch (error) {
    console.error("Error verifying visit OTP:", error);
    return {
      success: false,
      error: "VISIT_VERIFY_FAILED",
      message: "Failed to verify visit OTP",
      details: error,
    };
  }
}

/**
 * Update visit status
 */
export async function updateVisitStatus(
  id: string,
  data: UpdateVisitStatus
): Promise<ActionResult> {
  try {
    const validatedData = updateVisitStatusSchema.parse(data);

    const currentVisit = await db.query.visits.findFirst({
      where: eq(visits.id, id),
    });

    if (!currentVisit) {
      return {
        success: false,
        error: "VISIT_NOT_FOUND",
        message: "Visit not found",
      };
    }

    await db
      .update(visits)
      .set({
        status: validatedData.status,
        feedbackText: validatedData.feedbackText || null,
        feedbackRating: validatedData.feedbackRating || null,
      })
      .where(eq(visits.id, id));

    // Handle no-show penalty
    if (validatedData.status === "no_show" && currentVisit.tourId) {
      const tour = await db.query.visitTours.findFirst({
        where: eq(visitTours.id, currentVisit.tourId),
      });
      if (tour?.fieldAgentId) {
        await awardCoins(tour.fieldAgentId, "visit_no_show", id);
      }
    }

    // Build changes object for audit
    const statusChanges: Record<string, { old: unknown; new: unknown }> = {};
    if (validatedData.status !== currentVisit.status) {
      statusChanges.status = { old: currentVisit.status, new: validatedData.status };
    }
    if (validatedData.feedbackText !== undefined && validatedData.feedbackText !== currentVisit.feedbackText) {
      statusChanges.feedbackText = { old: currentVisit.feedbackText, new: validatedData.feedbackText };
    }
    if (validatedData.feedbackRating !== undefined && validatedData.feedbackRating !== currentVisit.feedbackRating) {
      statusChanges.feedbackRating = { old: currentVisit.feedbackRating, new: validatedData.feedbackRating };
    }

    if (Object.keys(statusChanges).length > 0) {
      await logActivity({
        entityType: "visit",
        entityId: id,
        action: "update",
        changes: statusChanges,
      });
    }

    revalidatePath("/visits");
    revalidatePath(`/visits/${id}`);
    return {
      success: true,
      message: "Visit status updated successfully",
    };
  } catch (error) {
    console.error("Error updating visit status:", error);
    return {
      success: false,
      error: "VISIT_UPDATE_FAILED",
      message: "Failed to update visit status",
      details: error,
    };
  }
}

/**
 * Update visit - Refactored with type safety
 */
export async function updateVisit(
  id: string,
  data: UpdateVisit
): Promise<ActionResult> {
  try {
    const validatedData = updateVisitSchema.parse(data);

    const currentVisit = await db.query.visits.findFirst({
      where: eq(visits.id, id),
    });

    if (!currentVisit) {
      return {
        success: false,
        error: "VISIT_NOT_FOUND",
        message: "Visit not found",
      };
    }

    await db
      .update(visits)
      .set({
        scheduledAt: validatedData.scheduledAt || undefined,
        status: validatedData.status,
        feedbackText: validatedData.feedbackText,
        feedbackRating: validatedData.feedbackRating,
      })
      .where(eq(visits.id, id));

    // Build changes object for audit
    const visitUpdateChanges: Record<string, { old: unknown; new: unknown }> = {};
    if (validatedData.scheduledAt !== undefined && validatedData.scheduledAt?.getTime() !== currentVisit.scheduledAt?.getTime()) {
      visitUpdateChanges.scheduledAt = { old: currentVisit.scheduledAt, new: validatedData.scheduledAt };
    }
    if (validatedData.status && validatedData.status !== currentVisit.status) {
      visitUpdateChanges.status = { old: currentVisit.status, new: validatedData.status };
    }
    if (validatedData.feedbackText !== undefined && validatedData.feedbackText !== currentVisit.feedbackText) {
      visitUpdateChanges.feedbackText = { old: currentVisit.feedbackText, new: validatedData.feedbackText };
    }
    if (validatedData.feedbackRating !== undefined && validatedData.feedbackRating !== currentVisit.feedbackRating) {
      visitUpdateChanges.feedbackRating = { old: currentVisit.feedbackRating, new: validatedData.feedbackRating };
    }

    if (Object.keys(visitUpdateChanges).length > 0) {
      await logActivity({
        entityType: "visit",
        entityId: id,
        action: "update",
        changes: visitUpdateChanges,
      });
    }

    revalidatePath(`/visits/${id}`);
    revalidatePath("/visits");
    return {
      success: true,
      message: "Visit updated successfully",
    };
  } catch (error) {
    console.error("Error updating visit:", error);
    return {
      success: false,
      error: "VISIT_UPDATE_FAILED",
      message: "Failed to update visit",
      details: error,
    };
  }
}

// ============================================
// PHASE 4: JUMBO-COINS SYSTEM
// ============================================

/**
 * Award coins to an agent
 */
export async function awardCoins(
  agentId: string,
  actionType: string,
  referenceId?: string,
  notes?: string
): Promise<ActionResult<{ newBalance: number }>> {
  try {
    // Get coin value from rules
    const rule = await db.query.creditRules.findFirst({
      where: eq(creditRules.actionType, actionType),
    });

    if (!rule) {
      return {
        success: false,
        error: "COIN_RULE_NOT_FOUND",
        message: `No coin rule found for action: ${actionType}`,
      };
    }

    // Create ledger entry
    await db.insert(creditLedger).values({
      agentId,
      amount: rule.coinValue,
      actionType,
      referenceId: referenceId || null,
      notes: notes || null,
    });

    // Update cached balance in profile
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, agentId),
    });

    if (profile) {
      const newBalance = (profile.totalCoins || 0) + rule.coinValue;
      await db
        .update(profiles)
        .set({ totalCoins: newBalance })
        .where(eq(profiles.id, agentId));
    }

    return {
      success: true,
      data: { newBalance: (profile?.totalCoins || 0) + rule.coinValue },
      message: `Awarded ${rule.coinValue} coins for ${actionType}`,
    };
  } catch (error) {
    console.error("Error awarding coins:", error);
    return {
      success: false,
      error: "COIN_AWARD_FAILED",
      message: "Failed to award coins",
      details: error,
    };
  }
}

// ============================================
// SELLER MANAGEMENT
// ============================================

/**
 * Update seller (profile) - Refactored with type safety
 */
export async function updateSeller(
  id: string,
  data: {
    name?: string;
    email?: string;
    mobile?: string;
  }
): Promise<ActionResult> {
  try {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, id),
    });

    if (!profile) {
      return {
        success: false,
        error: "PROFILE_NOT_FOUND",
        message: "Seller not found",
      };
    }

    const updates: Partial<typeof profiles.$inferInsert> = {};
    if (data.name) updates.fullName = data.name;
    if (data.email) updates.email = data.email;
    if (data.mobile) updates.phone = data.mobile;

    await db.update(profiles).set(updates).where(eq(profiles.id, id));

    await logActivity({
      entityType: "profile",
      entityId: id,
      action: "update",
      changes: computeChanges(profile, updates),
    });

    revalidatePath(`/sellers/${id}`);
    revalidatePath("/sellers");
    return {
      success: true,
      message: "Seller updated successfully",
    };
  } catch (error) {
    console.error("Error updating seller:", error);
    return {
      success: false,
      error: "SELLER_UPDATE_FAILED",
      message: "Failed to update seller",
      details: error,
    };
  }
}

/**
 * Create seller lead
 */
export async function createSellerLead(
  data: z.infer<typeof createSellerLeadSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const validatedData = createSellerLeadSchema.parse(data);

    const [sellerLead] = await db
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
      })
      .returning({ id: sellerLeads.id });

    await logActivity({
      entityType: "seller_lead",
      entityId: sellerLead.id,
      action: "create",
      changes: computeChanges(null, validatedData),
    });

    revalidatePath("/sellers");
    return {
      success: true,
      data: { id: sellerLead.id },
      message: "Seller lead created successfully",
    };
  } catch (error) {
    console.error("Error creating seller lead:", error);
    return {
      success: false,
      error: "SELLER_LEAD_CREATE_FAILED",
      message: "Failed to create seller lead",
      details: error,
    };
  }
}
