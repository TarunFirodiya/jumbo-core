"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useListingWizardStore } from "@/store/listing-wizard-store";
import { BuildingStep } from "./steps/building-step";
import { UnitStep } from "./steps/unit-step";
import { ListingStep } from "./steps/listing-step";
import { Check, Building2, Home, IndianRupee, ChevronLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const steps = [
  { id: 1, title: "Building", description: "Select or add building", icon: Building2 },
  { id: 2, title: "Unit", description: "Unit & owner details", icon: Home },
  { id: 3, title: "Listing", description: "Price & amenities", icon: IndianRupee },
];

export function ListingWizard() {
  const router = useRouter();
  const currentStep = useListingWizardStore((state) => state.currentStep);
  const building = useListingWizardStore((state) => state.building);
  const unit = useListingWizardStore((state) => state.unit);
  const listing = useListingWizardStore((state) => state.listing);
  const nextStep = useListingWizardStore((state) => state.nextStep);
  const prevStep = useListingWizardStore((state) => state.prevStep);
  const resetWizard = useListingWizardStore((state) => state.resetWizard);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    if (!building || !unit || !listing) return;

    setIsSubmitting(true);
    try {
      // Build the request payload matching createListingRequestSchema
      const payload: Record<string, unknown> = {
        building: building.isNew
          ? { name: building.name, locality: building.locality, city: building.city }
          : { id: building.id },
        unit: {
          unitNumber: unit.unitNumber || undefined,
          bhk: unit.bhk,
          floorNumber: unit.floorNumber || undefined,
          carpetArea: unit.carpetArea || undefined,
        },
        askingPrice: listing.askingPrice,
      };

      const response = await fetch("/api/v1/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create listing");
      }

      toast.success("Listing created successfully");
      resetWizard();
      router.push("/listings");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create listing"
      );
      console.error("Error creating listing:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return building !== null && building.name && building.locality;
      case 2:
        return unit !== null && unit.unitNumber && unit.bhk && unit.ownerName && unit.ownerPhone;
      case 3:
        return listing !== null && listing.askingPrice > 0;
      default:
        return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <nav aria-label="Progress" className="mb-8">
        <ol className="flex items-center justify-center">
          {steps.map((step, stepIdx) => (
            <li
              key={step.id}
              className={cn(
                "relative flex items-center",
                stepIdx !== steps.length - 1 && "pr-8 sm:pr-20"
              )}
            >
              {/* Connector Line */}
              {stepIdx !== steps.length - 1 && (
                <div
                  className={cn(
                    "absolute top-4 left-7 -ml-px mt-0.5 h-0.5 w-full",
                    "sm:w-20",
                    currentStep > step.id
                      ? "bg-primary"
                      : "bg-muted"
                  )}
                  aria-hidden="true"
                />
              )}

              {/* Step Circle */}
              <div className="group relative flex items-center">
                <span className="flex h-9 items-center" aria-hidden="true">
                  <span
                    className={cn(
                      "relative z-10 flex size-8 items-center justify-center rounded-full border-2 transition-colors",
                      currentStep > step.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : currentStep === step.id
                          ? "border-primary bg-background text-primary"
                          : "border-muted bg-background text-muted-foreground"
                    )}
                  >
                    {currentStep > step.id ? (
                      <Check className="size-4" />
                    ) : (
                      <step.icon className="size-4" />
                    )}
                  </span>
                </span>

                {/* Step Label */}
                <span className="ml-3 hidden sm:flex flex-col min-w-0">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      currentStep >= step.id
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {step.description}
                  </span>
                </span>
              </div>
            </li>
          ))}
        </ol>
      </nav>

      {/* Step Content */}
      <Card className="border-2">
        <CardContent className="p-6 sm:p-8">
          {currentStep === 1 && <BuildingStep />}
          {currentStep === 2 && <UnitStep />}
          {currentStep === 3 && <ListingStep />}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => {
            if (currentStep === 1) {
              resetWizard();
              router.push("/listings");
            } else {
              prevStep();
            }
          }}
        >
          <ChevronLeft className="size-4 mr-2" />
          {currentStep === 1 ? "Cancel" : "Back"}
        </Button>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          Step {currentStep} of {steps.length}
        </div>

        {currentStep < 3 ? (
          <Button onClick={nextStep} disabled={!canProceed()}>
            Continue
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!canProceed() || isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
            Create Listing
          </Button>
        )}
      </div>
    </div>
  );
}

