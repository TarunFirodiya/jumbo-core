"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin } from "lucide-react";
import { cn, formatINR } from "@/lib/utils";

// Status labels and colors (shared with listings-table / listings-map)
const statusLabels: Record<string, string> = {
  draft: "Draft",
  inspection_pending: "Inspection Pending",
  cataloguing_pending: "Cataloguing Pending",
  active: "Active",
  on_hold: "On Hold",
  inactive: "Inactive",
  sold: "Sold",
  delisted: "Delisted",
};

const statusColors: Record<string, { bg: string; text: string }> = {
  draft: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400" },
  inspection_pending: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" },
  cataloguing_pending: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400" },
  active: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400" },
  on_hold: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400" },
  inactive: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400" },
  sold: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
  delisted: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
};

export interface ListingCardData {
  id: string;
  unitNumber: string;
  buildingName: string;
  locality: string;
  bhk: number | null;
  carpetArea: number | null;
  askingPrice: string | null;
  status: string;
  agentName: string;
  agentInitials: string;
}

interface ListingCardProps {
  listing: ListingCardData;
  isSelected: boolean;
  onClick: (id: string) => void;
}

export function ListingCard({ listing, isSelected, onClick }: ListingCardProps) {
  const statusColor = statusColors[listing.status] || statusColors.draft;
  const statusLabel = statusLabels[listing.status] || listing.status;

  return (
    <div
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-all hover:bg-muted/50",
        isSelected
          ? "ring-2 ring-accent-green border-accent-green bg-muted/30"
          : "border-border"
      )}
      onClick={() => onClick(listing.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Link
            href={`/listings/${listing.id}`}
            className="font-medium text-sm hover:underline block truncate"
            onClick={(e) => e.stopPropagation()}
          >
            {listing.unitNumber} &bull; {listing.buildingName}
          </Link>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">{listing.locality}</span>
          </div>
        </div>
        <Badge
          variant="secondary"
          className={cn(
            "font-medium text-[10px] whitespace-nowrap shrink-0",
            statusColor.bg,
            statusColor.text
          )}
        >
          {statusLabel}
        </Badge>
      </div>

      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
        {listing.bhk && <span>{listing.bhk} BHK</span>}
        {listing.carpetArea && <span>{listing.carpetArea} sqft</span>}
        {listing.askingPrice && (
          <span className="font-medium text-foreground">
            {formatINR(listing.askingPrice)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2">
        <Avatar className="size-5 bg-muted">
          <AvatarFallback className="text-[9px] font-extrabold text-muted-foreground uppercase">
            {listing.agentInitials}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs text-muted-foreground truncate">
          {listing.agentName}
        </span>
      </div>
    </div>
  );
}
