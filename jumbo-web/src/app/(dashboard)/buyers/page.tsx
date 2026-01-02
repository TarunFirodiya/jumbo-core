import { BuyersPageContent } from "@/components/buyers/buyers-page-content";
import * as leadService from "@/services/lead.service";
import type { LeadWithRelations } from "@/types";
import { startOfMonth } from "date-fns";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { count, ne, gt, sql, and } from "drizzle-orm";

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

  // Fetch data and stats in parallel
  const [leadsResult, activeResult, newResult] = await Promise.all([
    leadService.getLeads({
      page,
      limit,
      status: status && status !== "all" ? status : undefined,
      agentId: agentId && agentId !== "all" ? agentId : undefined,
    }),
    // Get active buyers count
    db.select({ count: count() })
      .from(leads)
      .where(and(sql`${leads.deletedAt} IS NULL`, ne(leads.status, "closed"))),
    // Get new this month count
    db.select({ count: count() })
      .from(leads)
      .where(and(sql`${leads.deletedAt} IS NULL`, gt(leads.createdAt, startOfMonth(new Date())))),
  ]);

  const stats = {
    totalBuyers: leadsResult.pagination.total,
    activeBuyers: activeResult[0].count,
    newThisMonth: newResult[0].count,
  };

  return (
    <BuyersPageContent
      data={leadsResult.data as LeadWithRelations[]}
      pagination={leadsResult.pagination}
      stats={stats}
    />
  );
}
