import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { ListingWizard } from "@/components/listings/wizard/listing-wizard";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function NewListingPage() {
  return (
    <SidebarProvider className="bg-sidebar">
      <DashboardSidebar />
      <div className="h-svh overflow-hidden lg:p-2 w-full">
        <div className="lg:border lg:rounded-md overflow-hidden flex flex-col items-center justify-start bg-container h-full w-full bg-background">
          <DashboardHeader />
          <main className="flex-1 w-full overflow-auto p-3 sm:p-6">
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
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

