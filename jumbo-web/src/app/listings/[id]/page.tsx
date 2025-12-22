import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { SidebarProvider } from "@/components/ui/sidebar";
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

// Mock Data (Replace with DB fetch later)
const getListing = async (id: string) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  return {
    id: id,
    status: "active",
    askingPrice: "15000000",
    description: "A beautiful 3 BHK apartment in the heart of Indiranagar. Features spacious balconies, modern interiors, and premium amenities. Close to metro station and parks.",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?q=80&w=1587&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1484154218962-a1c002085d2f?q=80&w=2071&auto=format&fit=crop"
    ],
    amenitiesJson: ["Swimming Pool", "Gym", "24/7 Security", "Power Backup", "Clubhouse", "Children's Play Area"],
    unit: {
      unitNumber: "A-402",
      floorNumber: 4,
      bhk: 3,
      carpetArea: 1850
    },
    building: {
      name: "Prestige Shantiniketan",
      locality: "Whitefield",
      city: "Bangalore"
    },
    listingAgent: {
      fullName: "Rahul Dravid",
      role: "listing_agent",
      email: "rahul.d@jumbo.com",
      phone: "+91 98765 43210"
    },
    owner: {
      fullName: "Amitabh Bachchan",
      email: "amitabh@example.com",
      phone: "+91 99887 76655"
    }
  };
};

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const listing = await getListing(params.id);

  return (
    <SidebarProvider className="bg-sidebar">
      <DashboardSidebar />
      <div className="h-svh overflow-hidden lg:p-2 w-full">
        <div className="lg:border lg:rounded-md overflow-hidden flex flex-col items-center justify-start bg-container h-full w-full bg-background">
          <DashboardHeader />
          <main className="flex-1 w-full overflow-auto p-3 sm:p-6">
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
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
