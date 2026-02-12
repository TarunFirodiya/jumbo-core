import { ListingsPageContent } from "@/components/listings/listings-page-content";
import * as listingService from "@/services/listing.service";

export const dynamic = "force-dynamic";
import type { ListingWithRelations } from "@/types";
import { startOfMonth } from "date-fns";

export default async function ListingsPage() {
  // Fetch listings using service layer
  const listingsResult = await listingService.getListings({ limit: 100 });

  // Calculate stats
  const totalListings = listingsResult.pagination.total;
  const activeListings = listingsResult.data.filter((l) => l.status === "active").length;
  const soldThisMonth = listingsResult.data.filter(
    (l) => l.status === "sold" && l.createdAt && new Date(l.createdAt) >= startOfMonth(new Date())
  ).length;
  const draftListings = listingsResult.data.filter((l) => l.status === "draft").length;

  const stats = {
    totalListings,
    activeListings,
    soldThisMonth,
    draftListings,
  };

  return <ListingsPageContent data={listingsResult.data as ListingWithRelations[]} stats={stats} />;
}
