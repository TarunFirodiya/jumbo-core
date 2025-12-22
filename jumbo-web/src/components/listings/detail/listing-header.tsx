import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Edit, Calendar } from "lucide-react";
import { Listing } from "@/lib/db/schema";

interface ListingHeaderProps {
  listing: Partial<Listing> & {
    unit?: { unitNumber: string; floorNumber: number; bhk: number };
    building?: { name: string; locality: string; city: string };
  };
}

export function ListingHeader({ listing }: ListingHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={listing.status === "active" ? "default" : "secondary"}>
            {listing.status?.toUpperCase() || "DRAFT"}
          </Badge>
          <span className="text-sm text-muted-foreground">
            ID: {listing.id?.slice(0, 8)}
          </span>
        </div>
        <h1 className="text-2xl font-bold sm:text-3xl">
          {listing.unit?.bhk} BHK Apartment in {listing.building?.name}
        </h1>
        <p className="text-muted-foreground mt-1">
          {listing.building?.locality}, {listing.building?.city} • Floor {listing.unit?.floorNumber}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Share2 className="size-4 mr-2" />
          Share
        </Button>
        <Button variant="outline" size="sm">
          <Edit className="size-4 mr-2" />
          Edit
        </Button>
        <Button size="sm">
          <Calendar className="size-4 mr-2" />
          Schedule Visit
        </Button>
      </div>
    </div>
  );
}

