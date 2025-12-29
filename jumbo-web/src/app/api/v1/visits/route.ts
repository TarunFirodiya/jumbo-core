import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { visits, leads, listings, units, buildings, profiles } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

// Schema for creating a visit
const createVisitSchema = z.object({
  buyerId: z.string().uuid(),
  listingId: z.string().uuid(),
  date: z.string().datetime(), // ISO string from frontend
});

export async function GET() {
  try {
    const allVisits = await db
      .select({
        id: visits.id,
        scheduledAt: visits.scheduledAt,
        status: visits.status,
        listing: {
          id: listings.id,
          askingPrice: listings.askingPrice,
          images: listings.images,
        },
        unit: {
          unitNumber: units.unitNumber,
          bhk: units.bhk,
        },
        building: {
          name: buildings.name,
          locality: buildings.locality,
          city: buildings.city,
        },
        lead: {
          id: leads.id,
          status: leads.status,
        },
        clientProfile: {
          name: profiles.fullName,
        },
        // We'll join agent via lead's assigned agent for now
        agentProfile: {
          name: profiles.fullName,
          // image would be here if we had it in schema, assuming avatar based on name for now
        },
      })
      .from(visits)
      .leftJoin(listings, eq(visits.listingId, listings.id))
      .leftJoin(units, eq(listings.unitId, units.id))
      .leftJoin(buildings, eq(units.buildingId, buildings.id))
      .leftJoin(leads, eq(visits.leadId, leads.id))
      .leftJoin(profiles, eq(leads.profileId, profiles.id)) // Client profile
      // For agent, we need to join profiles again with an alias, but Drizzle join syntax with aliases:
      // We can use the 'leads' relation to get assigned agent.
      // Simpler approach: fetch all and map, or use alias.
      // Let's rely on mapping on client side or simplify the query for now.
      // We can join profiles again for the agent.
      .orderBy(desc(visits.createdAt));

      // To get the agent name, we need another join. Drizzle supports aliasing.
      // However, for simplicity in this step, I will do a basic fetch.
      // Actually, let's try to get the agent info properly.
      // Since leads has assignedAgentId, we can join profiles on that.
      // But we already joined profiles for client.
      
      // Let's refine the query using Drizzle's aliasing if possible or just use a raw query or multiple queries.
      // A common pattern is to just fetch the IDs and names needed.
      
      // Let's rewrite using the query builder relations if setup, but I see relations defined in schema.
      // Using db.query.visits.findMany({...}) is often easier for nested relations.
      
    const visitsWithRelations = await db.query.visits.findMany({
      orderBy: [desc(visits.createdAt)],
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
            profile: true, // Client
            assignedAgent: true, // Agent
          },
        },
      },
    });

    const formattedVisits = visitsWithRelations.map((v) => {
        // Safe access to nested properties
        const buildingName = v.listing?.unit?.building?.name || "Unknown Building";
        const locality = v.listing?.unit?.building?.locality || "";
        const city = v.listing?.unit?.building?.city || "";
        const address = [locality, city].filter(Boolean).join(", ");
        
        // Mocking images if empty, or using first image
        const propertyImage = v.listing?.images?.[0] || "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&auto=format&fit=crop&q=60";
        
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
            iso: v.scheduledAt, // keeping original for sorting if needed
          },
          agent: {
            name: v.lead?.assignedAgent?.fullName || "Unassigned",
            image: `https://api.dicebear.com/9.x/avataaars/svg?seed=${v.lead?.assignedAgent?.fullName || "Agent"}`,
          },
          client: {
            name: v.lead?.profile?.fullName || "Unknown Client",
            type: v.lead?.status || "New Lead",
          },
          status: v.status ? v.status.charAt(0).toUpperCase() + v.status.slice(1) : "Pending", // Capitalize
        };
    });

    return NextResponse.json(formattedVisits);
  } catch (error) {
    console.error("Error fetching visits:", error);
    return NextResponse.json(
      { error: "Failed to fetch visits" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = createVisitSchema.parse(body);

    const newVisit = await db.insert(visits).values({
      leadId: validatedData.buyerId,
      listingId: validatedData.listingId,
      scheduledAt: new Date(validatedData.date),
      status: "pending",
    }).returning();

    return NextResponse.json({ data: newVisit[0] }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.flatten() },
        { status: 400 }
      );
    }
    console.error("Error creating visit:", error);
    return NextResponse.json(
      { error: "Failed to create visit" },
      { status: 500 }
    );
  }
}

