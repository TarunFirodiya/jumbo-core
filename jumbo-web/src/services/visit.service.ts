/**
 * Visit Service
 * Handles all database operations for visits
 */

import { db } from "@/lib/db";
import { visits, type NewVisit, type Visit } from "@/lib/db/schema";
import { eq, and, sql, desc, isNull } from "drizzle-orm";
import type { VisitFilters, PaginatedResult, CompleteVisitData } from "./types";
import { NotFoundError, OTPError, OperationNotAllowedError } from "./errors";
import * as coinService from "./coin.service";
import * as tourService from "./tour.service";

/**
 * Generate a 4-digit OTP code
 */
function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Create a new visit
 */
export async function createVisit(data: NewVisit): Promise<Visit> {
  const otpCode = generateOTP();

  const [visit] = await db
    .insert(visits)
    .values({
      ...data,
      otpCode,
      status: data.status ?? "scheduled",
    })
    .returning();

  return visit;
}

/**
 * Get visit by ID
 */
export async function getVisitById(id: string): Promise<Visit | null> {
  return db.query.visits.findFirst({
    where: eq(visits.id, id),
    with: {
      tour: {
        with: {
          fieldAgent: true,
          dispatchAgent: true,
        },
      },
      lead: {
        with: {
          profile: true,
        },
      },
      listing: {
        with: {
          unit: {
            with: {
              building: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Get visits with filters and pagination
 */
export async function getVisits(
  filters: VisitFilters = {}
): Promise<PaginatedResult<Visit>> {
  const { page = 1, limit = 50, status, leadId, listingId, tourId } = filters;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (status) {
    conditions.push(eq(visits.status, status));
  }

  if (leadId) {
    conditions.push(eq(visits.leadId, leadId));
  }

  if (listingId) {
    conditions.push(eq(visits.listingId, listingId));
  }

  if (tourId) {
    conditions.push(eq(visits.tourId, tourId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db.query.visits.findMany({
      where: whereClause,
      with: {
        tour: {
          with: {
            fieldAgent: true,
          },
        },
        lead: {
          with: {
            profile: true,
            assignedAgent: true,
          },
        },
        assignedVa: true,
        listing: {
          with: {
            unit: {
              with: {
                building: true,
              },
            },
          },
        },
      },
      limit,
      offset,
      orderBy: [desc(visits.scheduledAt)],
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(visits)
      .where(whereClause),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Update a visit
 */
export async function updateVisit(
  id: string,
  data: Partial<NewVisit>
): Promise<Visit> {
  const existing = await getVisitById(id);
  if (!existing) {
    throw new NotFoundError("Visit", id);
  }

  const [updated] = await db
    .update(visits)
    .set(data)
    .where(eq(visits.id, id))
    .returning();

  return updated;
}

/**
 * Update visit status
 */
export async function updateVisitStatus(
  id: string,
  status: string,
  feedbackText?: string,
  feedbackRating?: number
): Promise<Visit> {
  const visit = await getVisitById(id);
  if (!visit) {
    throw new NotFoundError("Visit", id);
  }

  const [updated] = await db
    .update(visits)
    .set({
      status,
      feedbackText: feedbackText ?? null,
      feedbackRating: feedbackRating ?? null,
    })
    .where(eq(visits.id, id))
    .returning();

  // Handle no-show penalty
  if (status === "no_show" && visit.tourId) {
    const tour = await tourService.getTourById(visit.tourId);
    if (tour?.fieldAgentId) {
      try {
        await coinService.awardCoins(tour.fieldAgentId, "visit_no_show", id);
      } catch (error) {
        // Log but don't fail the status update
        console.error("Failed to award no-show penalty:", error);
      }
    }
  }

  return updated;
}

/**
 * Verify visit OTP and mark as completed
 */
export async function verifyVisitOTP(
  visitId: string,
  otpCode: string,
  geoData?: { latitude: number; longitude: number }
): Promise<Visit> {
  const visit = await getVisitById(visitId);
  if (!visit) {
    throw new NotFoundError("Visit", visitId);
  }

  if (!visit.otpCode) {
    throw new OTPError("OTP not set for this visit");
  }

  if (visit.otpCode !== otpCode) {
    throw new OTPError("Invalid OTP code");
  }

  // Mark visit as completed
  const [updated] = await db
    .update(visits)
    .set({
      status: "completed",
      visitCompleted: true,
      otpVerified: true,
      completedAt: new Date(),
      completionLatitude: geoData?.latitude ?? null,
      completionLongitude: geoData?.longitude ?? null,
      agentLatitude: geoData?.latitude ?? null,
      agentLongitude: geoData?.longitude ?? null,
    })
    .where(eq(visits.id, visitId))
    .returning();

  // Award coins to visit agent
  if (visit.tourId) {
    const tour = await tourService.getTourById(visit.tourId);
    if (tour?.fieldAgentId) {
      try {
        await coinService.awardCoins(tour.fieldAgentId, "visit_completed", visit.id);
      } catch (error) {
        // Log but don't fail the visit completion
        console.error("Failed to award visit completion coins:", error);
      }
    }
  }

  return updated;
}

/**
 * Confirm a visit
 */
export async function confirmVisit(visitId: string): Promise<Visit> {
  const visit = await getVisitById(visitId);
  if (!visit) {
    throw new NotFoundError("Visit", visitId);
  }

  if (visit.visitCanceled) {
    throw new OperationNotAllowedError("Cannot confirm a canceled visit");
  }

  const [updated] = await db
    .update(visits)
    .set({
      visitConfirmed: true,
      confirmedAt: new Date(),
    })
    .where(eq(visits.id, visitId))
    .returning();

  return updated;
}

/**
 * Cancel a visit
 */
export async function cancelVisit(visitId: string, dropReason?: string): Promise<Visit> {
  const visit = await getVisitById(visitId);
  if (!visit) {
    throw new NotFoundError("Visit", visitId);
  }

  if (visit.visitCompleted) {
    throw new OperationNotAllowedError("Cannot cancel a completed visit");
  }

  const [updated] = await db
    .update(visits)
    .set({
      visitCanceled: true,
      canceledAt: new Date(),
      dropReason: dropReason ?? null,
    })
    .where(eq(visits.id, visitId))
    .returning();

  return updated;
}

/**
 * Reschedule a visit (cancels old, creates new)
 */
export async function rescheduleVisit(
  visitId: string,
  newScheduledAt: Date
): Promise<{ oldVisitId: string; newVisitId: string }> {
  const oldVisit = await getVisitById(visitId);
  if (!oldVisit) {
    throw new NotFoundError("Visit", visitId);
  }

  if (oldVisit.visitCompleted) {
    throw new OperationNotAllowedError("Cannot reschedule a completed visit");
  }

  // Cancel old visit
  await db
    .update(visits)
    .set({
      visitCanceled: true,
      canceledAt: new Date(),
    })
    .where(eq(visits.id, visitId));

  // Create new visit
  const [newVisit] = await db
    .insert(visits)
    .values({
      leadId: oldVisit.leadId,
      listingId: oldVisit.listingId,
      tourId: oldVisit.tourId,
      scheduledAt: newScheduledAt,
      rescheduledFromVisitId: visitId,
      rescheduleRequested: true,
      status: "pending",
      otpCode: generateOTP(),
    })
    .returning();

  return {
    oldVisitId: visitId,
    newVisitId: newVisit.id,
  };
}

/**
 * Complete a visit with full data
 */
export async function completeVisit(
  visitId: string,
  data: CompleteVisitData
): Promise<Visit> {
  const visit = await getVisitById(visitId);
  if (!visit) {
    throw new NotFoundError("Visit", visitId);
  }

  if (visit.visitCanceled) {
    throw new OperationNotAllowedError("Cannot complete a canceled visit");
  }

  if (!visit.otpCode) {
    throw new OTPError("OTP not set for this visit");
  }

  if (visit.otpCode !== data.otpCode) {
    throw new OTPError("Invalid OTP code");
  }

  const [updated] = await db
    .update(visits)
    .set({
      visitCompleted: true,
      otpVerified: true,
      completedAt: new Date(),
      completionLatitude: data.location.latitude,
      completionLongitude: data.location.longitude,
      feedbackText: data.feedback?.text ?? null,
      feedbackRating: data.feedback?.rating ?? null,
      buyerScore: data.feedback?.buyerScore?.toString() ?? null,
      primaryPainPoint: data.feedback?.primaryPainPoint ?? null,
      status: "completed",
    })
    .where(eq(visits.id, visitId))
    .returning();

  // Award coins
  if (visit.tourId) {
    const tour = await tourService.getTourById(visit.tourId);
    if (tour?.fieldAgentId) {
      try {
        await coinService.awardCoins(tour.fieldAgentId, "visit_completed", visit.id);
      } catch (error) {
        console.error("Failed to award visit completion coins:", error);
      }
    }
  }

  return updated;
}

/**
 * Get visits by lead
 */
export async function getVisitsByLead(leadId: string): Promise<Visit[]> {
  return db.query.visits.findMany({
    where: eq(visits.leadId, leadId),
    with: {
      listing: {
        with: {
          unit: {
            with: {
              building: true,
            },
          },
        },
      },
      tour: true,
    },
    orderBy: [desc(visits.scheduledAt)],
  });
}

/**
 * Get visits by listing
 */
export async function getVisitsByListing(listingId: string): Promise<Visit[]> {
  return db.query.visits.findMany({
    where: eq(visits.listingId, listingId),
    with: {
      lead: {
        with: {
          profile: true,
        },
      },
      tour: true,
    },
    orderBy: [desc(visits.scheduledAt)],
  });
}

/**
 * Get visit options (scheduled visits for dropdowns)
 */
export async function getVisitOptions(): Promise<
  Array<{ id: string; label: string; scheduledAt: Date | null }>
> {
  const visitList = await db.query.visits.findMany({
    where: and(
      eq(visits.status, "scheduled"),
      isNull(visits.visitCanceled)
    ),
    with: {
      lead: {
        with: {
          profile: true,
        },
      },
      listing: {
        with: {
          unit: {
            with: {
              building: true,
            },
          },
        },
      },
    },
    orderBy: [visits.scheduledAt],
    limit: 100,
  });

  return visitList.map((v) => ({
    id: v.id,
    label: `${v.lead?.profile?.fullName ?? "Unknown"} - ${v.listing?.unit?.building?.name ?? "Unknown"}`,
    scheduledAt: v.scheduledAt,
  }));
}

