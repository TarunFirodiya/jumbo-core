import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { visits, notes } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { logActivity, computeChanges } from "@/lib/audit";
import {
  updateVisitSchema,
  confirmVisitSchema,
  cancelVisitSchema,
  rescheduleVisitSchema,
  completeVisitSchema,
} from "@/lib/validations/visit";

/**
 * GET /api/v1/visits/[id]
 * Get a single visit by ID with all relations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const visit = await db.query.visits.findFirst({
      where: eq(visits.id, id),
      with: {
        lead: {
          with: {
            profile: true,
            assignedAgent: true,
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
        tour: true,
        assignedVa: true,
        completedBy: true,
        rescheduledFrom: true,
        notes: {
          where: sql`${notes.deletedAt} IS NULL`,
          orderBy: [desc(notes.createdAt)],
          with: {
            createdBy: true,
          },
        },
          communications: {
            limit: 10,
            orderBy: (comm: any, { desc }: any) => [desc(comm.createdAt)],
          },
      },
    });

    if (!visit) {
      return NextResponse.json(
        { error: "Not Found", message: "Visit not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: visit });
  } catch (error) {
    console.error("Error fetching visit:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to fetch visit" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/visits/[id]
 * Update a visit
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

    // Get existing visit
    const existingVisit = await db.query.visits.findFirst({
      where: eq(visits.id, id),
    });

    if (!existingVisit) {
      return NextResponse.json(
        { error: "Not Found", message: "Visit not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateVisitSchema.parse(body);
    
    const updateData: Record<string, unknown> = {};

    // Map all fields from validated data
    if (validatedData.visitorName !== undefined) updateData.visitorName = validatedData.visitorName;
    if (validatedData.homesVisited !== undefined) updateData.homesVisited = validatedData.homesVisited;
    if (validatedData.scheduledAt !== undefined) updateData.scheduledAt = validatedData.scheduledAt;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;
    if (validatedData.visitCompleted !== undefined) updateData.visitCompleted = validatedData.visitCompleted;
    if (validatedData.visitCanceled !== undefined) updateData.visitCanceled = validatedData.visitCanceled;
    if (validatedData.visitConfirmed !== undefined) updateData.visitConfirmed = validatedData.visitConfirmed;
    if (validatedData.dropReason !== undefined) updateData.dropReason = validatedData.dropReason;
    if (validatedData.visitedWith !== undefined) updateData.visitedWith = validatedData.visitedWith;
    if (validatedData.secondaryPhone !== undefined) updateData.secondaryPhone = validatedData.secondaryPhone;
    if (validatedData.visitLocation !== undefined) updateData.visitLocation = validatedData.visitLocation;
    if (validatedData.primaryPainPoint !== undefined) updateData.primaryPainPoint = validatedData.primaryPainPoint;
    if (validatedData.buyerScore !== undefined) updateData.buyerScore = validatedData.buyerScore;
    if (validatedData.rescheduleTime !== undefined) updateData.rescheduleTime = validatedData.rescheduleTime;
    if (validatedData.rescheduleRequested !== undefined) updateData.rescheduleRequested = validatedData.rescheduleRequested;
    if (validatedData.feedbackText !== undefined) updateData.feedbackText = validatedData.feedbackText;
    if (validatedData.feedback !== undefined) updateData.feedback = validatedData.feedback;
    if (validatedData.feedbackRating !== undefined) updateData.feedbackRating = validatedData.feedbackRating;
    if (validatedData.bsaBool !== undefined) updateData.bsaBool = validatedData.bsaBool;

    const [updatedVisit] = await db
      .update(visits)
      .set(updateData)
      .where(eq(visits.id, id))
      .returning();

    // Log the update
    const changes = computeChanges(existingVisit as Record<string, unknown>, updatedVisit as Record<string, unknown>);
    if (changes) {
      await logActivity({
        entityType: "visit",
        entityId: id,
        action: "update",
        changes,
        performedById: user.id,
      });
    }

    const visitWithRelations = await db.query.visits.findFirst({
      where: eq(visits.id, id),
      with: {
        lead: { with: { profile: true } },
        listing: { with: { unit: { with: { building: true } } } },
      },
    });

    return NextResponse.json({
      data: visitWithRelations,
      message: "Visit updated successfully",
    });
  } catch (error) {
    console.error("Error updating visit:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation Error", message: "Invalid request body", details: (error as any).errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to update visit" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/visits/[id]
 * Handle visit workflow actions (confirm, cancel, reschedule, complete)
 */
export async function POST(
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

    const body = await request.json();
    const action = body.action as string;

    // Get existing visit
    const existingVisit = await db.query.visits.findFirst({
      where: eq(visits.id, id),
    });

    if (!existingVisit) {
      return NextResponse.json(
        { error: "Not Found", message: "Visit not found" },
        { status: 404 }
      );
    }

    switch (action) {
      case "confirm": {
        const validatedData = confirmVisitSchema.parse({ visitId: id });
        
        await db
          .update(visits)
          .set({
            visitConfirmed: true,
            confirmedAt: new Date(),
            status: "scheduled",
          })
          .where(eq(visits.id, id));

        await logActivity({
          entityType: "visit",
          entityId: id,
          action: "update",
          changes: { visitConfirmed: { old: false, new: true } },
          performedById: user.id,
        });

        break;
      }

      case "cancel": {
        const validatedData = cancelVisitSchema.parse(body);
        
        await db
          .update(visits)
          .set({
            visitCanceled: true,
            canceledAt: new Date(),
            dropReason: validatedData.dropReason,
            status: "cancelled",
          })
          .where(eq(visits.id, id));

        await logActivity({
          entityType: "visit",
          entityId: id,
          action: "update",
          changes: { 
            visitCanceled: { old: false, new: true },
            dropReason: { old: null, new: validatedData.dropReason },
          },
          performedById: user.id,
        });

        break;
      }

      case "reschedule": {
        const validatedData = rescheduleVisitSchema.parse(body);
        
        // Create new visit
        const [newVisit] = await db
          .insert(visits)
          .values({
            leadId: existingVisit.leadId,
            listingId: existingVisit.listingId,
            scheduledAt: validatedData.newScheduledAt,
            rescheduledFromVisitId: id,
            rescheduleRequested: true,
            status: "pending",
          })
          .returning();

        // Cancel old visit
        await db
          .update(visits)
          .set({
            visitCanceled: true,
            canceledAt: new Date(),
            rescheduleTime: validatedData.newScheduledAt,
            status: "cancelled",
          })
          .where(eq(visits.id, id));

        await logActivity({
          entityType: "visit",
          entityId: id,
          action: "update",
          changes: { 
            visitCanceled: { old: false, new: true },
            rescheduledFromVisitId: { old: null, new: id },
          },
          performedById: user.id,
        });

        const visitWithRelations = await db.query.visits.findFirst({
          where: eq(visits.id, newVisit.id),
          with: {
            lead: { with: { profile: true } },
            listing: { with: { unit: { with: { building: true } } } },
          },
        });

        return NextResponse.json({
          data: visitWithRelations,
          message: "Visit rescheduled successfully",
        });
      }

      case "complete": {
        const validatedData = completeVisitSchema.parse(body);
        
        await db
          .update(visits)
          .set({
            visitCompleted: true,
            completedAt: new Date(),
            completionLatitude: validatedData.location.latitude,
            completionLongitude: validatedData.location.longitude,
            otpVerified: true,
            status: "completed",
            feedback: validatedData.feedback,
            feedbackRating: validatedData.feedbackRating,
            buyerScore: validatedData.buyerScore,
            primaryPainPoint: validatedData.primaryPainPoint,
            completedById: user.id,
          })
          .where(eq(visits.id, id));

        await logActivity({
          entityType: "visit",
          entityId: id,
          action: "update",
          changes: { 
            visitCompleted: { old: false, new: true },
            status: { old: existingVisit.status, new: "completed" },
          },
          performedById: user.id,
        });

        break;
      }

      default:
        return NextResponse.json(
          { error: "Bad Request", message: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    const visitWithRelations = await db.query.visits.findFirst({
      where: eq(visits.id, id),
      with: {
        lead: { with: { profile: true } },
        listing: { with: { unit: { with: { building: true } } } },
      },
    });

    return NextResponse.json({
      data: visitWithRelations,
      message: `Visit ${action}ed successfully`,
    });
  } catch (error) {
    console.error("Error processing visit action:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation Error", message: "Invalid request body", details: (error as any).errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to process visit action" },
      { status: 500 }
    );
  }
}
