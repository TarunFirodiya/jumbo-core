import * as sellerLeadService from "@/services/seller-lead.service";
import * as taskService from "@/services/task.service";
import * as communicationService from "@/services/communication.service";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listings } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { SellerDetailView } from "@/components/sellers/detail/seller-detail-view";
import type { SellerLeadWithRelations } from "@/types";

export default async function SellerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Validate UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return <SellerDetailView sellerLead={null} id={id} agentId="" tasks={[]} communications={[]} listings={[]} />;
  }

  const [sellerLead, { profile }] = await Promise.all([
    sellerLeadService.getSellerLeadById(id),
    requireAuth(),
  ]);

  if (!sellerLead) {
    return <SellerDetailView sellerLead={null} id={id} agentId={profile.id} tasks={[]} communications={[]} listings={[]} />;
  }

  // Fetch tasks, communications, and listings in parallel
  const [tasksData, commsData, listingsData] = await Promise.all([
    taskService.getTasksBySellerLeadId(id),
    communicationService.getCommunicationsBySellerLead(id),
    sellerLead.unitId
      ? db.query.listings.findMany({
          where: and(eq(listings.unitId, sellerLead.unitId), isNull(listings.deletedAt)),
          with: {
            unit: {
              with: {
                building: true,
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

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

  const serializedComms = commsData.map((c: any) => ({
    id: c.id,
    channel: c.channel || "",
    direction: c.direction || "",
    content: c.content || "",
    createdAt: c.createdAt ? new Date(c.createdAt).toLocaleString() : "",
  }));

  return (
    <SellerDetailView
      sellerLead={sellerLead as SellerLeadWithRelations}
      id={id}
      agentId={profile.id}
      tasks={serializedTasks}
      communications={serializedComms}
      listings={listingsData as any}
    />
  );
}
