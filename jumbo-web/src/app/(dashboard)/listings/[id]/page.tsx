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

import { getListingById } from "@/mock-data/listings";

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mockListing = getListingById(id);

  if (!mockListing) {
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

  const listing = {
    id: mockListing.id,
    status: mockListing.status,
    askingPrice: mockListing.askingPrice.toString(),
    description: `A beautiful ${mockListing.bhk} BHK apartment in ${mockListing.buildingName}, ${mockListing.locality}. Features spacious balconies, modern interiors, and premium amenities.`,
    images: mockListing.images,
    amenitiesJson: mockListing.amenities,
    unit: {
      unitNumber: mockListing.unitNumber,
      floorNumber: mockListing.floorNumber,
      bhk: mockListing.bhk,
      carpetArea: mockListing.carpetArea
    },
    building: {
      name: mockListing.buildingName,
      locality: mockListing.locality,
      city: "Bangalore"
    },
    listingAgent: {
      fullName: mockListing.listingAgentName,
      role: "listing_agent",
      email: `${mockListing.listingAgentName.toLowerCase().replace(" ", ".")}@jumbo.com`,
      phone: "+91 98765 43210"
    },
    owner: {
      fullName: mockListing.ownerName,
      email: `${mockListing.ownerName.toLowerCase().replace(" ", ".")}@example.com`,
      phone: mockListing.ownerPhone
    }
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

      <ListingHeader listing={listing} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Media & Main Info) - Spans 2 columns on large screens */}
        <div className="lg:col-span-2 space-y-6">
          <ListingMedia images={listing.images} />
          <ListingInfoTabs listing={listing} />
        </div>

        {/* Right Column (Cards & Actions) - Spans 1 column */}
        <div className="space-y-6 flex flex-col">
          <AgentCard agent={listing.listingAgent} />
          <SellerCard seller={listing.owner} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
              <ListingVisits />
              <ActiveOffers />
          </div>
        </div>
      </div>
    </div>
  );
}
