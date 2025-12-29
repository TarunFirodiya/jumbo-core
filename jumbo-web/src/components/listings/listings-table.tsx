"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Eye, Pencil, Trash2, MapPin } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { cn, formatINR } from "@/lib/utils";
import type { ListingWithRelations } from "@/types";

// Status labels and colors
const statusLabels: Record<string, string> = {
  draft: "Draft",
  inspection_pending: "Inspection Pending",
  active: "Active",
  inactive: "Inactive",
  sold: "Sold",
};

const statusColors: Record<string, { bg: string; text: string }> = {
  draft: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400" },
  inspection_pending: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" },
  active: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400" },
  inactive: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400" },
  sold: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
};

// Transform DB listing to table format
type TableListing = {
  id: string;
  unitNumber: string;
  buildingName: string;
  locality: string;
  bhk: number | null;
  carpetArea: number | null;
  askingPrice: string | null;
  status: string;
  listingAgentName: string;
  listingAgentInitials: string;
  createdAt: Date | null;
};

function transformListing(listing: ListingWithRelations): TableListing {
  const unit = listing.unit;
  const building = unit?.building;
  const agent = listing.listingAgent;
  
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
    listingAgentName: agentName,
    listingAgentInitials: agentInitials,
    createdAt: listing.createdAt,
  };
}

interface ListingsTableProps {
  data: ListingWithRelations[];
}

const columns: ColumnDef<TableListing>[] = [
  {
    accessorKey: "property",
    header: "Property",
    cell: ({ row }) => {
      const listing = row.original;
      return (
        <div className="flex flex-col">
          <Link href={`/listings/${listing.id}`} className="font-medium truncate hover:underline block">
            {listing.unitNumber} • {listing.buildingName}
          </Link>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">{listing.locality}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "details",
    header: "Details",
    cell: ({ row }) => {
      const listing = row.original;
      return (
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          {listing.bhk && <span>{listing.bhk} BHK</span>}
          {listing.bhk && listing.carpetArea && <span>•</span>}
          {listing.carpetArea && <span>{listing.carpetArea} sqft</span>}
          {!listing.bhk && !listing.carpetArea && <span className="text-muted-foreground/50">-</span>}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const color = statusColors[status] || statusColors.draft;
      const label = statusLabels[status] || status;
      return (
        <Badge variant="secondary" className={cn("font-medium text-xs whitespace-nowrap", color.bg, color.text)}>
          {label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Age",
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date | null;
      if (!date) return <div className="text-muted-foreground">-</div>;
      return (
        <div className="text-muted-foreground tabular-nums whitespace-nowrap">
          {formatDistanceToNow(date, { addSuffix: true })}
        </div>
      );
    },
  },
  {
    accessorKey: "askingPrice",
    header: "Price",
    cell: ({ row }) => {
      const price = row.getValue("askingPrice") as string | null;
      if (!price) return <div className="text-muted-foreground">-</div>;
      return (
        <div className="text-muted-foreground tabular-nums font-medium whitespace-nowrap">
          {formatINR(price)}
        </div>
      );
    },
  },
  {
    accessorKey: "listingAgentName",
    header: "Agent",
    cell: ({ row }) => {
      const listing = row.original;
      return (
        <div className="flex items-center gap-2">
          <Avatar className="size-6 bg-muted">
            <AvatarFallback className="text-[10px] font-extrabold text-muted-foreground uppercase">
              {listing.listingAgentInitials}
            </AvatarFallback>
          </Avatar>
          <span className="text-muted-foreground text-sm truncate">{listing.listingAgentName}</span>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/listings/${row.original.id}`} className="flex items-center">
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Listing
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function ListingsTable({ data }: ListingsTableProps) {
  const transformedData = React.useMemo(() => data.map(transformListing), [data]);
  return <DataTable columns={columns} data={transformedData} filterColumn="property" />;
}
