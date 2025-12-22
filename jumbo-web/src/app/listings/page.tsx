import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { ListingsTable } from "@/components/listings/listings-table";
import { ListingsStats } from "@/components/listings/listings-stats";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function ListingsPage() {
  return (
    <SidebarProvider className="bg-sidebar">
      <DashboardSidebar />
      <div className="h-svh overflow-hidden lg:p-2 w-full">
        <div className="lg:border lg:rounded-md overflow-hidden flex flex-col items-center justify-start bg-container h-full w-full bg-background">
          <DashboardHeader />
          <main className="flex-1 w-full overflow-auto p-3 sm:p-6">
            <div className="max-w-[1600px] mx-auto space-y-6">
              {/* Page Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="h1">
                    Listings
                  </h1>
                  <p className="p1 mt-1">
                    Manage property listings, track inventory status, and schedule inspections.
                  </p>
                </div>
              </div>

              {/* Stats */}
              <ListingsStats />

              {/* Listings Table */}
              <ListingsTable />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
