"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/audit";
import { requirePermission } from "@/lib/auth";
import * as visitService from "@/services/visit.service";

type ActionResult<T = unknown> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string; message: string; details?: unknown };

/**
 * Confirm a visit
 */
export async function confirmVisit(visitId: string): Promise<ActionResult> {
  try {
    const { user } = await requirePermission("visits:update");

    const visit = await visitService.getVisitById(visitId);
    if (!visit) {
      return {
        success: false,
        error: "VISIT_NOT_FOUND",
        message: "Visit not found",
      };
    }

    await visitService.confirmVisit(visitId);

    await logActivity({
      entityType: "visit",
      entityId: visitId,
      action: "update",
      changes: {
        status: { old: visit.status, new: "confirmed" },
        visitConfirmed: { old: visit.visitConfirmed, new: true },
      },
      performedById: user.id,
    });

    revalidatePath("/visits");
    revalidatePath(`/visits/${visitId}`);
    return {
      success: true,
      message: "Visit confirmed successfully",
    };
  } catch (error) {
    console.error("Error confirming visit:", error);
    return {
      success: false,
      error: "VISIT_CONFIRM_FAILED",
      message: error instanceof Error ? error.message : "Failed to confirm visit",
      details: error,
    };
  }
}

/**
 * Cancel a visit
 */
export async function cancelVisit(
  visitId: string,
  dropReason?: string,
  cancellationNotes?: string
): Promise<ActionResult> {
  try {
    const { user } = await requirePermission("visits:update");

    const visit = await visitService.getVisitById(visitId);
    if (!visit) {
      return {
        success: false,
        error: "VISIT_NOT_FOUND",
        message: "Visit not found",
      };
    }

    await visitService.cancelVisit(visitId, dropReason, cancellationNotes);

    await logActivity({
      entityType: "visit",
      entityId: visitId,
      action: "update",
      changes: {
        status: { old: visit.status, new: "cancelled" },
        visitCanceled: { old: visit.visitCanceled, new: true },
        ...(dropReason ? { dropReason: { old: visit.dropReason, new: dropReason } } : {}),
      },
      performedById: user.id,
    });

    revalidatePath("/visits");
    revalidatePath(`/visits/${visitId}`);
    return {
      success: true,
      message: "Visit cancelled successfully",
    };
  } catch (error) {
    console.error("Error canceling visit:", error);
    return {
      success: false,
      error: "VISIT_CANCEL_FAILED",
      message: error instanceof Error ? error.message : "Failed to cancel visit",
      details: error,
    };
  }
}

/**
 * Reschedule a visit (creates new visit, cancels old)
 */
export async function rescheduleVisit(
  visitId: string,
  newScheduledAt: Date
): Promise<ActionResult<{ id: string }>> {
  try {
    const { user } = await requirePermission("visits:create");

    const result = await visitService.rescheduleVisit(visitId, newScheduledAt);

    await logActivity({
      entityType: "visit",
      entityId: result.newVisitId,
      action: "create",
      changes: { rescheduledFromVisitId: { old: null, new: visitId } },
      performedById: user.id,
    });

    revalidatePath("/visits");
    revalidatePath(`/visits/${visitId}`);
    return {
      success: true,
      data: { id: result.newVisitId },
      message: "Visit rescheduled successfully",
    };
  } catch (error) {
    console.error("Error rescheduling visit:", error);
    return {
      success: false,
      error: "VISIT_RESCHEDULE_FAILED",
      message: error instanceof Error ? error.message : "Failed to reschedule visit",
      details: error,
    };
  }
}

/**
 * Complete a visit (requires OTP + location)
 */
export async function completeVisit(
  visitId: string,
  otpCode: string,
  location: { latitude: number; longitude: number },
  feedback?: { text?: string; rating?: number; buyerScore?: number; primaryPainPoint?: string }
): Promise<ActionResult> {
  try {
    const { user } = await requirePermission("visits:update");

    const visit = await visitService.getVisitById(visitId);
    if (!visit) {
      return {
        success: false,
        error: "VISIT_NOT_FOUND",
        message: "Visit not found",
      };
    }

    await visitService.completeVisit(visitId, {
      otpCode,
      location,
      feedback,
    });

    await logActivity({
      entityType: "visit",
      entityId: visitId,
      action: "update",
      changes: {
        visitCompleted: { old: visit.visitCompleted, new: true },
        status: { old: visit.status, new: "completed" },
      },
      performedById: user.id,
    });

    revalidatePath("/visits");
    revalidatePath(`/visits/${visitId}`);
    return {
      success: true,
      message: "Visit completed successfully",
    };
  } catch (error) {
    console.error("Error completing visit:", error);
    return {
      success: false,
      error: "VISIT_COMPLETE_FAILED",
      message: error instanceof Error ? error.message : "Failed to complete visit",
      details: error,
    };
  }
}
