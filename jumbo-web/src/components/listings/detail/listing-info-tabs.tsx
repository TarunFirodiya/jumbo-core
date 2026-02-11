"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard,
  Image as ImageIcon,
  CalendarDays,
  Activity,
  CheckSquare,
  StickyNote,
  Play,
  FileText,
  Box,
  Download,
  ExternalLink,
} from "lucide-react";

import { ActivityTab } from "@/components/shared/tabs/activity-tab";
import { TasksTab } from "@/components/shared/tabs/tasks-tab";
import { NotesTab } from "@/components/shared/tabs/notes-tab";
import { ListingVisits } from "./listing-visits";
import { ActiveOffers } from "./active-offers";
import type { TaskItem } from "@/types";

interface ListingInfoTabsProps {
  listing: any;
  tasks: TaskItem[];
}

function formatPrice(val: string | number | null | undefined): string {
  if (!val) return "—";
  const num = Number(val);
  if (isNaN(num)) return String(val);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return `₹${num.toLocaleString("en-IN")}`;
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value || value === "—") return null;
  return (
    <div className="p-3 bg-muted/50 rounded-lg">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold text-sm mt-0.5">{value}</p>
    </div>
  );
}

function formatEnum(val: string | null | undefined): string {
  if (!val) return "—";
  return val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ListingInfoTabs({ listing, tasks }: ListingInfoTabsProps) {
  const id = listing.id;
  const images: string[] = (listing.images as string[]) || [];
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  return (
    <>
      <Card className="h-full flex flex-col">
        <Tabs defaultValue="overview" className="flex-1 flex flex-col">
          <div className="border-b px-4">
            <TabsList className="bg-transparent h-auto gap-1 p-0">
              <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 text-sm">
                <LayoutDashboard className="size-4 mr-1.5" />Overview
              </TabsTrigger>
              <TabsTrigger value="media" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 text-sm">
                <ImageIcon className="size-4 mr-1.5" />Media
              </TabsTrigger>
              <TabsTrigger value="visits" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 text-sm">
                <CalendarDays className="size-4 mr-1.5" />Visits & Offers
              </TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 text-sm">
                <Activity className="size-4 mr-1.5" />Activity
              </TabsTrigger>
              <TabsTrigger value="tasks" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 text-sm">
                <CheckSquare className="size-4 mr-1.5" />Tasks
              </TabsTrigger>
              <TabsTrigger value="notes" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 text-sm">
                <StickyNote className="size-4 mr-1.5" />Notes
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── OVERVIEW TAB ── */}
          <TabsContent value="overview" className="flex-1 m-0">
            <CardContent className="p-6 space-y-6">
              {/* Property Details */}
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Property Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <InfoItem label="Configuration" value={listing.configuration || (listing.unit?.bhk ? `${listing.unit.bhk} BHK` : null)} />
                  <InfoItem label="Property Type" value={formatEnum(listing.propertyType)} />
                  <InfoItem label="Floor" value={listing.unit?.floorNumber != null ? String(listing.unit.floorNumber) : null} />
                  <InfoItem label="Carpet Area" value={listing.unit?.carpetArea ? `${listing.unit.carpetArea} sqft` : null} />
                  <InfoItem label="Facing" value={formatEnum(listing.unit?.facing)} />
                  <InfoItem label="View" value={formatEnum(listing.unit?.view)} />
                  <InfoItem label="Furnishing" value={formatEnum(listing.furnishing)} />
                  <InfoItem label="Occupancy" value={formatEnum(listing.occupancy)} />
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Pricing</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <InfoItem label="Asking Price" value={formatPrice(listing.askingPrice)} />
                  <InfoItem label="Price/sqft" value={listing.pricePerSqft ? `₹${Number(listing.pricePerSqft).toLocaleString("en-IN")}` : null} />
                  <InfoItem label="MSP" value={formatPrice(listing.msp)} />
                  <InfoItem label="Maintenance" value={listing.maintenance ? `₹${Number(listing.maintenance).toLocaleString("en-IN")}/mo` : null} />
                  <InfoItem label="Seller Fees %" value={listing.sellerFeesPercent ? `${listing.sellerFeesPercent}%` : null} />
                </div>
              </div>

              {/* USPs */}
              {(listing.usp1 || listing.usp2 || listing.usp3) && (
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">USPs</h3>
                  <div className="flex gap-2 flex-wrap">
                    {[listing.usp1, listing.usp2, listing.usp3].filter(Boolean).map((usp: string) => (
                      <Badge key={usp} variant="secondary">{formatEnum(usp)}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {listing.description && (
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Description</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{listing.description}</p>
                </div>
              )}

              {/* Amenities */}
              {listing.amenitiesJson && listing.amenitiesJson.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Amenities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2">
                    {listing.amenitiesJson.map((amenity: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="size-1.5 rounded-full bg-primary" />
                        <span className="text-sm">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </TabsContent>

          {/* ── MEDIA TAB ── */}
          <TabsContent value="media" className="flex-1 m-0">
            <CardContent className="p-6 space-y-6">
              {/* Image Gallery */}
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Photos</h3>
                {images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {images.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="relative aspect-[4/3] rounded-lg overflow-hidden border hover:ring-2 hover:ring-primary transition-all"
                        onClick={() => setSelectedImage(url)}
                      >
                        <img src={url} alt={`Listing photo ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                    <ImageIcon className="size-10 opacity-40 mb-2" />
                    <p className="text-sm font-medium">No photos uploaded</p>
                    <p className="text-xs mt-1">Upload photos to showcase this listing.</p>
                  </div>
                )}
              </div>

              {/* Video */}
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Video</h3>
                {listing.videoUrl ? (
                  <div className="aspect-video rounded-lg overflow-hidden border bg-black">
                    <iframe src={listing.videoUrl} className="w-full h-full" allowFullScreen title="Listing video" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                    <Play className="size-10 opacity-40 mb-2" />
                    <p className="text-sm font-medium">No video available</p>
                  </div>
                )}
              </div>

              {/* Floor Plan */}
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Floor Plan</h3>
                {listing.floorPlanUrl ? (
                  <div className="aspect-[4/3] rounded-lg overflow-hidden border">
                    <img src={listing.floorPlanUrl} alt="Floor plan" className="w-full h-full object-contain bg-white" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                    <FileText className="size-10 opacity-40 mb-2" />
                    <p className="text-sm font-medium">No floor plan available</p>
                  </div>
                )}
              </div>

              {/* 3D Tour */}
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">3D Tour</h3>
                {listing.tour3dUrl ? (
                  <div className="aspect-video rounded-lg overflow-hidden border">
                    <iframe src={listing.tour3dUrl} className="w-full h-full" allowFullScreen title="3D Tour" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                    <Box className="size-10 opacity-40 mb-2" />
                    <p className="text-sm font-medium">No 3D tour available</p>
                  </div>
                )}
              </div>

              {/* Brochure */}
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Brochure</h3>
                {listing.brochureUrl ? (
                  <a
                    href={listing.brochureUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-muted/50 transition-colors text-sm font-medium"
                  >
                    <Download className="size-4" />
                    Download Brochure
                    <ExternalLink className="size-3 opacity-50" />
                  </a>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                    <FileText className="size-10 opacity-40 mb-2" />
                    <p className="text-sm font-medium">No brochure available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </TabsContent>

          {/* ── VISITS & OFFERS TAB ── */}
          <TabsContent value="visits" className="flex-1 m-0">
            <div className="p-6 space-y-6">
              <ListingVisits visits={listing.visits || []} />
              <ActiveOffers offers={listing.offers || []} />
            </div>
          </TabsContent>

          {/* ── ACTIVITY TAB ── */}
          <TabsContent value="activity" className="flex-1 m-0">
            <ActivityTab entityType="listing" entityId={id} />
          </TabsContent>

          {/* ── TASKS TAB ── */}
          <TabsContent value="tasks" className="flex-1 m-0">
            <TasksTab entityType="listing" entityId={id} initialTasks={tasks} />
          </TabsContent>

          {/* ── NOTES TAB ── */}
          <TabsContent value="notes" className="flex-1 m-0">
            <NotesTab entityType="listing" entityId={id} />
          </TabsContent>
        </Tabs>
      </Card>

      {/* ── Lightbox ── */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Listing photo"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
