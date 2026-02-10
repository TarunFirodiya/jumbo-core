import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { logActivity, computeChanges } from "@/lib/audit";
import { createOfferSchema, queryOffersSchema } from "@/lib/validations/offer";
import * as offerService from "@/services/offer.service";

/**
 * GET /api/v1/offers
 * List offers with filtering
 */
export const GET = withAuth<{ data: unknown[] } | { error: string; message: string }>(
  async (request: NextRequest, { user, profile }) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const query = queryOffersSchema.parse({
        listingId: searchParams.get("listingId") || undefined,
        leadId: searchParams.get("leadId") || undefined,
        status: searchParams.get("status") || undefined,
      });

      const page = Number(searchParams.get("page")) || 1;
      const limit = Number(searchParams.get("limit")) || 50;

      const result = await offerService.getOffers({
        listingId: query.listingId,
        leadId: query.leadId,
        status: query.status,
        page,
        limit,
      });

      return NextResponse.json({ data: result.data, pagination: result.pagination });
    } catch (error) {
      console.error("Error fetching offers:", error);
      return NextResponse.json(
        { error: "Internal Server Error", message: "Failed to fetch offers" },
        { status: 500 }
      );
    }
  },
  "offers:read"
);

/**
 * POST /api/v1/offers
 * Create a new offer
 */
export const POST = withAuth<{ data: unknown; message: string } | { error: string; message: string; details?: unknown }>(
  async (request: NextRequest, { user, profile }) => {
    try {
      const body = await request.json();
      const validatedData = createOfferSchema.parse(body);

      const newOffer = await offerService.createOffer({
        listingId: validatedData.listingId,
        leadId: validatedData.leadId,
        offerAmount: validatedData.offerAmount,
        terms: validatedData.terms,
        createdById: user.id,
      });

      await logActivity({
        entityType: "offer",
        entityId: newOffer.id,
        action: "create",
        changes: computeChanges(null, newOffer),
        performedById: user.id,
      });

      const offerWithRelations = await offerService.getOfferById(newOffer.id);

      return NextResponse.json(
        {
          data: offerWithRelations,
          message: "Offer created successfully",
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("Error creating offer:", error);

      if (error instanceof Error && error.name === "ZodError") {
        return NextResponse.json(
          { error: "Validation Error", message: "Invalid request body", details: (error as unknown as { errors: unknown[] }).errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Internal Server Error", message: "Failed to create offer" },
        { status: 500 }
      );
    }
  },
  "offers:create"
);
