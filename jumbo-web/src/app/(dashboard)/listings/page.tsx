import { ListingsPageContent } from "@/components/listings/listings-page-content";
import { db } from "@/lib/db";
import { listings } from "@/lib/db/schema";
import { desc, isNull } from "drizzle-orm";
import type { ListingWithRelations } from "@/types";

export default async function ListingsPage() {
  // Fetch listings with relations
  const listingsData = await db.query.listings.findMany({
    with: {
      unit: {
        with: {
          building: true,
          owner: true,
        },
      },
      listingAgent: true,
    },
    where: isNull(listings.deletedAt),
    orderBy: [desc(listings.createdAt)],
  });

  // Calculate stats
  const totalListings = listingsData.length;
  const activeListings = listingsData.filter((l) => l.status === "active").length;
  const soldThisMonth = listingsData.filter(
    (l) => l.status === "sold" && l.createdAt && new Date(l.createdAt).getMonth() === new Date().getMonth()
  ).length;
  const draftListings = listingsData.filter((l) => l.status === "draft").length;

  const stats = {
    totalListings,
    activeListings,
    soldThisMonth,
    draftListings,
  };

  return <ListingsPageContent data={listingsData as ListingWithRelations[]} stats={stats} />;
}
