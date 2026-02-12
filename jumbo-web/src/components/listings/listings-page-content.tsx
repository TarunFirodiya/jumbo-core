"use client";

import * as React from "react";
import { ListingsStats } from "@/components/listings/listings-stats";
import { ListingsMap } from "@/components/listings/listings-map";
import { ListingCard, type ListingCardData } from "@/components/listings/listing-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter } from "lucide-react";
import Link from "next/link";
import type { ListingWithRelations } from "@/types";
import { PageHeader } from "@/components/shared/page-header";
import { PageContentWrapper } from "@/components/shared/page-content-wrapper";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ListingsPageContentProps {
  data: ListingWithRelations[];
  stats: {
    totalListings: number;
    activeListings: number;
    soldThisMonth: number;
    draftListings: number;
  };
}

const statusFilterOptions = [
  { value: "draft", label: "Draft" },
  { value: "inspection_pending", label: "Inspection Pending" },
  { value: "cataloguing_pending", label: "Cataloguing Pending" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On Hold" },
  { value: "inactive", label: "Inactive" },
  { value: "sold", label: "Sold" },
  { value: "delisted", label: "Delisted" },
];

function transformToCardData(listing: ListingWithRelations): ListingCardData {
  const unit = listing.unit;
  const building = unit?.building;
  const agent = (listing as typeof listing & { listingAgent?: { fullName: string | null } | null }).listingAgent;

  const agentName = agent?.fullName || "Unassigned";
  const agentInitials = agent?.fullName
    ? agent.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  return {
    id: listing.id,
    unitNumber: unit?.unitNumber || "N/A",
    buildingName: building?.name || "Unknown Building",
    locality: building?.locality || "Unknown",
    bhk: unit?.bhk || null,
    carpetArea: unit?.carpetArea || null,
    askingPrice: listing.askingPrice,
    status: listing.status || "draft",
    agentName,
    agentInitials,
  };
}

export function ListingsPageContent({ data, stats }: ListingsPageContentProps) {
  const [selectedListingId, setSelectedListingId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const cardListRef = React.useRef<HTMLDivElement>(null);

  const cardData = React.useMemo(() => data.map(transformToCardData), [data]);

  const filteredCards = React.useMemo(() => {
    let filtered = cardData;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.buildingName.toLowerCase().includes(q) ||
          c.unitNumber.toLowerCase().includes(q) ||
          c.locality.toLowerCase().includes(q) ||
          c.agentName.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    return filtered;
  }, [cardData, searchQuery, statusFilter]);

  const handleSelectListing = React.useCallback((id: string) => {
    setSelectedListingId(id);
    // Scroll the card into view
    if (cardListRef.current) {
      const cardEl = cardListRef.current.querySelector(`[data-listing-id="${id}"]`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, []);

  const newListingAction = (
    <Button asChild size="sm" className="hidden sm:flex">
      <Link href="/listings/new">
        <Plus className="size-4 mr-2" />
        New Listing
      </Link>
    </Button>
  );

  return (
    <>
      <PageContentWrapper>
        <PageHeader title="Listings" description="Manage your property inventory and listings." />
        <ListingsStats stats={stats} />

        {/* Split-screen layout */}
        <div className="flex flex-col lg:flex-row gap-0 h-[calc(100vh-280px)]">
          {/* Left pane — search + card list */}
          <div className="w-full lg:w-[420px] lg:shrink-0 h-[50vh] lg:h-full flex flex-col border rounded-lg lg:rounded-r-none overflow-hidden bg-background">
            {/* Search & filter bar */}
            <div className="p-3 border-b space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search listings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {filteredCards.length} listing{filteredCards.length !== 1 ? "s" : ""}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-7 gap-1.5 text-xs",
                        statusFilter !== "all" && "border-accent-blue text-accent-blue"
                      )}
                    >
                      <Filter className="size-3" />
                      Status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={statusFilter === "all"}
                      onCheckedChange={() => setStatusFilter("all")}
                    >
                      All Statuses
                    </DropdownMenuCheckboxItem>
                    {statusFilterOptions.map((opt) => (
                      <DropdownMenuCheckboxItem
                        key={opt.value}
                        checked={statusFilter === opt.value}
                        onCheckedChange={() => setStatusFilter(opt.value)}
                      >
                        {opt.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Scrollable card list */}
            <div ref={cardListRef} className="flex-1 overflow-y-auto p-2 space-y-2">
              {filteredCards.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  No listings match your search.
                </div>
              ) : (
                filteredCards.map((card) => (
                  <div key={card.id} data-listing-id={card.id}>
                    <ListingCard
                      listing={card}
                      isSelected={selectedListingId === card.id}
                      onClick={handleSelectListing}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right pane — map */}
          <div className="flex-1 h-[50vh] lg:h-full lg:border-l-0">
            <ListingsMap
              data={data}
              selectedId={selectedListingId ?? undefined}
              onSelectListing={handleSelectListing}
            />
          </div>
        </div>
      </PageContentWrapper>

      {/* Floating action button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Link href="/listings/new">
          <Button size="icon" className="rounded-full shadow-lg h-14 w-14">
            <Plus className="size-6" />
            <span className="sr-only">New Listing</span>
          </Button>
        </Link>
      </div>
    </>
  );
}
