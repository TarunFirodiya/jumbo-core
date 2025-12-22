import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { BuyersStats } from "@/components/buyers/buyers-stats";
import { BuyersTable } from "@/components/buyers/buyers-table";

export default function BuyersPage() {
  return (
    <SidebarProvider className="bg-sidebar">
      <DashboardSidebar />
      <div className="h-svh overflow-hidden lg:p-2 w-full">
        <div className="lg:border lg:rounded-md overflow-hidden flex flex-col items-center justify-start bg-container h-full w-full bg-background">
          <DashboardHeader />
          <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 bg-background w-full">
            <div>
              <h1 className="h1">
                Buyers
              </h1>
              <p className="p1">
                Manage potential buyers, track requirements, and follow up on leads.
              </p>
            </div>

            <BuyersStats />
            <BuyersTable />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

