import * as leadService from "@/services/lead.service";
import * as taskService from "@/services/task.service";
import { requireAuth } from "@/lib/auth";
import { BuyerDetailView } from "@/components/buyers/detail/buyer-detail-view";
import type { BuyerDetail } from "@/components/buyers/detail/buyer-detail-view";

export const dynamic = 'force-dynamic';

export default async function BuyerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return <BuyerDetailView buyer={null} id={id} agentId="" tasks={[]} />;
  }

  const [lead, { profile }] = await Promise.all([
    leadService.getLeadByIdWithRelations(id),
    requireAuth(),
  ]);

  if (!lead) {
     return <BuyerDetailView buyer={null} id={id} agentId={profile.id} tasks={[]} />;
  }

  const tasksData = await taskService.getTasksByLeadId(id);

  const contact = Array.isArray(lead.contact) ? lead.contact[0] : lead.contact;
  const assignedAgent = Array.isArray(lead.assignedAgent) ? lead.assignedAgent[0] : lead.assignedAgent;
  const createdByAgent = (lead as any).createdBy;

  const reqJson = (lead.requirementJson ?? {}) as Record<string, unknown>;
  const prefJson = (lead.preferenceJson ?? {}) as Record<string, unknown>;

  const formatDate = (d: Date | string | null | undefined) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

  const buyer: BuyerDetail = {
    id: lead.id,
    name: contact?.name || "Unknown",
    status: lead.status || "new",
    addedDate: formatDate(lead.createdAt),

    contact: {
      mobile: contact?.phone || "",
      email: contact?.email || "",
      whatsapp: contact?.phone || "",
    },

    source: lead.source || "",
    locality: lead.locality || "",
    zone: lead.zone || "",
    pipeline: lead.pipeline ?? false,
    dropReason: lead.dropReason || "",
    referredBy: lead.referredBy || "",
    lastContactedAt: formatDate(lead.lastContactedAt),

    meta: {
      leadId: lead.leadId || "",
      externalId: lead.externalId || "",
      sourceListingId: lead.sourceListingId || "",
      testListingId: lead.testListingId || "",
      createdBy: createdByAgent?.fullName || "",
      updatedAt: formatDate(lead.updatedAt),
      createdAt: formatDate(lead.createdAt),
    },

    assignedAgent: {
      name: assignedAgent?.fullName || "Unassigned",
      avatar: undefined,
      initials: assignedAgent?.fullName?.split(" ").map((n: string) => n[0]).join("") || "??",
    },

    requirements: {
      budgetMin: (reqJson.budget_min as number) ?? null,
      budgetMax: (reqJson.budget_max as number) ?? null,
      bhk: (reqJson.bhk as number[]) ?? [],
      localities: (reqJson.localities as string[]) ?? [],
    },

    preferences: {
      configuration: (prefJson.configuration as string[]) ?? [],
      maxCap: (prefJson.max_cap as string) ?? "",
      landmark: (prefJson.landmark as string) ?? "",
      propertyType: (prefJson.property_type as string) ?? "",
      floorPreference: (prefJson.floor_preference as string) ?? "",
      khata: (prefJson.khata as string) ?? "",
      mainDoorFacing: (prefJson.main_door_facing as string) ?? "",
      mustHaves: (prefJson.must_haves as string[]) ?? [],
      buyReason: (prefJson.buy_reason as string) ?? "",
      preferredBuildings: (prefJson.preferred_buildings as string[]) ?? [],
    },

    visits: (lead.visits ?? []).map((v: any) => ({
      id: v.id,
      scheduledAt: v.scheduledAt ? new Date(v.scheduledAt).toLocaleString() : "",
      status: v.status || v.visitStatus || "pending",
      listingId: v.listingId || "",
      visitorName: v.visitorName || "",
      feedbackRating: v.feedbackRating ?? null,
      assignedVaName: v.assignedVa?.fullName || "",
    })),

    communications: (lead.communications ?? []).map((c: any) => ({
      id: c.id,
      channel: c.channel || "",
      direction: c.direction || "",
      content: c.content || "",
      createdAt: c.createdAt ? new Date(c.createdAt).toLocaleString() : "",
    })),

    activityLog: [
      {
        type: "lead",
        title: "Lead Created",
        date: lead.createdAt ? new Date(lead.createdAt).toLocaleString() : "",
        description: `Imported from ${lead.source || "Unknown"}.`,
        iconName: "userPlus",
      },
    ],
  };

  const serializedTasks = tasksData.map((t: any) => ({
    id: t.id,
    title: t.title,
    description: t.description || "",
    priority: t.priority || "medium",
    status: t.status || "open",
    dueAt: t.dueAt ? new Date(t.dueAt).toISOString() : null,
    completedAt: t.completedAt ? new Date(t.completedAt).toISOString() : null,
    creatorName: t.creator?.fullName || "",
    assigneeName: t.assignee?.fullName || "",
  }));

  return <BuyerDetailView buyer={buyer} id={id} agentId={profile.id} tasks={serializedTasks} />;
}
