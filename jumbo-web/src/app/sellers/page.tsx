import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SellersStats } from "@/components/sellers/sellers-stats";
import { SellersTable } from "@/components/sellers/sellers-table";

export default function SellersPage() {
  return (
    <SidebarProvider className="bg-sidebar">
      <DashboardSidebar />
      <div className="h-svh overflow-hidden lg:p-2 w-full">
        <div className="lg:border lg:rounded-md overflow-hidden flex flex-col items-center justify-start bg-container h-full w-full bg-background">
          <DashboardHeader />
          <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 bg-background w-full">
            <div>
              <h1 className="h1">
                Sellers
              </h1>
              <p className="p1">
                Manage property sellers, inventory agreements, and relationships.
              </p>
            </div>

            <SellersStats />
            <SellersTable />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

