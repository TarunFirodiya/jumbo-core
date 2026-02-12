import { BuyersPageContent } from "@/components/buyers/buyers-page-content";
import * as leadService from "@/services/lead.service";

export const dynamic = "force-dynamic";
import type { LeadWithRelations } from "@/types";

export default async function BuyersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;
  const status = params.status as string | undefined;
  const agentId = params.agentId as string | undefined;

  // Fetch data and stats in parallel using services
  const [leadsResult, stats] = await Promise.all([
    leadService.getLeads({
      page,
      limit,
      status: status && status !== "all" ? status : undefined,
      agentId: agentId && agentId !== "all" ? agentId : undefined,
    }),
    leadService.getBuyerStats(),
  ]);

  return (
    <BuyersPageContent
      data={leadsResult.data as LeadWithRelations[]}
      pagination={leadsResult.pagination}
      stats={stats}
    />
  );
}
