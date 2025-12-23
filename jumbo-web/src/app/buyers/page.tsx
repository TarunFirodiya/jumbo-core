import { BuyersPageContent } from "@/components/buyers/buyers-page-content";
import { db } from "@/lib/db";
import { leads, profiles } from "@/lib/db/schema";
import { count, desc, eq, and, or, ilike, inArray, ne, gt } from "drizzle-orm";
import type { LeadWithRelations } from "@/types";
import { startOfMonth } from "date-fns";

export default async function BuyersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;
  const offset = (page - 1) * limit;

  const status = params.status as string | undefined;
  const agentId = params.agentId as string | undefined;
  const search = params.search as string | undefined;

  const filters = [];
  
  if (status && status !== "all") {
    filters.push(eq(leads.status, status));
  }

  if (agentId && agentId !== "all") {
    filters.push(eq(leads.assignedAgentId, agentId));
  }

  if (search) {
    const matchingProfiles = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(
        or(
          ilike(profiles.fullName, `%${search}%`),
          ilike(profiles.email, `%${search}%`),
          ilike(profiles.phone, `%${search}%`)
        )
      );
    
    const profileIds = matchingProfiles.map((p) => p.id);
    
    if (profileIds.length > 0) {
      filters.push(inArray(leads.profileId, profileIds));
    } else {
      // No matching profiles found, ensure no results are returned
      filters.push(eq(leads.id, "00000000-0000-0000-0000-000000000000"));
    }
  }

  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  const [data, totalResult, activeResult, newResult] = await Promise.all([
    db.query.leads.findMany({
      with: {
        profile: true,
        assignedAgent: true,
      },
      where: whereClause,
      limit: limit,
      offset: offset,
      orderBy: [desc(leads.createdAt)],
    }),
    db.select({ count: count() })
      .from(leads)
      .where(whereClause),
    db.select({ count: count() })
      .from(leads)
      .where(ne(leads.status, "closed")),
    db.select({ count: count() })
      .from(leads)
      .where(gt(leads.createdAt, startOfMonth(new Date()))),
  ]);
      
  const total = totalResult[0].count;

  const pagination = {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };

  const stats = {
    totalBuyers: total,
    activeBuyers: activeResult[0].count,
    newThisMonth: newResult[0].count,
  };

  return <BuyersPageContent data={data as LeadWithRelations[]} pagination={pagination} stats={stats} />;
}
