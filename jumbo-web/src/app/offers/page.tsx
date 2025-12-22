import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { OffersStats } from "@/components/offers/offers-stats";
import { OffersTable } from "@/components/offers/offers-table";

export default function OffersPage() {
  return (
    <SidebarProvider className="bg-sidebar">
      <DashboardSidebar />
      <div className="h-svh overflow-hidden lg:p-2 w-full">
        <div className="lg:border lg:rounded-md overflow-hidden flex flex-col items-center justify-start bg-container h-full w-full bg-background">
          <DashboardHeader />
          <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 bg-background w-full">
            <div>
              <h1 className="h1">
                Offers
              </h1>
              <p className="p1">
                Manage property offers, negotiations, and closures.
              </p>
            </div>

            <OffersStats />
            <OffersTable />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

