import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { offers } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { logActivity, computeChanges } from "@/lib/audit";
import { updateOfferSchema, respondToOfferSchema } from "@/lib/validations/offer";

/**
 * GET /api/v1/offers/[id]
 * Get a single offer by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const offer = await db.query.offers.findFirst({
      where: and(
        eq(offers.id, id),
        sql`${offers.deletedAt} IS NULL`
      ),
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
        lead: {
          with: {
            profile: true,
            assignedAgent: true,
          },
        },
        createdBy: true,
      },
    });

    if (!offer) {
      return NextResponse.json(
        { error: "Not Found", message: "Offer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: offer });
  } catch (error) {
    console.error("Error fetching offer:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to fetch offer" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/offers/[id]
 * Update an offer
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

    // Get existing offer
    const existingOffer = await db.query.offers.findFirst({
      where: and(
        eq(offers.id, id),
        sql`${offers.deletedAt} IS NULL`
      ),
    });

    if (!existingOffer) {
      return NextResponse.json(
        { error: "Not Found", message: "Offer not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateOfferSchema.parse(body);
    
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (validatedData.offerAmount !== undefined) updateData.offerAmount = validatedData.offerAmount;
    if (validatedData.terms !== undefined) updateData.terms = validatedData.terms;
    // Allow status updates for kanban drag-and-drop
    if (validatedData.status !== undefined) updateData.status = validatedData.status;

    const [updatedOffer] = await db
      .update(offers)
      .set(updateData)
      .where(eq(offers.id, id))
      .returning();

    // Log the update
    const changes = computeChanges(existingOffer as Record<string, unknown>, updatedOffer as Record<string, unknown>);
    if (changes) {
      await logActivity({
        entityType: "offer",
        entityId: id,
        action: "update",
        changes,
        performedById: user.id,
      });
    }

    const offerWithRelations = await db.query.offers.findFirst({
      where: eq(offers.id, id),
      with: {
        listing: true,
        lead: {
          with: {
            profile: true,
          },
        },
        createdBy: true,
      },
    });

    return NextResponse.json({
      data: offerWithRelations,
      message: "Offer updated successfully",
    });
  } catch (error) {
    console.error("Error updating offer:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation Error", message: "Invalid request body", details: (error as any).errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to update offer" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/offers/[id]
 * Respond to an offer (accept, reject, counter)
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

    // Get existing offer
    const existingOffer = await db.query.offers.findFirst({
      where: and(
        eq(offers.id, id),
        sql`${offers.deletedAt} IS NULL`
      ),
    });

    if (!existingOffer) {
      return NextResponse.json(
        { error: "Not Found", message: "Offer not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = respondToOfferSchema.parse(body);

    const updateData: Record<string, unknown> = {
      status: validatedData.action === "accept" ? "accepted" : validatedData.action === "reject" ? "rejected" : "countered",
      updatedAt: new Date(),
    };

    if (validatedData.action === "counter" && validatedData.counterAmount) {
      // Create a new counter offer
      const [counterOffer] = await db
        .insert(offers)
        .values({
          listingId: existingOffer.listingId,
          leadId: existingOffer.leadId,
          offerAmount: validatedData.counterAmount?.toString(),
          terms: validatedData.terms || existingOffer.terms,
          status: "pending",
          createdById: user.id,
        })
        .returning();

      // Update original offer status
      await db
        .update(offers)
        .set(updateData)
        .where(eq(offers.id, id));

      await logActivity({
        entityType: "offer",
        entityId: id,
        action: "update",
        changes: { status: { old: existingOffer.status, new: updateData.status } },
        performedById: user.id,
      });

      const counterOfferWithRelations = await db.query.offers.findFirst({
        where: eq(offers.id, counterOffer.id),
        with: {
          listing: true,
          lead: {
            with: {
              profile: true,
            },
          },
          createdBy: true,
        },
      });

      return NextResponse.json({
        data: counterOfferWithRelations,
        message: "Counter offer created successfully",
      });
    } else {
      // Accept or reject
      await db
        .update(offers)
        .set(updateData)
        .where(eq(offers.id, id));

      await logActivity({
        entityType: "offer",
        entityId: id,
        action: "update",
        changes: { status: { old: existingOffer.status, new: updateData.status } },
        performedById: user.id,
      });

      const offerWithRelations = await db.query.offers.findFirst({
        where: eq(offers.id, id),
        with: {
          listing: true,
          lead: {
            with: {
              profile: true,
            },
          },
          createdBy: true,
        },
      });

      return NextResponse.json({
        data: offerWithRelations,
        message: `Offer ${validatedData.action}ed successfully`,
      });
    }
  } catch (error) {
    console.error("Error responding to offer:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation Error", message: "Invalid request body", details: (error as any).errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to process offer response" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/offers/[id]
 * Soft delete an offer
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

    // Check if offer exists
    const existingOffer = await db.query.offers.findFirst({
      where: and(
        eq(offers.id, id),
        sql`${offers.deletedAt} IS NULL`
      ),
    });

    if (!existingOffer) {
      return NextResponse.json(
        { error: "Not Found", message: "Offer not found" },
        { status: 404 }
      );
    }

    // Soft delete
    await db
      .update(offers)
      .set({ deletedAt: new Date() })
      .where(eq(offers.id, id));

    // Log the deletion
    await logActivity({
      entityType: "offer",
      entityId: id,
      action: "delete",
      changes: null,
      performedById: user.id,
    });

    return NextResponse.json({
      message: "Offer deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting offer:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to delete offer" },
      { status: 500 }
    );
  }
}
