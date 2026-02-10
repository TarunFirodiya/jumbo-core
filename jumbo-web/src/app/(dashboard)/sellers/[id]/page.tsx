import * as sellerLeadService from "@/services/seller-lead.service";
import { SellerDetailView } from "@/components/sellers/detail/seller-detail-view";
import type { SellerLeadWithRelations } from "@/types";

export default async function SellerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Validate UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return <SellerDetailView sellerLead={null} id={id} />;
  }

  const sellerLead = await sellerLeadService.getSellerLeadById(id);

  if (!sellerLead) {
    return <SellerDetailView sellerLead={null} id={id} />;
  }

  return <SellerDetailView sellerLead={sellerLead as SellerLeadWithRelations} id={id} />;
}
