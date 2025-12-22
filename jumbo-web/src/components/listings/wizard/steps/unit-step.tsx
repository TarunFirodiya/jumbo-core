"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useListingWizardStore } from "@/store/listing-wizard-store";
import { Separator } from "@/components/ui/separator";
import { Home, User } from "lucide-react";

const bhkOptions = [
  { value: "1", label: "1 BHK" },
  { value: "1.5", label: "1.5 BHK" },
  { value: "2", label: "2 BHK" },
  { value: "2.5", label: "2.5 BHK" },
  { value: "3", label: "3 BHK" },
  { value: "3.5", label: "3.5 BHK" },
  { value: "4", label: "4 BHK" },
  { value: "4.5", label: "4.5 BHK" },
  { value: "5", label: "5+ BHK" },
];

export function UnitStep() {
  const building = useListingWizardStore((state) => state.building);
  const unit = useListingWizardStore((state) => state.unit);
  const setUnit = useListingWizardStore((state) => state.setUnit);

  const [formData, setFormData] = React.useState({
    unitNumber: unit?.unitNumber || "",
    bhk: unit?.bhk?.toString() || "",
    floorNumber: unit?.floorNumber?.toString() || "",
    carpetArea: unit?.carpetArea?.toString() || "",
    ownerName: unit?.ownerName || "",
    ownerPhone: unit?.ownerPhone || "",
    ownerEmail: unit?.ownerEmail || "",
  });

  // Update store whenever form data changes
  React.useEffect(() => {
    if (
      formData.unitNumber &&
      formData.bhk &&
      formData.ownerName &&
      formData.ownerPhone
    ) {
      setUnit({
        unitNumber: formData.unitNumber,
        bhk: parseFloat(formData.bhk),
        floorNumber: parseInt(formData.floorNumber) || 0,
        carpetArea: parseInt(formData.carpetArea) || 0,
        ownerName: formData.ownerName,
        ownerPhone: formData.ownerPhone,
        ownerEmail: formData.ownerEmail || undefined,
      });
    }
  }, [formData, setUnit]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Unit Details</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Enter the unit specifications and owner information for{" "}
          <span className="font-medium text-foreground">{building?.name}</span>.
        </p>
      </div>

      {/* Unit Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Home className="size-4 text-muted-foreground" />
          Unit Information
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="unitNumber">
              Unit Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="unitNumber"
              placeholder="e.g., A-101"
              value={formData.unitNumber}
              onChange={(e) => handleChange("unitNumber", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bhk">
              Configuration <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.bhk}
              onValueChange={(value) => handleChange("bhk", value)}
            >
              <SelectTrigger id="bhk">
                <SelectValue placeholder="Select BHK" />
              </SelectTrigger>
              <SelectContent>
                {bhkOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="floorNumber">Floor Number</Label>
            <Input
              id="floorNumber"
              type="number"
              placeholder="e.g., 5"
              value={formData.floorNumber}
              onChange={(e) => handleChange("floorNumber", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="carpetArea">Carpet Area (sqft)</Label>
            <Input
              id="carpetArea"
              type="number"
              placeholder="e.g., 1200"
              value={formData.carpetArea}
              onChange={(e) => handleChange("carpetArea", e.target.value)}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Owner Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <User className="size-4 text-muted-foreground" />
          Owner Information
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="ownerName">
              Owner Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ownerName"
              placeholder="Full name"
              value={formData.ownerName}
              onChange={(e) => handleChange("ownerName", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ownerPhone">
              Phone Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ownerPhone"
              type="tel"
              placeholder="+91 98765 43210"
              value={formData.ownerPhone}
              onChange={(e) => handleChange("ownerPhone", e.target.value)}
            />
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="ownerEmail">Email (Optional)</Label>
            <Input
              id="ownerEmail"
              type="email"
              placeholder="owner@example.com"
              value={formData.ownerEmail}
              onChange={(e) => handleChange("ownerEmail", e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

