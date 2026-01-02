"use server";

import { revalidatePath } from "next/cache";
import {
  createCatalogueSchema,
  updateCatalogueSchema,
} from "@/lib/validations/catalogue";
import { logActivity, computeChanges } from "@/lib/audit";
import { requirePermission } from "@/lib/auth";
import * as catalogueService from "@/services/catalogue.service";

type ActionResult<T = unknown> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string; message: string; details?: unknown };

/**
 * Create a new catalogue
 */
export async function createCatalogue(
  data: Parameters<typeof createCatalogueSchema.parse>[0]
): Promise<ActionResult<{ id: string }>> {
  try {
    const { user } = await requirePermission("catalogues:create");
    const validatedData = createCatalogueSchema.parse(data);

    const catalogue = await catalogueService.createCatalogue({
      listingId: validatedData.listingId,
      inspectionId: validatedData.inspectionId || null,
      name: validatedData.name || null,
      inspectedOn: validatedData.inspectedOn ? new Date(validatedData.inspectedOn) : null,
      cataloguedById: validatedData.cataloguedById,
      cataloguingScore: validatedData.cataloguingScore?.toString() || null,
      cauveryChecklist: validatedData.cauveryChecklist || false,
      thumbnailUrl: validatedData.thumbnailUrl || null,
      floorPlanUrl: validatedData.floorPlanUrl || null,
      buildingJsonUrl: validatedData.buildingJsonUrl || null,
      listingJsonUrl: validatedData.listingJsonUrl || null,
      video30SecUrl: validatedData.video30SecUrl || null,
      status: validatedData.status || "pending",
    });

    await logActivity({
      entityType: "home_catalogue",
      entityId: catalogue.id,
      action: "create",
      changes: computeChanges(null, validatedData),
      performedById: user.id,
    });

    revalidatePath(`/listings/${validatedData.listingId}`);
    return {
      success: true,
      data: { id: catalogue.id },
      message: "Catalogue created successfully",
    };
  } catch (error) {
    console.error("Error creating catalogue:", error);
    return {
      success: false,
      error: "CATALOGUE_CREATE_FAILED",
      message: "Failed to create catalogue",
      details: error,
    };
  }
}

/**
 * Update a catalogue
 */
export async function updateCatalogue(
  catalogueId: string,
  data: Parameters<typeof updateCatalogueSchema.parse>[0]
): Promise<ActionResult> {
  try {
    const { user } = await requirePermission("catalogues:update");
    const validatedData = updateCatalogueSchema.parse(data);

    const existingCatalogue = await catalogueService.getCatalogueById(catalogueId);
    if (!existingCatalogue) {
      return {
        success: false,
        error: "CATALOGUE_NOT_FOUND",
        message: "Catalogue not found",
      };
    }

    const updateData: Record<string, unknown> = {};

    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.inspectedOn !== undefined) updateData.inspectedOn = validatedData.inspectedOn ? new Date(validatedData.inspectedOn) : null;
    if (validatedData.cataloguingScore !== undefined) updateData.cataloguingScore = validatedData.cataloguingScore;
    if (validatedData.cauveryChecklist !== undefined) updateData.cauveryChecklist = validatedData.cauveryChecklist;
    if (validatedData.thumbnailUrl !== undefined) updateData.thumbnailUrl = validatedData.thumbnailUrl;
    if (validatedData.floorPlanUrl !== undefined) updateData.floorPlanUrl = validatedData.floorPlanUrl;
    if (validatedData.buildingJsonUrl !== undefined) updateData.buildingJsonUrl = validatedData.buildingJsonUrl;
    if (validatedData.listingJsonUrl !== undefined) updateData.listingJsonUrl = validatedData.listingJsonUrl;
    if (validatedData.video30SecUrl !== undefined) updateData.video30SecUrl = validatedData.video30SecUrl;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;

    await catalogueService.updateCatalogue(catalogueId, updateData);

    await logActivity({
      entityType: "home_catalogue",
      entityId: catalogueId,
      action: "update",
      changes: computeChanges(existingCatalogue, updateData),
      performedById: user.id,
    });

    revalidatePath(`/listings/${existingCatalogue.listingId}`);
    return {
      success: true,
      message: "Catalogue updated successfully",
    };
  } catch (error) {
    console.error("Error updating catalogue:", error);
    return {
      success: false,
      error: "CATALOGUE_UPDATE_FAILED",
      message: "Failed to update catalogue",
      details: error,
    };
  }
}

/**
 * Approve a catalogue
 */
export async function approveCatalogue(catalogueId: string): Promise<ActionResult> {
  try {
    const { user } = await requirePermission("catalogues:update");

    const existingCatalogue = await catalogueService.getCatalogueById(catalogueId);
    if (!existingCatalogue) {
      return {
        success: false,
        error: "CATALOGUE_NOT_FOUND",
        message: "Catalogue not found",
      };
    }

    await catalogueService.approveCatalogue(catalogueId);

    await logActivity({
      entityType: "home_catalogue",
      entityId: catalogueId,
      action: "update",
      changes: { status: { old: existingCatalogue.status, new: "approved" } },
      performedById: user.id,
    });

    revalidatePath(`/listings/${existingCatalogue.listingId}`);
    return {
      success: true,
      message: "Catalogue approved successfully",
    };
  } catch (error) {
    console.error("Error approving catalogue:", error);
    return {
      success: false,
      error: "CATALOGUE_APPROVE_FAILED",
      message: "Failed to approve catalogue",
      details: error,
    };
  }
}

/**
 * Reject a catalogue
 */
export async function rejectCatalogue(
  catalogueId: string,
  reason?: string
): Promise<ActionResult> {
  try {
    const { user } = await requirePermission("catalogues:update");

    const existingCatalogue = await catalogueService.getCatalogueById(catalogueId);
    if (!existingCatalogue) {
      return {
        success: false,
        error: "CATALOGUE_NOT_FOUND",
        message: "Catalogue not found",
      };
    }

    await catalogueService.rejectCatalogue(catalogueId, reason);

    await logActivity({
      entityType: "home_catalogue",
      entityId: catalogueId,
      action: "update",
      changes: { status: { old: existingCatalogue.status, new: "rejected" } },
      performedById: user.id,
    });

    revalidatePath(`/listings/${existingCatalogue.listingId}`);
    return {
      success: true,
      message: "Catalogue rejected successfully",
    };
  } catch (error) {
    console.error("Error rejecting catalogue:", error);
    return {
      success: false,
      error: "CATALOGUE_REJECT_FAILED",
      message: "Failed to reject catalogue",
      details: error,
    };
  }
}

/**
 * Get catalogues by listing
 */
export async function getCataloguesByListing(
  listingId: string
): Promise<ActionResult<Awaited<ReturnType<typeof catalogueService.getCataloguesByListing>>>> {
  try {
    await requirePermission("catalogues:read");

    const catalogues = await catalogueService.getCataloguesByListing(listingId);

    return {
      success: true,
      data: catalogues,
    };
  } catch (error) {
    console.error("Error fetching catalogues:", error);
    return {
      success: false,
      error: "CATALOGUES_FETCH_FAILED",
      message: "Failed to fetch catalogues",
      details: error,
    };
  }
}
