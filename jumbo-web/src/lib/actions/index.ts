"use server";

import { revalidatePath } from "next/cache";
import {
  createLeadRequestSchema,
  updateLeadStatusSchema,
  assignLeadSchema,
  updateListingStatusSchema,
  createTourRequestSchema,
  createVisitRequestSchema,
  verifyVisitOTPSchema,
  updateVisitStatusSchema,
  updateVisitSchema,
  createCommunicationSchema,
  createSellerLeadSchema,
  createNoteSchema,
  updateNoteSchema,
  queryNotesSchema,
  uploadMediaSchema,
  updateMediaOrderSchema,
  queryMediaSchema,
} from "@/lib/validations";
import { z } from "zod";
import { logActivity, computeChanges } from "@/lib/audit";
import { requirePermission } from "@/lib/auth";
import type {
  CreateLeadRequest,
  UpdateLeadStatus,
  AssignLead,
  UpdateListingStatus,
  CreateTourRequest,
  CreateVisitRequest,
  VerifyVisitOTP,
  UpdateVisitStatus,
  UpdateVisit,
  CreateCommunication,
} from "@/lib/validations";

// Import services
import * as buildingService from "@/services/building.service";
import * as unitService from "@/services/unit.service";
import * as listingService from "@/services/listing.service";
import * as leadService from "@/services/lead.service";
import * as profileService from "@/services/profile.service";
import * as visitService from "@/services/visit.service";
import * as tourService from "@/services/tour.service";
import * as communicationService from "@/services/communication.service";
import * as sellerLeadService from "@/services/seller-lead.service";
import * as noteService from "@/services/note.service";
import * as mediaService from "@/services/media.service";
import * as coinService from "@/services/coin.service";

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
export async function createBuilding(data: {
  name: string;
  locality?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  amenities?: Record<string, boolean>;
  waterSource?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission("buildings:create");

    const building = await buildingService.createBuilding({
      name: data.name,
      locality: data.locality,
      city: data.city,
      latitude: data.latitude,
      longitude: data.longitude,
      amenitiesJson: data.amenities,
      waterSource: data.waterSource,
    });

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
export async function createUnit(data: {
  buildingId: string;
  unitNumber?: string;
  bhk: number;
  floorNumber?: number;
  carpetArea?: number;
  ownerId?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission("units:create");

    const unit = await unitService.createUnit({
      buildingId: data.buildingId,
      unitNumber: data.unitNumber,
      bhk: data.bhk,
      floorNumber: data.floorNumber,
      carpetArea: data.carpetArea,
      ownerId: data.ownerId,
    });

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
export async function upsertListing(data: {
  building:
    | { id: string }
    | {
        name: string;
        locality?: string;
        city?: string;
        latitude?: number;
        longitude?: number;
        amenities?: Record<string, boolean>;
        waterSource?: string;
      };
  unit: {
    unitNumber?: string;
    bhk: number;
    floorNumber?: number;
    carpetArea?: number;
    ownerId?: string;
  };
  askingPrice: number;
  listingAgentId?: string;
  description?: string;
  images?: string[];
  amenities?: string[];
  externalIds?: {
    housing_id?: string;
    magicbricks_id?: string;
    "99acres_id"?: string;
  };
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { profile } = await requirePermission("listings:create");

    // Set listing agent ID if not provided
    const listingAgentId = data.listingAgentId ?? profile.id;

    const listing = await listingService.upsertListing({
      ...data,
      listingAgentId,
    });

    await logActivity({
      entityType: "listing",
      entityId: listing.id,
      action: "create",
      changes: computeChanges(null, data),
    });

    revalidatePath("/listings");
    revalidatePath(`/listings/${listing.id}`);
    return {
      success: true,
      data: { id: listing.id },
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
    await requirePermission("listings:update");
    const validatedData = updateListingStatusSchema.parse(data);

    // Get current listing for audit
    const currentListing = await listingService.getListingById(id);
    if (!currentListing) {
      return {
        success: false,
        error: "LISTING_NOT_FOUND",
        message: "Listing not found",
      };
    }

    await listingService.updateListingStatus(id, validatedData.status);

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
    await requirePermission("leads:create");
    const validatedData = createLeadRequestSchema.parse(data);

    const lead = await leadService.createLeadWithProfile({
      profile: {
        fullName: validatedData.profile.fullName,
        phone: validatedData.profile.phone,
        email: validatedData.profile.email ?? undefined,
      },
      leadId: validatedData.leadId ?? undefined,
      source: validatedData.source ?? undefined,
      status: validatedData.status ?? "new",
      externalId: validatedData.externalId ?? undefined,
      secondaryPhone: validatedData.secondaryPhone ?? undefined,
      sourceListingId: validatedData.sourceListingId ?? undefined,
      dropReason: validatedData.dropReason ?? undefined,
      locality: validatedData.locality ?? undefined,
      zone: validatedData.zone ?? undefined,
      pipeline: validatedData.pipeline,
      referredBy: validatedData.referredBy ?? undefined,
      testListingId: validatedData.testListingId ?? undefined,
      requirements: validatedData.requirements,
      preferences: validatedData.preferences,
      assignedAgentId: validatedData.assignedAgentId ?? undefined,
    });

    // Auto-assign using round-robin if no agent specified
    if (!validatedData.assignedAgentId) {
      await leadService.assignLeadRoundRobin(lead.id);
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
    const errorMessage = error instanceof Error ? error.message : "Failed to create lead";
    return {
      success: false,
      error: "LEAD_CREATE_FAILED",
      message: errorMessage,
      details: error,
    };
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
    await requirePermission("leads:assign");
    const validatedData = assignLeadSchema.parse(data);

    const currentLead = await leadService.getLeadById(leadId);
    if (!currentLead) {
      return {
        success: false,
        error: "LEAD_NOT_FOUND",
        message: "Lead not found",
      };
    }

    await leadService.assignLead(leadId, validatedData.agentId);

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
    await requirePermission("leads:update");
    const validatedData = updateLeadStatusSchema.parse(data);

    const currentLead = await leadService.getLeadById(id);
    if (!currentLead) {
      return {
        success: false,
        error: "LEAD_NOT_FOUND",
        message: "Lead not found",
      };
    }

    await leadService.updateLeadStatus(id, validatedData.status);

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

    const communication = await communicationService.logCommunication({
      leadId: validatedData.leadId ?? undefined,
      sellerLeadId: validatedData.sellerLeadId ?? undefined,
      agentId: validatedData.agentId,
      channel: validatedData.channel,
      direction: validatedData.direction,
      content: validatedData.content ?? undefined,
      recordingUrl: validatedData.recordingUrl ?? undefined,
      metadata: validatedData.metadata ?? undefined,
    });

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
 * Update buyer (lead + profile)
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
    const currentLead = await leadService.getLeadByIdWithRelations(id);
    if (!currentLead) {
      return {
        success: false,
        error: "LEAD_NOT_FOUND",
        message: "Buyer not found",
      };
    }

    await leadService.updateLeadWithProfile(id, data);

    // Build changes object for audit
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    if (data.status && data.status !== currentLead.status) {
      changes.status = { old: currentLead.status, new: data.status };
    }
    if (data.assignedAgentId && data.assignedAgentId !== currentLead.assignedAgentId) {
      changes.assignedAgentId = { old: currentLead.assignedAgentId, new: data.assignedAgentId };
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

    // Convert Date to YYYY-MM-DD string for date column
    const tourDateStr =
      validatedData.tourDate instanceof Date
        ? validatedData.tourDate.toISOString().split("T")[0]
        : validatedData.tourDate;

    const tour = await tourService.createTour({
      dispatchAgentId: validatedData.dispatchAgentId,
      fieldAgentId: validatedData.fieldAgentId,
      tourDate: tourDateStr,
      optimizedRoute: validatedData.optimizedRoute,
      status: "planned",
    });

    // Link visits to tour
    if (validatedData.visitIds && validatedData.visitIds.length > 0) {
      await tourService.linkVisitsToTour(tour.id, validatedData.visitIds);
    }

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
    await requirePermission("visits:create");
    const validatedData = createVisitRequestSchema.parse(data);

    const visit = await visitService.createVisit({
      leadId: validatedData.leadId,
      listingId: validatedData.listingId,
      scheduledAt: validatedData.scheduledAt,
      tourId: validatedData.tourId,
      status: "scheduled",
    });

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
      message: `Visit created successfully. OTP: ${visit.otpCode}`,
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

    const visit = await visitService.getVisitById(validatedData.visitId);
    if (!visit) {
      return {
        success: false,
        error: "VISIT_NOT_FOUND",
        message: "Visit not found",
      };
    }

    await visitService.verifyVisitOTP(
      validatedData.visitId,
      validatedData.otpCode,
      validatedData.geoData
    );

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
      message: error instanceof Error ? error.message : "Failed to verify visit OTP",
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

    const currentVisit = await visitService.getVisitById(id);
    if (!currentVisit) {
      return {
        success: false,
        error: "VISIT_NOT_FOUND",
        message: "Visit not found",
      };
    }

    await visitService.updateVisitStatus(
      id,
      validatedData.status,
      validatedData.feedbackText,
      validatedData.feedbackRating
    );

    await logActivity({
      entityType: "visit",
      entityId: id,
      action: "update",
      changes: { status: { old: currentVisit.status, new: validatedData.status } },
    });

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
 * Update visit
 */
export async function updateVisit(
  id: string,
  data: UpdateVisit
): Promise<ActionResult> {
  try {
    const validatedData = updateVisitSchema.parse(data);

    const currentVisit = await visitService.getVisitById(id);
    if (!currentVisit) {
      return {
        success: false,
        error: "VISIT_NOT_FOUND",
        message: "Visit not found",
      };
    }

    await visitService.updateVisit(id, {
      scheduledAt: validatedData.scheduledAt,
      status: validatedData.status,
      feedbackText: validatedData.feedbackText,
      feedbackRating: validatedData.feedbackRating,
    });

    await logActivity({
      entityType: "visit",
      entityId: id,
      action: "update",
      changes: computeChanges(currentVisit, validatedData),
    });

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
    const result = await coinService.awardCoins(agentId, actionType, referenceId, notes);

    return {
      success: true,
      data: { newBalance: result.newBalance },
      message: `Awarded ${result.coinsAwarded} coins for ${actionType}`,
    };
  } catch (error) {
    console.error("Error awarding coins:", error);
    return {
      success: false,
      error: "COIN_AWARD_FAILED",
      message: error instanceof Error ? error.message : "Failed to award coins",
      details: error,
    };
  }
}

// ============================================
// SELLER MANAGEMENT
// ============================================

/**
 * Update seller (profile)
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
    const profile = await profileService.getProfileById(id);
    if (!profile) {
      return {
        success: false,
        error: "PROFILE_NOT_FOUND",
        message: "Seller not found",
      };
    }

    await profileService.updateProfile(id, {
      ...(data.name && { fullName: data.name }),
      ...(data.email && { email: data.email }),
      ...(data.mobile && { phone: data.mobile }),
    });

    await logActivity({
      entityType: "profile",
      entityId: id,
      action: "update",
      changes: computeChanges(profile, data),
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
    const { user } = await requirePermission("seller_leads:create");
    const validatedData = createSellerLeadSchema.parse(data);

    const sellerLead = await sellerLeadService.createSellerLead({
      name: validatedData.name,
      phone: validatedData.phone,
      email: validatedData.email,
      status: validatedData.status,
      source: validatedData.source,
      sourceUrl: validatedData.sourceUrl,
      sourceListingUrl: validatedData.sourceListingUrl,
      referredById: validatedData.referredById,
      buildingId: validatedData.buildingId,
      unitId: validatedData.unitId,
      assignedToId: validatedData.assignedToId,
      followUpDate: validatedData.followUpDate ? new Date(validatedData.followUpDate) : null,
      isNri: validatedData.isNri,
      secondaryPhone: validatedData.secondaryPhone,
      dropReason: validatedData.dropReason,
      createdById: user.id,
    });

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

// ============================================
// NOTES MANAGEMENT
// ============================================

/**
 * Create a new note
 */
export async function createNote(
  entityType: string,
  entityId: string,
  content: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const { user } = await requirePermission("notes:create");

    const validatedData = createNoteSchema.parse({
      entityType,
      entityId,
      content,
    });

    const note = await noteService.createNote({
      entityType: validatedData.entityType,
      entityId: validatedData.entityId,
      content: validatedData.content,
      createdById: user.id,
    });

    await logActivity({
      entityType: "note",
      entityId: note.id,
      action: "create",
      changes: computeChanges(null, validatedData),
    });

    revalidatePath(`/${entityType}s/${entityId}`);
    return {
      success: true,
      data: { id: note.id },
      message: "Note created successfully",
    };
  } catch (error) {
    console.error("Error creating note:", error);
    return {
      success: false,
      error: "NOTE_CREATE_FAILED",
      message: "Failed to create note",
      details: error,
    };
  }
}

/**
 * Update a note
 */
export async function updateNote(
  noteId: string,
  content: string
): Promise<ActionResult> {
  try {
    const { user } = await requirePermission("notes:update");

    const existingNote = await noteService.getNoteById(noteId);
    if (!existingNote) {
      return {
        success: false,
        error: "NOTE_NOT_FOUND",
        message: "Note not found",
      };
    }

    // Check if user owns the note
    if (existingNote.createdById !== user.id) {
      return {
        success: false,
        error: "FORBIDDEN",
        message: "You can only edit your own notes",
      };
    }

    const validatedData = updateNoteSchema.parse({ content });
    await noteService.updateNote(noteId, validatedData.content);

    await logActivity({
      entityType: "note",
      entityId: noteId,
      action: "update",
      changes: computeChanges(existingNote as Record<string, unknown>, { content: validatedData.content }),
    });

    revalidatePath(`/${existingNote.entityType}s/${existingNote.entityId}`);
    return {
      success: true,
      message: "Note updated successfully",
    };
  } catch (error) {
    console.error("Error updating note:", error);
    return {
      success: false,
      error: "NOTE_UPDATE_FAILED",
      message: "Failed to update note",
      details: error,
    };
  }
}

/**
 * Delete a note (soft delete)
 */
export async function deleteNote(noteId: string): Promise<ActionResult> {
  try {
    const { user } = await requirePermission("notes:delete");

    const existingNote = await noteService.getNoteById(noteId);
    if (!existingNote) {
      return {
        success: false,
        error: "NOTE_NOT_FOUND",
        message: "Note not found",
      };
    }

    // Check if user owns the note
    if (existingNote.createdById !== user.id) {
      return {
        success: false,
        error: "FORBIDDEN",
        message: "You can only delete your own notes",
      };
    }

    await noteService.deleteNote(noteId);

    await logActivity({
      entityType: "note",
      entityId: noteId,
      action: "delete",
      changes: null,
    });

    revalidatePath(`/${existingNote.entityType}s/${existingNote.entityId}`);
    return {
      success: true,
      message: "Note deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting note:", error);
    return {
      success: false,
      error: "NOTE_DELETE_FAILED",
      message: "Failed to delete note",
      details: error,
    };
  }
}

/**
 * Get notes by entity
 */
export async function getNotesByEntity(
  entityType: string,
  entityId: string
): Promise<ActionResult<Array<Awaited<ReturnType<typeof noteService.getNotesByEntity>>[number]>>> {
  try {
    await requirePermission("notes:read");

    const validatedData = queryNotesSchema.parse({
      entityType,
      entityId,
    });

    const notesList = await noteService.getNotesByEntity(
      validatedData.entityType,
      validatedData.entityId
    );

    return {
      success: true,
      data: notesList,
    };
  } catch (error) {
    console.error("Error fetching notes:", error);
    return {
      success: false,
      error: "NOTES_FETCH_FAILED",
      message: "Failed to fetch notes",
      details: error,
    };
  }
}

// ============================================
// MEDIA MANAGEMENT
// ============================================

/**
 * Upload media item
 */
export async function uploadMedia(
  entityType: string,
  entityId: string,
  cloudinaryUrl: string,
  mediaType: string,
  tag?: string,
  order?: number,
  metadata?: Record<string, unknown>
): Promise<ActionResult<{ id: string }>> {
  try {
    const { user } = await requirePermission("media:create");

    const validatedData = uploadMediaSchema.parse({
      entityType,
      entityId,
      cloudinaryUrl,
      mediaType,
      tag,
      order: order ?? 0,
      metadata,
    });

    const media = await mediaService.uploadMedia({
      entityType: validatedData.entityType,
      entityId: validatedData.entityId,
      mediaType: validatedData.mediaType as "image" | "video" | "floor_plan" | "document",
      cloudinaryUrl: validatedData.cloudinaryUrl,
      cloudinaryPublicId: validatedData.cloudinaryPublicId,
      tag: validatedData.tag,
      order: validatedData.order,
      metadata: validatedData.metadata,
      uploadedById: user.id,
    });

    await logActivity({
      entityType: "media_item",
      entityId: media.id,
      action: "create",
      changes: computeChanges(null, validatedData),
    });

    revalidatePath(`/${entityType}s/${entityId}`);
    return {
      success: true,
      data: { id: media.id },
      message: "Media uploaded successfully",
    };
  } catch (error) {
    console.error("Error uploading media:", error);
    return {
      success: false,
      error: "MEDIA_UPLOAD_FAILED",
      message: "Failed to upload media",
      details: error,
    };
  }
}

/**
 * Update media order (bulk)
 */
export async function updateMediaOrder(
  items: Array<{ id: string; order: number }>
): Promise<ActionResult> {
  try {
    await requirePermission("media:update");

    const validatedData = updateMediaOrderSchema.parse({ mediaItems: items });
    await mediaService.updateMediaOrder(validatedData.mediaItems);

    await logActivity({
      entityType: "media_item",
      entityId: "bulk",
      action: "update",
      changes: { order: { old: "previous", new: "updated" } },
    });

    return {
      success: true,
      message: "Media order updated successfully",
    };
  } catch (error) {
    console.error("Error updating media order:", error);
    return {
      success: false,
      error: "MEDIA_ORDER_UPDATE_FAILED",
      message: "Failed to update media order",
      details: error,
    };
  }
}

/**
 * Delete media item
 */
export async function deleteMedia(mediaId: string): Promise<ActionResult> {
  try {
    await requirePermission("media:delete");

    const existingMedia = await mediaService.getMediaById(mediaId);
    if (!existingMedia) {
      return {
        success: false,
        error: "MEDIA_NOT_FOUND",
        message: "Media item not found",
      };
    }

    await mediaService.deleteMedia(mediaId);

    await logActivity({
      entityType: "media_item",
      entityId: mediaId,
      action: "delete",
      changes: null,
    });

    revalidatePath(`/${existingMedia.entityType}s/${existingMedia.entityId}`);
    return {
      success: true,
      message: "Media deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting media:", error);
    return {
      success: false,
      error: "MEDIA_DELETE_FAILED",
      message: "Failed to delete media",
      details: error,
    };
  }
}

/**
 * Get media by entity
 */
export async function getMediaByEntity(
  entityType: string,
  entityId: string,
  tag?: string
): Promise<ActionResult<Array<Awaited<ReturnType<typeof mediaService.getMediaByEntity>>[number]>>> {
  try {
    await requirePermission("media:read");

    const validatedData = queryMediaSchema.parse({
      entityType,
      entityId,
      tag,
    });

    const mediaList = await mediaService.getMediaByEntity(
      validatedData.entityType,
      validatedData.entityId,
      validatedData.tag
    );

    return {
      success: true,
      data: mediaList,
    };
  } catch (error) {
    console.error("Error fetching media:", error);
    return {
      success: false,
      error: "MEDIA_FETCH_FAILED",
      message: "Failed to fetch media",
      details: error,
    };
  }
}

// ============================================
// PHASE 5: INSPECTIONS & CATALOGUES
// ============================================

// Import and re-export inspection actions
import {
  createInspection,
  updateInspection,
  completeInspection,
  getInspectionsByListing,
} from "./inspections";

export { createInspection, updateInspection, completeInspection, getInspectionsByListing };

// Import and re-export catalogue actions
import {
  createCatalogue,
  updateCatalogue,
  approveCatalogue,
  rejectCatalogue,
  getCataloguesByListing,
} from "./catalogues";

export { createCatalogue, updateCatalogue, approveCatalogue, rejectCatalogue, getCataloguesByListing };

// Import and re-export offer actions
import {
  createOffer,
  updateOffer,
  acceptOffer,
  rejectOffer,
  counterOffer,
} from "./offers";

export { createOffer, updateOffer, acceptOffer, rejectOffer, counterOffer };

// Import and re-export visit workflow actions
import {
  confirmVisit,
  cancelVisit,
  rescheduleVisit,
  completeVisit,
} from "./visit-workflows";

export { confirmVisit, cancelVisit, rescheduleVisit, completeVisit };
