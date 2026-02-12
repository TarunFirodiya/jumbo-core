import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { createVisitRequestSchema } from "@/lib/validations/visit";
import * as visitService from "@/services/visit.service";
import * as lifecycleService from "@/services/lead-lifecycle.service";

export const GET = withAuth(
  async (request: NextRequest, { profile }) => {
    try {
      const result = await visitService.getVisits({});

      const formattedVisits = result.data.map((v) => {
        // Type-safe access with explicit types
        const visit = v as typeof v & {
          listing?: {
            unit?: {
              building?: {
                name: string;
                locality: string | null;
                city: string | null;
              };
            };
            images?: string[];
          };
          lead?: {
            assignedAgent?: { fullName: string };
            contact?: { name: string };
            status?: string;
          };
        };

        // Safe access to nested properties
        const buildingName = visit.listing?.unit?.building?.name || "Unknown Building";
        const locality = visit.listing?.unit?.building?.locality || "";
        const city = visit.listing?.unit?.building?.city || "";
        const address = [locality, city].filter(Boolean).join(", ");
        
        // Mocking images if empty, or using first image
        const propertyImage = visit.listing?.images?.[0] || "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&auto=format&fit=crop&q=60";
        
        return {
          id: v.id,
          property: {
            name: buildingName,
            address: address,
            image: propertyImage,
          },
          dateTime: {
            date: v.scheduledAt ? new Date(v.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
            time: v.scheduledAt ? new Date(v.scheduledAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "",
            iso: v.scheduledAt,
          },
          agent: {
            name: visit.lead?.assignedAgent?.fullName || "Unassigned",
            image: `https://api.dicebear.com/9.x/avataaars/svg?seed=${visit.lead?.assignedAgent?.fullName || "Agent"}`,
          },
          client: {
            name: visit.lead?.contact?.name || "Unknown Client",
            type: visit.lead?.status || "New Lead",
          },
          status: v.status ? v.status.charAt(0).toUpperCase() + v.status.slice(1) : "Pending",
        };
      });

      return formattedVisits;
    } catch (error) {
      console.error("Error fetching visits:", error);
      throw error;
    }
  },
  "visits:read"
);

export const POST = withAuth<{ data: unknown } | { error: string; details?: unknown }>(
  async (request: NextRequest, { user, profile }) => {
    try {
      const body = await request.json();
      const validatedData = createVisitRequestSchema.parse(body);

      const visit = await visitService.createVisit({
        leadId: validatedData.leadId,
        listingId: validatedData.listingId,
        scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : null,
        tourId: validatedData.tourId || null,
        status: "scheduled",
      });

      // Transition lead to ACTIVE_VISITOR on visit creation
      if (validatedData.leadId) {
        lifecycleService.onVisitCreated(validatedData.leadId).catch((err) =>
          console.error("Failed to update lifecycle stage on visit creation:", err)
        );
      }

      return NextResponse.json({ data: visit }, { status: 201 });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return NextResponse.json(
          { error: "Validation failed", details: (error as unknown as { flatten: () => unknown }).flatten() },
          { status: 400 }
        );
      }
      console.error("Error creating visit:", error);
      throw error;
    }
  },
  "visits:create"
);
