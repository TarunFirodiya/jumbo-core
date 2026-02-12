import { OffersPageContent } from "@/components/offers/offers-page-content";
import * as offerService from "@/services/offer.service";

export const dynamic = "force-dynamic";

export default async function OffersPage() {
  // Fetch offers and stats in parallel
  const [offersResult, stats] = await Promise.all([
    offerService.getOffers({ limit: 100 }),
    offerService.getOfferStats(),
  ]);

  return (
    <OffersPageContent
      data={offersResult.data}
      stats={stats}
    />
  );
}
