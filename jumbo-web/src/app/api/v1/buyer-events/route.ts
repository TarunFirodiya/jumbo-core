import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buyerEvents } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";
import { logActivity, computeChanges } from "@/lib/audit";
import { z } from "zod";
import { uuidSchema } from "@/lib/validations/common";
import type { Permission } from "@/lib/rbac";

// Create buyer event schema
const createBuyerEventSchema = z.object({
  leadId: uuidSchema,
  profileId: uuidSchema.optional(),
  phone: z.string().optional(),
  leadSource: z.string().optional(),
  sourceListingId: z.string().optional(),
  eventType: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Query buyer events schema
const queryBuyerEventsSchema = z.object({
  leadId: uuidSchema.optional(),
  eventType: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * GET /api/v1/buyer-events
 * List buyer events with filtering
 */
export const GET = withAuth(
  async (request: NextRequest) => {
    try {
      const searchParams = Object.fromEntries(request.nextUrl.searchParams);
      const query = queryBuyerEventsSchema.parse(searchParams);

      const conditions = [];
      if (query.leadId) {
        conditions.push(eq(buyerEvents.leadId, query.leadId));
      }
      if (query.eventType) {
        conditions.push(eq(buyerEvents.eventType, query.eventType));
      }

      const offset = (query.page - 1) * query.limit;

      const [events, countResult] = await Promise.all([
        db.query.buyerEvents.findMany({
          where: conditions.length > 0 ? and(...conditions) : undefined,
          with: {
            lead: {
              with: {
                contact: true,
              },
            },
            profile: true,
            createdBy: true,
          },
          limit: query.limit,
          offset,
          orderBy: [desc(buyerEvents.createdAt)],
        }),
        db
          .select({ count: sql<number>`count(*)` })
          .from(buyerEvents)
          .where(conditions.length > 0 ? and(...conditions) : undefined),
      ]);

      const total = Number(countResult[0]?.count ?? 0);

      return {
        data: events,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      };
    } catch (error) {
      console.error("Error fetching buyer events:", error);
      throw error;
    }
  },
  "buyer_events:read" as Permission
);

/**
 * POST /api/v1/buyer-events
 * Create a new buyer event
 */
export const POST = withAuth<{ data: unknown; message: string } | { error: string; message: string; details?: unknown }>(
  async (request: NextRequest, { user, profile }) => {
    try {
      const body = await request.json();
      const validatedData = createBuyerEventSchema.parse(body);

      const [newEvent] = await db
        .insert(buyerEvents)
        .values({
          ...validatedData,
          createdById: user.id,
        })
        .returning();

      await logActivity({
        entityType: "buyer_event",
        entityId: newEvent.id,
        action: "create",
        changes: computeChanges(null, newEvent),
        performedById: user.id,
      });

      const eventWithRelations = await db.query.buyerEvents.findFirst({
        where: eq(buyerEvents.id, newEvent.id),
        with: {
          lead: {
            with: {
              contact: true,
            },
          },
          profile: true,
          createdBy: true,
        },
      });

      return NextResponse.json(
        {
          data: eventWithRelations,
          message: "Buyer event created successfully",
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("Error creating buyer event:", error);

      if (error instanceof Error && error.name === "ZodError") {
        return NextResponse.json(
          { error: "Validation Error", message: "Invalid request body", details: (error as any).errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Internal Server Error", message: "Failed to create buyer event" },
        { status: 500 }
      );
    }
  },
  "buyer_events:create"
);
