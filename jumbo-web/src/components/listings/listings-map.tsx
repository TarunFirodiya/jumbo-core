"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerLabel,
  MarkerPopup,
  type MapRef,
} from "@/components/ui/map";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation, MapPin } from "lucide-react";
import { cn, formatINR } from "@/lib/utils";
import type { ListingWithRelations } from "@/types";

// Status labels and colors
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

interface ListingsMapProps {
  data: ListingWithRelations[];
  selectedId?: string;
  onSelectListing?: (id: string) => void;
}

type MapListing = {
  id: string;
  unitNumber: string;
  buildingName: string;
  locality: string;
  bhk: number | null;
  carpetArea: number | null;
  askingPrice: string | null;
  status: string;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
  listingUrl: string;
};

function transformListingForMap(listing: ListingWithRelations): MapListing | null {
  const unit = listing.unit;
  const building = unit?.building;

  // Only include listings with valid coordinates
  if (!building?.latitude || !building?.longitude) {
    return null;
  }

  // Get first image from images array or mediaItems
  let imageUrl: string | null = null;
  if (listing.images && Array.isArray(listing.images) && listing.images.length > 0) {
    imageUrl = listing.images[0];
  } else if (listing.mediaItems && listing.mediaItems.length > 0) {
    const firstImage = listing.mediaItems.find((m) => m.mediaType === "image");
    if (firstImage) {
      imageUrl = firstImage.cloudinaryUrl;
    }
  }

  return {
    id: listing.id,
    unitNumber: unit?.unitNumber || "N/A",
    buildingName: building.name || "Unknown Building",
    locality: building.locality || "Unknown",
    bhk: unit?.bhk || null,
    carpetArea: unit?.carpetArea || null,
    askingPrice: listing.askingPrice,
    status: listing.status || "draft",
    latitude: building.latitude,
    longitude: building.longitude,
    imageUrl,
    listingUrl: `/listings/${listing.id}`,
  };
}

function calculateMapCenter(listings: MapListing[]): [number, number] {
  if (listings.length === 0) {
    // Default to Bangalore center if no listings
    return [77.5946, 12.9716];
  }

  const avgLng = listings.reduce((sum, l) => sum + l.longitude, 0) / listings.length;
  const avgLat = listings.reduce((sum, l) => sum + l.latitude, 0) / listings.length;

  return [avgLng, avgLat];
}

export function ListingsMap({ data, selectedId, onSelectListing }: ListingsMapProps) {
  const mapRef = React.useRef<MapRef>(null);
  const mapListings = React.useMemo(() => {
    return data
      .map(transformListingForMap)
      .filter((listing): listing is MapListing => listing !== null);
  }, [data]);

  const center = React.useMemo(() => calculateMapCenter(mapListings), [mapListings]);

  // Fly to selected listing when selectedId changes
  React.useEffect(() => {
    if (!selectedId || !mapRef.current) return;
    const listing = mapListings.find((l) => l.id === selectedId);
    if (listing) {
      mapRef.current.flyTo({
        center: [listing.longitude, listing.latitude],
        zoom: 15,
        duration: 800,
      });
    }
  }, [selectedId, mapListings]);

  if (mapListings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <MapPin className="size-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No listings with location data</h3>
        <p className="text-muted-foreground">
          Add latitude and longitude to building records to view listings on the map.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border">
      <Map ref={mapRef} center={center} zoom={11}>
        {mapListings.map((listing) => {
          const statusColor = statusColors[listing.status] || statusColors.draft;
          const statusLabel = statusLabels[listing.status] || listing.status;
          const isSelected = selectedId === listing.id;

          return (
            <MapMarker
              key={listing.id}
              longitude={listing.longitude}
              latitude={listing.latitude}
              onClick={() => onSelectListing?.(listing.id)}
            >
              <MarkerContent>
                <div
                  className={cn(
                    "rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-all",
                    isSelected ? "size-7 ring-2 ring-accent-green" : "size-5",
                    statusColor.bg
                  )}
                />
                <MarkerLabel position="bottom">
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-background/90 backdrop-blur-sm border shadow-sm">
                    {listing.unitNumber}
                  </span>
                </MarkerLabel>
              </MarkerContent>
              <MarkerPopup className="p-0 w-64">
                {listing.imageUrl ? (
                  <div className="relative h-32 overflow-hidden rounded-t-md">
                    <Image
                      fill
                      src={listing.imageUrl}
                      alt={listing.buildingName}
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="relative h-32 overflow-hidden rounded-t-md bg-muted flex items-center justify-center">
                    <MapPin className="size-8 text-muted-foreground/50" />
                  </div>
                )}
                <div className="space-y-2 p-3">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {listing.locality}
                    </span>
                    <h3 className="font-semibold text-foreground leading-tight mt-0.5">
                      {listing.unitNumber} • {listing.buildingName}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {listing.bhk && (
                      <span className="text-xs text-muted-foreground">{listing.bhk} BHK</span>
                    )}
                    {listing.carpetArea && (
                      <span className="text-xs text-muted-foreground">
                        {listing.carpetArea} sqft
                      </span>
                    )}
                    {listing.askingPrice && (
                      <span className="text-xs font-medium text-foreground">
                        {formatINR(listing.askingPrice)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={cn("font-medium text-xs whitespace-nowrap", statusColor.bg, statusColor.text)}
                    >
                      {statusLabel}
                    </Badge>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" className="flex-1 h-8" asChild>
                      <Link href={listing.listingUrl}>
                        View Details
                      </Link>
                    </Button>
                    {listing.longitude && listing.latitude && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        asChild
                      >
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Navigation className="size-3.5" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </MarkerPopup>
            </MapMarker>
          );
        })}
      </Map>
    </div>
  );
}

