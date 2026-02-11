"use client";

import * as React from "react";
import { ListingHeader } from "./listing-header";
import { ListingInfoTabs } from "./listing-info-tabs";
import { AgentCard } from "./agent-card";
import { SellerCard } from "./seller-card";
import { MarkSoldDialog } from "./mark-sold-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, Eye, Tag } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import type { TaskItem } from "@/types";

interface ListingDetailViewProps {
  listing: any;
  agentId: string;
  tasks: TaskItem[];
}

export function ListingDetailView({ listing, agentId, tasks }: ListingDetailViewProps) {
  const [markSoldOpen, setMarkSoldOpen] = React.useState(false);

  const listingAgent = listing.listingAgent
    ? {
        fullName: listing.listingAgent.fullName || "",
        role: listing.listingAgent.role || "listing_agent",
        email: listing.listingAgent.email,
        phone: listing.listingAgent.phone || "",
      }
    : null;

  const owner = listing.unit?.owner
    ? {
        fullName: listing.unit.owner.fullName || "",
        email: listing.unit.owner.email,
        phone: listing.unit.owner.phone || "",
      }
    : null;

  // Quick stats
  const listingCode = listing.listingCode ? `J-${listing.listingCode}` : "—";
  const createdDate = listing.createdAt ? format(new Date(listing.createdAt), "MMM d, yyyy") : "—";
  const publishedDate = listing.publishedAt ? format(new Date(listing.publishedAt), "MMM d, yyyy") : "—";
  const daysOnMarket = listing.publishedAt
    ? differenceInDays(new Date(), new Date(listing.publishedAt))
    : null;
  const totalVisits = listing.visits?.length || 0;
  const totalOffers = listing.offers?.length || 0;

  return (
    <>
      <ListingHeader listing={listing} onMarkSold={() => setMarkSoldOpen(true)} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content (2 cols) */}
        <div className="lg:col-span-2">
          <ListingInfoTabs listing={listing} tasks={tasks} />
        </div>

        {/* Sidebar (1 col) */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Tag className="size-3.5" /> Listing Code
                </span>
                <span className="font-semibold">{listingCode}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" /> Created
                </span>
                <span className="font-medium">{createdDate}</span>
              </div>
              {listing.publishedAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" /> Published
                  </span>
                  <span className="font-medium">{publishedDate}</span>
                </div>
              )}
              {daysOnMarket !== null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="size-3.5" /> Days on Market
                  </span>
                  <span className="font-medium">{daysOnMarket}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Eye className="size-3.5" /> Total Visits
                </span>
                <span className="font-medium">{totalVisits}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Tag className="size-3.5" /> Total Offers
                </span>
                <span className="font-medium">{totalOffers}</span>
              </div>
            </CardContent>
          </Card>

          {listingAgent && <AgentCard agent={listingAgent} />}
          {owner && <SellerCard seller={owner} />}
        </div>
      </div>

      <MarkSoldDialog
        listingId={listing.id}
        open={markSoldOpen}
        onOpenChange={setMarkSoldOpen}
      />
    </>
  );
}
