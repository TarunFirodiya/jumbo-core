"use client";

import { ListingsStats } from "@/components/listings/listings-stats";
import { ListingsTable } from "@/components/listings/listings-table";
import { ListingsKanban } from "@/components/listings/listings-kanban";
import { ListingsMap } from "@/components/listings/listings-map";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import type { ListingWithRelations } from "@/types";
import { PageLayout } from "@/components/shared";

interface ListingsPageContentProps {
  data: ListingWithRelations[];
  stats: {
    totalListings: number;
    activeListings: number;
    soldThisMonth: number;
    draftListings: number;
  };
}

export function ListingsPageContent({ data, stats }: ListingsPageContentProps) {
  const newListingAction = (
    <Button asChild size="sm" className="hidden sm:flex">
      <Link href="/listings/new">
        <Plus className="size-4 mr-2" />
        New Listing
      </Link>
    </Button>
  );

  return (
    <PageLayout
      title="Listings"
      description="Manage your property inventory and listings."
      action={newListingAction}
      stats={<ListingsStats stats={stats} />}
      tabs={{
        listContent: <ListingsTable data={data} />,
        kanbanContent: <ListingsKanban data={data} />,
        mapContent: <ListingsMap data={data} />,
      }}
    />
  );
}

