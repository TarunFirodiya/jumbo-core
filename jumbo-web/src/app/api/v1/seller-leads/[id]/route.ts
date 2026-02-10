import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sellerLeads } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { logActivity, computeChanges } from "@/lib/audit";
import { updateSellerLeadSchema } from "@/lib/validations/seller";

/**
 * GET /api/v1/seller-leads/[id]
 * Get a single seller lead by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // TEMPORARY BYPASS FOR DEBUGGING
    // if (!user) {
    //   return NextResponse.json(
    //     { error: "Unauthorized", message: "Authentication required" },
    //     { status: 401 }
    //   );
    // }

    const lead = await db.query.sellerLeads.findFirst({
      where: and(
        eq(sellerLeads.id, id),
        sql`${sellerLeads.deletedAt} IS NULL`
      ),
      with: {
        profile: true,
        building: true,
        unit: true,
        assignedTo: true,
        referredBy: true,
        createdBy: true,
        communications: {
          limit: 10,
          orderBy: (comm, { desc }) => [desc(comm.createdAt)],
        },
        tasks: {
          limit: 10,
          orderBy: (task, { desc }) => [desc(task.createdAt)],
        },
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Not Found", message: "Seller lead not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: lead });
  } catch (error) {
    console.error("Error fetching seller lead:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to fetch seller lead" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/seller-leads/[id]
 * Update a seller lead
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // if (!user) {
    //   return NextResponse.json(
    //     { error: "Unauthorized", message: "Authentication required" },
    //     { status: 401 }
    //   );
    // }

    // Get existing lead
    const existingLead = await db.query.sellerLeads.findFirst({
      where: and(
        eq(sellerLeads.id, id),
        sql`${sellerLeads.deletedAt} IS NULL`
      ),
    });

    if (!existingLead) {
      return NextResponse.json(
        { error: "Not Found", message: "Seller lead not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateSellerLeadSchema.parse(body);

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (validatedData.profileId !== undefined) updateData.profileId = validatedData.profileId;
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone;
    if (validatedData.email !== undefined) updateData.email = validatedData.email || null;
    if (validatedData.secondaryPhone !== undefined) updateData.secondaryPhone = validatedData.secondaryPhone;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;
    if (validatedData.source !== undefined) updateData.source = validatedData.source;
    if (validatedData.sourceUrl !== undefined) updateData.sourceUrl = validatedData.sourceUrl || null;
    if (validatedData.sourceListingUrl !== undefined) updateData.sourceListingUrl = validatedData.sourceListingUrl || null;
    if (validatedData.dropReason !== undefined) updateData.dropReason = validatedData.dropReason;
    if (validatedData.referredById !== undefined) updateData.referredById = validatedData.referredById;
    if (validatedData.buildingId !== undefined) updateData.buildingId = validatedData.buildingId;
    if (validatedData.unitId !== undefined) updateData.unitId = validatedData.unitId;
    if (validatedData.assignedToId !== undefined) updateData.assignedToId = validatedData.assignedToId;
    if (validatedData.followUpDate !== undefined) {
      updateData.followUpDate = validatedData.followUpDate ? new Date(validatedData.followUpDate) : null;
    }
    if (validatedData.isNri !== undefined) updateData.isNri = validatedData.isNri;

    const [updatedLead] = await db
      .update(sellerLeads)
      .set(updateData)
      .where(eq(sellerLeads.id, id))
      .returning();

    // Log the update
    const changes = computeChanges(existingLead as Record<string, unknown>, updatedLead as Record<string, unknown>);
    if (changes) {
      await logActivity({
        entityType: "seller_lead",
        entityId: id,
        action: "update",
        changes,
        performedById: user?.id || null,
      });
    }

    return NextResponse.json({
      data: updatedLead,
      message: "Seller lead updated successfully",
    });
  } catch (error) {
    console.error("Error updating seller lead:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation Error", message: "Invalid request body", details: (error as unknown as { errors: unknown[] }).errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to update seller lead" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/seller-leads/[id]
 * Soft delete a seller lead
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // if (!user) {
    //   return NextResponse.json(
    //     { error: "Unauthorized", message: "Authentication required" },
    //     { status: 401 }
    //   );
    // }

    // Check if lead exists
    const existingLead = await db.query.sellerLeads.findFirst({
      where: and(
        eq(sellerLeads.id, id),
        sql`${sellerLeads.deletedAt} IS NULL`
      ),
    });

    if (!existingLead) {
      return NextResponse.json(
        { error: "Not Found", message: "Seller lead not found" },
        { status: 404 }
      );
    }

    // Soft delete
    await db
      .update(sellerLeads)
      .set({ deletedAt: new Date() })
      .where(eq(sellerLeads.id, id));

    // Log the deletion
    await logActivity({
      entityType: "seller_lead",
      entityId: id,
      action: "delete",
      changes: null,
      performedById: user?.id || null,
    });

    return NextResponse.json({
      message: "Seller lead deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting seller lead:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to delete seller lead" },
      { status: 500 }
    );
  }
}
