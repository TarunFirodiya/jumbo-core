import * as visitService from "@/services/visit.service";
import { VisitDetailView } from "@/components/visits/detail/visit-detail-view";
import type { VisitDetailData } from "@/components/visits/detail/visit-detail-view";

export default async function VisitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Validate UUID
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return <VisitDetailView visit={null} id={id} />;
  }

  // Fetch visit with relations using service
  const visitData = await visitService.getVisitById(id);

  if (!visitData) {
    return <VisitDetailView visit={null} id={id} />;
  }

  // Cast to any to work around Drizzle's union type inference for nested relations
  const v = visitData as any;

  // Build property/listing info
  const buildingName =
    v.listing?.unit?.building?.name || "Unknown Building";
  const unitNumber = v.listing?.unit?.unitNumber || "";
  const locality = v.listing?.unit?.building?.locality || "";
  const city = v.listing?.unit?.building?.city || "";
  const address = [locality, city].filter(Boolean).join(", ");
  const propertyImage =
    v.listing?.images?.[0] ||
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&auto=format&fit=crop&q=60";
  const listingPrice = v.listing?.askingPrice
    ? Number(v.listing.askingPrice)
    : null;
  const buildingLat = v.listing?.unit?.building?.latitude;
  const buildingLng = v.listing?.unit?.building?.longitude;

  // Build buyer info
  const buyerName = v.lead?.contact?.name || "Unknown Client";
  const buyerPhone = v.lead?.contact?.phone || null;
  const buyerEmail = v.lead?.contact?.email || null;
  const buyerBudgetMin = v.lead?.budgetMin ? Number(v.lead.budgetMin) : null;
  const buyerBudgetMax = v.lead?.budgetMax ? Number(v.lead.budgetMax) : null;

  // Build agent info
  const agentName =
    v.lead?.assignedAgent?.fullName ||
    v.tour?.fieldAgent?.fullName ||
    "Unassigned";
  const agentPhone = v.lead?.assignedAgent?.phone || v.tour?.fieldAgent?.phone || null;

  // Determine display status: map DB status to the workflow states
  function mapStatus(
    status: string | null,
    confirmed: boolean,
    completed: boolean,
    cancelled: boolean
  ): "scheduled" | "confirmed" | "completed" | "cancelled" {
    if (cancelled) return "cancelled";
    if (completed) return "completed";
    if (confirmed || status === "confirmed") return "confirmed";
    return "scheduled";
  }

  const displayStatus = mapStatus(
    visitData.status,
    !!visitData.visitConfirmed,
    !!visitData.visitCompleted,
    !!visitData.visitCanceled
  );

  const visit: VisitDetailData = {
    id: visitData.id,
    status: displayStatus,
    scheduledAt: visitData.scheduledAt
      ? new Date(visitData.scheduledAt).toISOString()
      : null,
    // Buyer
    buyer: {
      name: buyerName,
      phone: buyerPhone,
      email: buyerEmail,
      budgetMin: buyerBudgetMin,
      budgetMax: buyerBudgetMax,
      leadId: visitData.leadId || null,
    },
    // Listing
    listing: {
      title: [buildingName, unitNumber].filter(Boolean).join(" - "),
      address,
      image: propertyImage,
      price: listingPrice,
      listingId: visitData.listingId || null,
      mapUrl:
        buildingLat && buildingLng
          ? `https://www.google.com/maps?q=${buildingLat},${buildingLng}`
          : null,
    },
    // Agent
    agent: {
      name: agentName,
      phone: agentPhone,
      avatarUrl: `https://api.dicebear.com/9.x/avataaars/svg?seed=${agentName}`,
    },
    // Visit workflow fields
    otpVerified: !!visitData.otpVerified,
    otpCode: visitData.otpCode || null,
    checkInLat: visitData.completionLatitude
      ? Number(visitData.completionLatitude)
      : null,
    checkInLng: visitData.completionLongitude
      ? Number(visitData.completionLongitude)
      : null,
    feedbackRating: visitData.feedbackRating ?? null,
    feedbackText: visitData.feedbackText || null,
    cancellationReason: visitData.dropReason || null,
    completedAt: visitData.completedAt
      ? new Date(visitData.completedAt).toISOString()
      : null,
    confirmedAt: visitData.confirmedAt
      ? new Date(visitData.confirmedAt).toISOString()
      : null,
    cancelledAt: visitData.canceledAt
      ? new Date(visitData.canceledAt).toISOString()
      : null,
  };

  return <VisitDetailView visit={visit} id={id} />;
}
