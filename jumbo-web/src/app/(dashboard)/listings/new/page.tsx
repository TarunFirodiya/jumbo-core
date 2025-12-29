import { ListingWizard } from "@/components/listings/wizard/listing-wizard";

export default function NewListingPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
          Add New Listing
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create a new property listing in 3 simple steps.
        </p>
      </div>

      {/* Wizard */}
      <ListingWizard />
    </div>
  );
}
