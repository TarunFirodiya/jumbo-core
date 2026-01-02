"use server";

import { revalidatePath } from "next/cache";
import {
  createOfferSchema,
  updateOfferSchema,
} from "@/lib/validations/offer";
import { logActivity, computeChanges } from "@/lib/audit";
import { requirePermission } from "@/lib/auth";
import * as offerService from "@/services/offer.service";

type ActionResult<T = unknown> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string; message: string; details?: unknown };

/**
 * Create a new offer
 */
export async function createOffer(
  data: Parameters<typeof createOfferSchema.parse>[0]
): Promise<ActionResult<{ id: string }>> {
  try {
    const { user } = await requirePermission("offers:create");
    const validatedData = createOfferSchema.parse(data);

    const offer = await offerService.createOffer({
      listingId: validatedData.listingId,
      leadId: validatedData.leadId,
      offerAmount: validatedData.offerAmount,
      terms: validatedData.terms || undefined,
      createdById: user.id,
    });

    await logActivity({
      entityType: "offer",
      entityId: offer.id,
      action: "create",
      changes: computeChanges(null, validatedData),
      performedById: user.id,
    });

    revalidatePath(`/listings/${validatedData.listingId}`);
    revalidatePath(`/offers`);
    return {
      success: true,
      data: { id: offer.id },
      message: "Offer created successfully",
    };
  } catch (error) {
    console.error("Error creating offer:", error);
    return {
      success: false,
      error: "OFFER_CREATE_FAILED",
      message: "Failed to create offer",
      details: error,
    };
  }
}

/**
 * Update an offer
 */
export async function updateOffer(
  offerId: string,
  data: Parameters<typeof updateOfferSchema.parse>[0]
): Promise<ActionResult> {
  try {
    const { user } = await requirePermission("offers:update");
    const validatedData = updateOfferSchema.parse(data);

    const existingOffer = await offerService.getOfferById(offerId);
    if (!existingOffer) {
      return {
        success: false,
        error: "OFFER_NOT_FOUND",
        message: "Offer not found",
      };
    }

    await offerService.updateOffer(offerId, {
      offerAmount: validatedData.offerAmount,
      terms: validatedData.terms,
    });

    await logActivity({
      entityType: "offer",
      entityId: offerId,
      action: "update",
      changes: computeChanges(existingOffer, { ...existingOffer, ...validatedData } as typeof existingOffer),
      performedById: user.id,
    });

    revalidatePath(`/listings/${existingOffer.listingId}`);
    revalidatePath(`/offers`);
    return {
      success: true,
      message: "Offer updated successfully",
    };
  } catch (error) {
    console.error("Error updating offer:", error);
    return {
      success: false,
      error: "OFFER_UPDATE_FAILED",
      message: "Failed to update offer",
      details: error,
    };
  }
}

/**
 * Accept an offer
 */
export async function acceptOffer(offerId: string): Promise<ActionResult> {
  try {
    const { user } = await requirePermission("offers:update");

    const existingOffer = await offerService.getOfferById(offerId);
    if (!existingOffer) {
      return {
        success: false,
        error: "OFFER_NOT_FOUND",
        message: "Offer not found",
      };
    }

    await offerService.acceptOffer(offerId);

    await logActivity({
      entityType: "offer",
      entityId: offerId,
      action: "update",
      changes: { status: { old: existingOffer.status, new: "accepted" } },
      performedById: user.id,
    });

    revalidatePath(`/listings/${existingOffer.listingId}`);
    revalidatePath(`/offers`);
    return {
      success: true,
      message: "Offer accepted successfully",
    };
  } catch (error) {
    console.error("Error accepting offer:", error);
    return {
      success: false,
      error: "OFFER_ACCEPT_FAILED",
      message: "Failed to accept offer",
      details: error,
    };
  }
}

/**
 * Reject an offer
 */
export async function rejectOffer(
  offerId: string,
  reason?: string
): Promise<ActionResult> {
  try {
    const { user } = await requirePermission("offers:update");

    const existingOffer = await offerService.getOfferById(offerId);
    if (!existingOffer) {
      return {
        success: false,
        error: "OFFER_NOT_FOUND",
        message: "Offer not found",
      };
    }

    await offerService.rejectOffer(offerId, reason);

    await logActivity({
      entityType: "offer",
      entityId: offerId,
      action: "update",
      changes: { status: { old: existingOffer.status, new: "rejected" } },
      performedById: user.id,
    });

    revalidatePath(`/listings/${existingOffer.listingId}`);
    revalidatePath(`/offers`);
    return {
      success: true,
      message: "Offer rejected successfully",
    };
  } catch (error) {
    console.error("Error rejecting offer:", error);
    return {
      success: false,
      error: "OFFER_REJECT_FAILED",
      message: "Failed to reject offer",
      details: error,
    };
  }
}

/**
 * Counter an offer
 */
export async function counterOffer(
  offerId: string,
  newAmount: number,
  terms?: Record<string, unknown>
): Promise<ActionResult> {
  try {
    const { user } = await requirePermission("offers:update");

    const existingOffer = await offerService.getOfferById(offerId);
    if (!existingOffer) {
      return {
        success: false,
        error: "OFFER_NOT_FOUND",
        message: "Offer not found",
      };
    }

    await offerService.counterOffer(offerId, newAmount, terms);

    await logActivity({
      entityType: "offer",
      entityId: offerId,
      action: "update",
      changes: {
        status: { old: existingOffer.status, new: "countered" },
        offerAmount: { old: existingOffer.offerAmount, new: newAmount.toString() },
      },
      performedById: user.id,
    });

    revalidatePath(`/listings/${existingOffer.listingId}`);
    revalidatePath(`/offers`);
    return {
      success: true,
      message: "Offer countered successfully",
    };
  } catch (error) {
    console.error("Error countering offer:", error);
    return {
      success: false,
      error: "OFFER_COUNTER_FAILED",
      message: "Failed to counter offer",
      details: error,
    };
  }
}
