import { VisitsPageContent } from "@/components/visits/visits-page-content";
import * as visitService from "@/services/visit.service";

// Type matching the API response format
export type VisitFormatted = {
  id: string;
  property: {
    name: string;
    address: string;
    image: string;
  };
  dateTime: {
    date: string;
    time: string;
    iso: Date | null;
  };
  agent: {
    name: string;
    image: string;
  };
  client: {
    name: string;
    type: string;
  };
  status: string;
};

export default async function VisitsPage() {
  // Fetch visits using service layer
  const visitsResult = await visitService.getVisits({ limit: 100 });

  // Format visits to match the expected structure
  // Cast to any to work around Drizzle's union type inference for nested relations
  const formattedVisits: VisitFormatted[] = visitsResult.data.map((visit) => {
    const v = visit as any;
    const buildingName = v.listing?.unit?.building?.name || "Unknown Building";
    const locality = v.listing?.unit?.building?.locality || "";
    const city = v.listing?.unit?.building?.city || "";
    const address = [locality, city].filter(Boolean).join(", ");

    const propertyImage = Array.isArray(v.listing?.images) && v.listing.images.length > 0
      ? v.listing.images[0]
      : "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&auto=format&fit=crop&q=60";

    return {
      id: visit.id,
      property: {
        name: buildingName,
        address: address,
        image: propertyImage,
      },
      dateTime: {
        date: visit.scheduledAt ? new Date(visit.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
        time: visit.scheduledAt ? new Date(visit.scheduledAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "",
        iso: visit.scheduledAt,
      },
      agent: {
        name: v.lead?.assignedAgent?.fullName || v.assignedVa?.fullName || "Unassigned",
        image: `https://api.dicebear.com/9.x/avataaars/svg?seed=${v.lead?.assignedAgent?.fullName || v.assignedVa?.fullName || "Agent"}`,
      },
      client: {
        name: v.lead?.contact?.name || "Unknown Client",
        type: v.lead?.status || "New Lead",
      },
      status: visit.status ? visit.status.charAt(0).toUpperCase() + visit.status.slice(1) : "Pending",
    };
  });

  // Calculate stats
  const totalVisits = formattedVisits.length;
  const scheduledVisits = formattedVisits.filter((v) => v.status === "Scheduled").length;
  const completedVisits = formattedVisits.filter((v) => v.status === "Completed").length;
  const pendingVisits = formattedVisits.filter((v) => v.status === "Pending").length;

  const stats = {
    totalVisits,
    scheduledVisits,
    completedVisits,
    pendingVisits,
  };

  return <VisitsPageContent data={formattedVisits} stats={stats} />;
}
