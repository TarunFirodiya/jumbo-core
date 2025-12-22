"use client";

import { useDashboardStore } from "@/store/dashboard-store";
import { WelcomeSection } from "./welcome-section";
import { StatsCards } from "./stats-cards";
import { LeadSourcesChart } from "./lead-sources-chart";
import { RevenueFlowChart } from "./revenue-flow-chart";
import { DealsTable } from "./deals-table";

export function DashboardContent() {
  const activeTab = useDashboardStore((state) => state.activeTab);

  if (activeTab === "Dashboard") {
    return (
      <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 bg-background w-full">
        <WelcomeSection />
        <StatsCards />
        <div className="flex flex-col xl:flex-row gap-4 sm:gap-6">
          <LeadSourcesChart />
          <RevenueFlowChart />
        </div>
        <DealsTable />
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 bg-background w-full flex items-center justify-center">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{activeTab}</h2>
        <p className="text-muted-foreground">This section is coming soon.</p>
      </div>
    </main>
  );
}
