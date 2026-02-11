"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Send,
  CheckCircle,
  ClipboardCheck,
  Camera,
  Rocket,
  Pause,
  Play,
  DollarSign,
  Edit,
  Share2,
  ShieldCheck,
} from "lucide-react";
import { updateListingStatus } from "@/lib/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { ListingStatus } from "@/types";

interface ListingHeaderProps {
  listing: {
    id: string;
    status: string | null;
    listingCode: number | null;
    tier: string | null;
    isVerified: boolean | null;
    unit?: {
      unitNumber: string | null;
      bhk: number | null;
      building: {
        name: string | null;
        locality: string | null;
        city: string | null;
      } | null;
    } | null;
  };
  onMarkSold: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-300",
  proposal_sent: "bg-blue-100 text-blue-700 border-blue-300",
  proposal_accepted: "bg-indigo-100 text-indigo-700 border-indigo-300",
  inspection_pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
  catalogue_pending: "bg-orange-100 text-orange-700 border-orange-300",
  live: "bg-green-100 text-green-700 border-green-300",
  on_hold: "bg-red-100 text-red-700 border-red-300",
  sold: "bg-purple-100 text-purple-700 border-purple-300",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  proposal_sent: "Proposal Sent",
  proposal_accepted: "Proposal Accepted",
  inspection_pending: "Inspection Pending",
  catalogue_pending: "Catalogue Pending",
  live: "Live",
  on_hold: "On Hold",
  sold: "Sold",
};

const TIER_COLORS: Record<string, string> = {
  reserve: "bg-purple-100 text-purple-700 border-purple-300",
  cash_plus: "bg-amber-100 text-amber-700 border-amber-300",
  lite: "bg-blue-100 text-blue-700 border-blue-300",
};

const TIER_LABELS: Record<string, string> = {
  reserve: "Reserve",
  cash_plus: "Cash+",
  lite: "Lite",
};

export function ListingHeader({ listing, onMarkSold }: ListingHeaderProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = React.useState(false);
  const status = (listing.status || "draft") as ListingStatus;

  const buildingName = listing.unit?.building?.name || "Unknown Building";
  const unitNo = listing.unit?.unitNumber || "";
  const codeDisplay = listing.listingCode ? `J-${listing.listingCode}` : "";

  const title = [buildingName, unitNo ? `- ${unitNo}` : "", codeDisplay ? `(${codeDisplay})` : ""]
    .filter(Boolean)
    .join(" ");

  async function handleStatusChange(newStatus: string) {
    setIsUpdating(true);
    try {
      const result = await updateListingStatus(listing.id, { status: newStatus as ListingStatus });
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  }

  function renderActions() {
    const actions: React.ReactNode[] = [];

    switch (status) {
      case "draft":
        actions.push(
          <Button key="send" size="sm" onClick={() => handleStatusChange("proposal_sent")} disabled={isUpdating}>
            <Send className="size-4 mr-1.5" />
            Send Proposal
          </Button>
        );
        actions.push(
          <Button key="edit" variant="outline" size="sm" asChild>
            <a href={`/listings/${listing.id}/edit`}><Edit className="size-4 mr-1.5" />Edit</a>
          </Button>
        );
        break;
      case "proposal_sent":
        actions.push(
          <Button key="accept" size="sm" onClick={() => handleStatusChange("proposal_accepted")} disabled={isUpdating}>
            <CheckCircle className="size-4 mr-1.5" />
            Mark Accepted
          </Button>
        );
        actions.push(
          <Button key="edit" variant="outline" size="sm" asChild>
            <a href={`/listings/${listing.id}/edit`}><Edit className="size-4 mr-1.5" />Edit</a>
          </Button>
        );
        break;
      case "proposal_accepted":
        actions.push(
          <Button key="inspect" size="sm" onClick={() => handleStatusChange("inspection_pending")} disabled={isUpdating}>
            <ClipboardCheck className="size-4 mr-1.5" />
            Schedule Inspection
          </Button>
        );
        actions.push(
          <Button key="edit" variant="outline" size="sm" asChild>
            <a href={`/listings/${listing.id}/edit`}><Edit className="size-4 mr-1.5" />Edit</a>
          </Button>
        );
        break;
      case "inspection_pending":
        actions.push(
          <Button key="catalogue" size="sm" onClick={() => handleStatusChange("catalogue_pending")} disabled={isUpdating}>
            <Camera className="size-4 mr-1.5" />
            Start Cataloguing
          </Button>
        );
        break;
      case "catalogue_pending":
        actions.push(
          <Button key="live" size="sm" onClick={() => handleStatusChange("live")} disabled={isUpdating}>
            <Rocket className="size-4 mr-1.5" />
            Go Live
          </Button>
        );
        break;
      case "live":
        actions.push(
          <Button key="hold" variant="outline" size="sm" onClick={() => handleStatusChange("on_hold")} disabled={isUpdating}>
            <Pause className="size-4 mr-1.5" />
            Put On Hold
          </Button>
        );
        actions.push(
          <Button key="sold" size="sm" variant="default" onClick={onMarkSold} disabled={isUpdating}>
            <DollarSign className="size-4 mr-1.5" />
            Mark Sold
          </Button>
        );
        actions.push(
          <Button key="share" variant="outline" size="sm">
            <Share2 className="size-4 mr-1.5" />
            Share
          </Button>
        );
        break;
      case "on_hold":
        actions.push(
          <Button key="resume" size="sm" onClick={() => handleStatusChange("live")} disabled={isUpdating}>
            <Play className="size-4 mr-1.5" />
            Resume (Go Live)
          </Button>
        );
        actions.push(
          <Button key="edit" variant="outline" size="sm" asChild>
            <a href={`/listings/${listing.id}/edit`}><Edit className="size-4 mr-1.5" />Edit</a>
          </Button>
        );
        break;
      case "sold":
        // read-only
        break;
    }

    return actions;
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge className={STATUS_COLORS[status] || "bg-gray-100 text-gray-700"} variant="outline">
            {STATUS_LABELS[status] || status}
          </Badge>
          {listing.tier && (
            <Badge className={TIER_COLORS[listing.tier] || ""} variant="outline">
              {TIER_LABELS[listing.tier] || listing.tier}
            </Badge>
          )}
          {listing.isVerified && (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
              <ShieldCheck className="size-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        <p className="text-muted-foreground mt-1">
          {listing.unit?.building?.locality}
          {listing.unit?.building?.city ? `, ${listing.unit.building.city}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {renderActions()}
      </div>
    </div>
  );
}
