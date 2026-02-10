import { ListingHeader } from "@/components/listings/detail/listing-header";
import { ListingMedia } from "@/components/listings/detail/listing-media";
import { AgentCard } from "@/components/listings/detail/agent-card";
import { SellerCard } from "@/components/listings/detail/seller-card";
import { ListingVisits } from "@/components/listings/detail/listing-visits";
import { ActiveOffers } from "@/components/listings/detail/active-offers";
import { ListingInfoTabs } from "@/components/listings/detail/listing-info-tabs";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import * as listingService from "@/services/listing.service";

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Validate UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Invalid Listing ID</h2>
          <p className="text-muted-foreground">The listing ID format is invalid.</p>
          <Button asChild className="mt-4">
            <Link href="/listings">Back to Listings</Link>
          </Button>
        </div>
      </div>
    );
  }

  const listing = await listingService.getListingByIdWithRelations(id);

  if (!listing) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Listing not found</h2>
          <p className="text-muted-foreground">The listing with ID {id} does not exist.</p>
          <Button asChild className="mt-4">
            <Link href="/listings">Back to Listings</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Map service data to component format
  // Cast to any to work around Drizzle's union type inference for one() relations
  // with multiple FK references to the same table (profiles)
  const l = listing as any;
  const listingData = {
    ...listing,
    building: l.unit?.building,
    listingAgent: l.listingAgent ? {
      fullName: l.listingAgent.fullName || "",
      role: l.listingAgent.role || "listing_agent",
      email: l.listingAgent.email,
      phone: l.listingAgent.phone || "",
    } : undefined,
    owner: l.unit?.owner ? {
      fullName: l.unit.owner.fullName || "",
      email: l.unit.owner.email,
      phone: l.unit.owner.phone || "",
    } : undefined,
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      
      {/* Back Navigation */}
      <div>
        <Button variant="ghost" size="sm" asChild className="pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground">
            <Link href="/listings">
                <ChevronLeft className="size-4 mr-1" />
                Back to Listings
            </Link>
        </Button>
      </div>

      <ListingHeader listing={listingData as any} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Media & Main Info) - Spans 2 columns on large screens */}
        <div className="lg:col-span-2 space-y-6">
          <ListingMedia images={(listing.images as string[]) || []} />
          <ListingInfoTabs listing={listingData as any} />
        </div>

        {/* Right Column (Cards & Actions) - Spans 1 column */}
        <div className="space-y-6 flex flex-col">
          {listingData.listingAgent && <AgentCard agent={listingData.listingAgent} />}
          {listingData.owner && <SellerCard seller={listingData.owner} />}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
              <ListingVisits visits={(l.visits || []) as any[]} />
              <ActiveOffers offers={(l.offers || []) as any[]} />
          </div>
        </div>
      </div>
    </div>
  );
}
