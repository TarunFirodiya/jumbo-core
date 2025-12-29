import { db } from "@/lib/db";
import { visits, listings, units, buildings, leads, profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { VisitDetailView } from "@/components/visits/detail/visit-detail-view";
import type { VisitDetail } from "@/components/visits/detail/visit-detail-view";

export default async function VisitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Validate UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
      return <VisitDetailView visit={null} id={id} />;
  }

  // Fetch visit with relations from DB
  const visitData = await db.query.visits.findFirst({
    where: eq(visits.id, id),
    with: {
        listing: {
            with: {
                unit: {
                    with: {
                        building: true,
                    }
                }
            }
        },
        lead: {
            with: {
                profile: true,
                assignedAgent: true,
            }
        }
    }
  });

  if (!visitData) {
    return <VisitDetailView visit={null} id={id} />;
  }

  // Transform to VisitDetail
  const buildingName = visitData.listing?.unit?.building?.name || "Unknown Building";
  const locality = visitData.listing?.unit?.building?.locality || "";
  const city = visitData.listing?.unit?.building?.city || "";
  const address = [locality, city].filter(Boolean).join(", ");
  const propertyImage = visitData.listing?.images?.[0] || "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&auto=format&fit=crop&q=60";

  const visit: VisitDetail = {
    id: visitData.id,
    property: {
      name: buildingName,
      address: address,
      image: propertyImage,
    },
    dateTime: {
      date: visitData.scheduledAt ? new Date(visitData.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
      time: visitData.scheduledAt ? new Date(visitData.scheduledAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "",
    },
    agent: {
      name: visitData.lead?.assignedAgent?.fullName || "Unassigned",
      image: `https://api.dicebear.com/9.x/avataaars/svg?seed=${visitData.lead?.assignedAgent?.fullName || "Agent"}`,
    },
    client: {
      name: visitData.lead?.profile?.fullName || "Unknown Client",
      type: visitData.lead?.status ? visitData.lead.status.charAt(0).toUpperCase() + visitData.lead.status.slice(1) : "New Lead",
    },
    status: (visitData.status as any) || "Pending",
    feedback: visitData.feedbackText || undefined,
  };

  return <VisitDetailView visit={visit} id={id} />;
}
