"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ListingTabsProps {
  listing: any; // Using any for now to simplify, ideally typed
}

const tabs = ["Overview", "Amenities", "Location", "Price History", "Building", "Internal"];

export function ListingInfoTabs({ listing }: ListingTabsProps) {
  const [activeTab, setActiveTab] = React.useState("Overview");

  return (
    <Card className="h-full flex flex-col">
      <div className="border-b px-4">
        <div className="flex gap-4 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      <CardContent className="flex-1 p-6">
        {activeTab === "Overview" && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {listing.description || "No description available."}
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="font-semibold">₹{listing.askingPrice || "N/A"}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Carpet Area</p>
                    <p className="font-semibold">{listing.unit?.carpetArea} sqft</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Floor</p>
                    <p className="font-semibold">{listing.unit?.floorNumber}</p>
                </div>
                 <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Furnishing</p>
                    <p className="font-semibold">Semi-Furnished</p>
                </div>
            </div>
          </div>
        )}
        {activeTab === "Amenities" && (
             <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2">
                {listing.amenitiesJson?.map((amenity: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                        <div className="size-1.5 rounded-full bg-primary" />
                        <span className="text-sm">{amenity}</span>
                    </div>
                )) || <p className="text-muted-foreground text-sm">No amenities listed.</p>}
             </div>
        )}
        {/* Placeholders for other tabs */}
        {!["Overview", "Amenities"].includes(activeTab) && (
            <div className="flex h-40 items-center justify-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                Content for {activeTab} will go here
            </div>
        )}
      </CardContent>
    </Card>
  );
}

