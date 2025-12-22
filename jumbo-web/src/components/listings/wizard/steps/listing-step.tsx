"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  useListingWizardStore,
  availableAmenities,
} from "@/store/listing-wizard-store";
import { Separator } from "@/components/ui/separator";
import { formatINR } from "@/mock-data/listings";
import { IndianRupee, Image, Sparkles, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ListingStep() {
  const building = useListingWizardStore((state) => state.building);
  const unit = useListingWizardStore((state) => state.unit);
  const listing = useListingWizardStore((state) => state.listing);
  const setListing = useListingWizardStore((state) => state.setListing);

  const [price, setPrice] = React.useState(listing?.askingPrice?.toString() || "");
  const [description, setDescription] = React.useState(listing?.description || "");
  const [selectedAmenities, setSelectedAmenities] = React.useState<string[]>(
    listing?.amenities || []
  );
  const [imageUrls, setImageUrls] = React.useState<string[]>(
    listing?.imageUrls || []
  );

  // Update store when form data changes
  React.useEffect(() => {
    const parsedPrice = parseInt(price.replace(/,/g, "")) || 0;
    if (parsedPrice > 0) {
      setListing({
        askingPrice: parsedPrice,
        images: [],
        imageUrls,
        amenities: selectedAmenities,
        description: description || undefined,
      });
    }
  }, [price, selectedAmenities, imageUrls, description, setListing]);

  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handlePriceChange = (value: string) => {
    // Allow only numbers
    const numericValue = value.replace(/[^0-9]/g, "");
    setPrice(numericValue);
  };

  const formattedPrice = price
    ? formatINR(parseInt(price.replace(/,/g, "")))
    : "";

  // Mock image upload
  const handleImageUpload = () => {
    // In a real app, this would open a file picker
    // For now, add a random placeholder image
    const randomId = Math.random().toString(36).substring(7);
    setImageUrls((prev) => [
      ...prev,
      `https://picsum.photos/seed/${randomId}/400/300`,
    ]);
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Listing Details</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Set the asking price and amenities for{" "}
          <span className="font-medium text-foreground">
            {unit?.unitNumber}
          </span>{" "}
          at{" "}
          <span className="font-medium text-foreground">{building?.name}</span>.
        </p>
      </div>

      {/* Pricing Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <IndianRupee className="size-4 text-muted-foreground" />
          Pricing
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="price">
              Asking Price <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                ₹
              </span>
              <Input
                id="price"
                type="text"
                placeholder="Enter amount"
                value={price}
                onChange={(e) => handlePriceChange(e.target.value)}
                className="pl-8"
              />
            </div>
            {formattedPrice && (
              <p className="text-sm text-muted-foreground">
                Displayed as: <span className="font-medium">{formattedPrice}</span>
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add any additional details about the property..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Images Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Image className="size-4 text-muted-foreground" />
          Property Images
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {imageUrls.map((url, index) => (
            <div key={index} className="relative group aspect-[4/3] rounded-lg overflow-hidden bg-muted">
              <img
                src={url}
                alt={`Property ${index + 1}`}
                className="size-full object-cover"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 size-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}

          <button
            onClick={handleImageUpload}
            className="aspect-[4/3] rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-muted/50 transition-colors"
          >
            <Upload className="size-6 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Add Image</span>
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Upload high-quality images. First image will be used as the cover.
        </p>
      </div>

      <Separator />

      {/* Amenities Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="size-4 text-muted-foreground" />
            Amenities
          </div>
          <span className="text-xs text-muted-foreground">
            {selectedAmenities.length} selected
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableAmenities.map((amenity) => {
            const isSelected = selectedAmenities.includes(amenity);
            return (
              <button
                key={amenity}
                onClick={() => handleAmenityToggle(amenity)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border text-left transition-all text-sm",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-primary/50"
                )}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => handleAmenityToggle(amenity)}
                  className="pointer-events-none"
                />
                <span className={cn(isSelected && "font-medium")}>
                  {amenity}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 rounded-lg bg-muted/50 border">
        <h3 className="font-medium text-sm mb-3">Listing Summary</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-muted-foreground">Building:</span>
          <span className="font-medium">{building?.name}</span>
          
          <span className="text-muted-foreground">Unit:</span>
          <span className="font-medium">{unit?.unitNumber}</span>
          
          <span className="text-muted-foreground">Configuration:</span>
          <span className="font-medium">{unit?.bhk} BHK</span>
          
          <span className="text-muted-foreground">Price:</span>
          <span className="font-medium">{formattedPrice || "—"}</span>
          
          <span className="text-muted-foreground">Images:</span>
          <span className="font-medium">{imageUrls.length}</span>
          
          <span className="text-muted-foreground">Amenities:</span>
          <span className="font-medium">{selectedAmenities.length}</span>
        </div>
      </div>
    </div>
  );
}

