import { SellersPageContent } from "@/components/sellers/sellers-page-content";
import * as sellerLeadService from "@/services/seller-lead.service";

export const dynamic = "force-dynamic";
import type { SellerStats } from "@/types";

export default async function SellersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 50;
  const status = params.status as string | undefined;

  // Fetch data and stats in parallel
  const [leadsResult, stats] = await Promise.all([
    sellerLeadService.getSellerLeads({
      page,
      limit,
      status: status && status !== "all" ? status : undefined,
    }),
    sellerLeadService.getSellerDashboardStats(),
  ]);

  return (
    <SellersPageContent
      data={leadsResult.data}
      pagination={leadsResult.pagination}
      stats={stats}
    />
  );
}
