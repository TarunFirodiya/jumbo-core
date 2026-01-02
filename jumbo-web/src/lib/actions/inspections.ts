"use server";

import { revalidatePath } from "next/cache";
import {
  createInspectionSchema,
  updateInspectionSchema,
  completeInspectionSchema,
} from "@/lib/validations/inspection";
import { logActivity, computeChanges } from "@/lib/audit";
import { requirePermission } from "@/lib/auth";
import * as inspectionService from "@/services/inspection.service";

type ActionResult<T = unknown> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string; message: string; details?: unknown };

/**
 * Create a new inspection
 */
export async function createInspection(
  data: Parameters<typeof createInspectionSchema.parse>[0]
): Promise<ActionResult<{ id: string }>> {
  try {
    const { user } = await requirePermission("inspections:create");
    const validatedData = createInspectionSchema.parse(data);

    const inspection = await inspectionService.createInspection({
      listingId: validatedData.listingId || null,
      name: validatedData.name || null,
      location: validatedData.location || null,
      inspectedOn: validatedData.inspectedOn ? new Date(validatedData.inspectedOn) : null,
      inspectedById: validatedData.inspectedById,
      inspectionLatitude: validatedData.inspectionLatitude || null,
      inspectionLongitude: validatedData.inspectionLongitude || null,
      inspectionScore: validatedData.inspectionScore?.toString() || null,
      attempts: validatedData.attempts || 0,
      notes: validatedData.notes || null,
      cauveryChecklist: validatedData.cauveryChecklist || false,
      knownIssues: validatedData.knownIssues || null,
      imagesJsonUrl: validatedData.imagesJsonUrl || null,
      buildingJsonUrl: validatedData.buildingJsonUrl || null,
      videoLink: validatedData.videoLink || null,
      thumbnailUrl: validatedData.thumbnailUrl || null,
      status: validatedData.status || "pending",
    });

    await logActivity({
      entityType: "home_inspection",
      entityId: inspection.id,
      action: "create",
      changes: computeChanges(null, validatedData),
      performedById: user.id,
    });

    revalidatePath(`/listings/${validatedData.listingId}`);
    return {
      success: true,
      data: { id: inspection.id },
      message: "Inspection created successfully",
    };
  } catch (error) {
    console.error("Error creating inspection:", error);
    return {
      success: false,
      error: "INSPECTION_CREATE_FAILED",
      message: "Failed to create inspection",
      details: error,
    };
  }
}

/**
 * Update an inspection
 */
export async function updateInspection(
  inspectionId: string,
  data: Parameters<typeof updateInspectionSchema.parse>[0]
): Promise<ActionResult> {
  try {
    const { user } = await requirePermission("inspections:update");
    const validatedData = updateInspectionSchema.parse(data);

    const existingInspection = await inspectionService.getInspectionById(inspectionId);
    if (!existingInspection) {
      return {
        success: false,
        error: "INSPECTION_NOT_FOUND",
        message: "Inspection not found",
      };
    }

    const updateData: Record<string, unknown> = {};

    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.location !== undefined) updateData.location = validatedData.location;
    if (validatedData.inspectedOn !== undefined) updateData.inspectedOn = validatedData.inspectedOn ? new Date(validatedData.inspectedOn) : null;
    if (validatedData.inspectionLatitude !== undefined) updateData.inspectionLatitude = validatedData.inspectionLatitude;
    if (validatedData.inspectionLongitude !== undefined) updateData.inspectionLongitude = validatedData.inspectionLongitude;
    if (validatedData.inspectionScore !== undefined) updateData.inspectionScore = validatedData.inspectionScore;
    if (validatedData.attempts !== undefined) updateData.attempts = validatedData.attempts;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;
    if (validatedData.cauveryChecklist !== undefined) updateData.cauveryChecklist = validatedData.cauveryChecklist;
    if (validatedData.knownIssues !== undefined) updateData.knownIssues = validatedData.knownIssues;
    if (validatedData.imagesJsonUrl !== undefined) updateData.imagesJsonUrl = validatedData.imagesJsonUrl;
    if (validatedData.buildingJsonUrl !== undefined) updateData.buildingJsonUrl = validatedData.buildingJsonUrl;
    if (validatedData.videoLink !== undefined) updateData.videoLink = validatedData.videoLink;
    if (validatedData.thumbnailUrl !== undefined) updateData.thumbnailUrl = validatedData.thumbnailUrl;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;

    await inspectionService.updateInspection(inspectionId, updateData);

    await logActivity({
      entityType: "home_inspection",
      entityId: inspectionId,
      action: "update",
      changes: computeChanges(existingInspection, updateData),
      performedById: user.id,
    });

    revalidatePath(`/listings/${existingInspection.listingId}`);
    return {
      success: true,
      message: "Inspection updated successfully",
    };
  } catch (error) {
    console.error("Error updating inspection:", error);
    return {
      success: false,
      error: "INSPECTION_UPDATE_FAILED",
      message: "Failed to update inspection",
      details: error,
    };
  }
}

/**
 * Complete an inspection (with location capture)
 */
export async function completeInspection(
  inspectionId: string,
  data: Parameters<typeof completeInspectionSchema.parse>[0]
): Promise<ActionResult> {
  try {
    const { user } = await requirePermission("inspections:update");
    const validatedData = completeInspectionSchema.parse({ inspectionId, ...(data as Record<string, unknown>) });

    const existingInspection = await inspectionService.getInspectionById(inspectionId);
    if (!existingInspection) {
      return {
        success: false,
        error: "INSPECTION_NOT_FOUND",
        message: "Inspection not found",
      };
    }

    await inspectionService.completeInspection(inspectionId, {
      location: validatedData.location,
      inspectionScore: validatedData.inspectionScore ? Number(validatedData.inspectionScore) : undefined,
      notes: validatedData.notes,
      knownIssues: validatedData.knownIssues,
    });

    await logActivity({
      entityType: "home_inspection",
      entityId: inspectionId,
      action: "update",
      changes: { status: { old: existingInspection.status, new: "completed" } },
      performedById: user.id,
    });

    revalidatePath(`/listings/${existingInspection.listingId}`);
    return {
      success: true,
      message: "Inspection completed successfully",
    };
  } catch (error) {
    console.error("Error completing inspection:", error);
    return {
      success: false,
      error: "INSPECTION_COMPLETE_FAILED",
      message: "Failed to complete inspection",
      details: error,
    };
  }
}

/**
 * Get inspections by listing
 */
export async function getInspectionsByListing(
  listingId: string
): Promise<ActionResult<Awaited<ReturnType<typeof inspectionService.getInspectionsByListing>>>> {
  try {
    await requirePermission("inspections:read");

    const inspections = await inspectionService.getInspectionsByListing(listingId);

    return {
      success: true,
      data: inspections,
    };
  } catch (error) {
    console.error("Error fetching inspections:", error);
    return {
      success: false,
      error: "INSPECTIONS_FETCH_FAILED",
      message: "Failed to fetch inspections",
      details: error,
    };
  }
}
