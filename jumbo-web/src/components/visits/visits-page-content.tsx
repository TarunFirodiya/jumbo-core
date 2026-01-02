"use client";

import { VisitsStats } from "@/components/visits/visits-stats";
import { VisitsTable } from "@/components/visits/visits-table";
import { VisitsKanban } from "@/components/visits/visits-kanban";
import type { VisitFormatted } from "@/app/(dashboard)/visits/page";
import { PageLayout } from "@/components/shared";

interface VisitsPageContentProps {
  data: VisitFormatted[];
  stats: {
    totalVisits: number;
    scheduledVisits: number;
    completedVisits: number;
    pendingVisits: number;
  };
}

export function VisitsPageContent({ data, stats }: VisitsPageContentProps) {
  return (
    <PageLayout
      title="Visits"
      description="Schedule and manage property visits."
      stats={<VisitsStats stats={stats} />}
      tabs={{
        listContent: <VisitsTable data={data} />,
        kanbanContent: <VisitsKanban data={data} />,
      }}
    />
  );
}

