import { db } from "@/lib/db";
import { sellerLeads } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { SellerDetailView } from "@/components/sellers/detail/seller-detail-view";
import type { SellerLeadWithRelations } from "@/types";

export default async function SellerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Validate UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return <SellerDetailView sellerLead={null} id={id} />;
  }

  const sellerLead = await db.query.sellerLeads.findFirst({
    where: and(
      eq(sellerLeads.id, id),
      sql`${sellerLeads.deletedAt} IS NULL`
    ),
    with: {
      building: true,
      unit: true,
      assignedTo: true,
      referredBy: true,
      createdBy: true,
    },
  });

  if (!sellerLead) {
    return <SellerDetailView sellerLead={null} id={id} />;
  }

  return <SellerDetailView sellerLead={sellerLead as SellerLeadWithRelations} id={id} />;
}
