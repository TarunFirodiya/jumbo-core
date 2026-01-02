"use client";

import { OffersStats } from "@/components/offers/offers-stats";
import { OffersTable } from "@/components/offers/offers-table";
import { OffersKanban } from "@/components/offers/offers-kanban";
import { PageLayout } from "@/components/shared";
import type { Offer } from "@/services/types";

interface OffersPageContentProps {
  data: Offer[];
  stats: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    countered: number;
  };
}

export function OffersPageContent({ data, stats }: OffersPageContentProps) {
  return (
    <PageLayout
      title="Offers"
      description="Track and manage property offers."
      stats={<OffersStats stats={stats} />}
      tabs={{
        listContent: <OffersTable data={data} />,
        kanbanContent: <OffersKanban data={data} />,
      }}
    />
  );
}

