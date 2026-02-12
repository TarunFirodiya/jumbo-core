"use client";

import { useState } from "react";
import { useDashboardStore } from "@/store/dashboard-store";
import { useAuth } from "@/contexts/auth-context";
import { WelcomeSection } from "./welcome-section";
import { StatsCards } from "./stats-cards";
import { LeadSourcesChart } from "./lead-sources-chart";
import { RevenueFlowChart } from "./revenue-flow-chart";
import { DealsTable } from "./deals-table";
import { BuyerDashboard } from "./buyer-dashboard";
import { ListingDashboard } from "./listing-dashboard";
import { FieldDashboard } from "./field-dashboard";
import { AdminDashboard } from "./admin-dashboard";

type DashboardView = "auto" | "buyer_agent" | "listing_agent" | "visit_agent";

const VIEW_LABELS: Record<DashboardView, string> = {
  auto: "My Dashboard",
  buyer_agent: "Buyer Agent",
  listing_agent: "Listing Agent",
  visit_agent: "Field Agent",
};

function RoleDashboard() {
  const { profile, loading } = useAuth();
  const isAdmin = profile?.role === "super_admin" || profile?.role === "team_lead";
  const [viewAs, setViewAs] = useState<DashboardView>("auto");

  if (loading) return null;

  const effectiveRole = viewAs === "auto" ? profile?.role : viewAs;

  return (
    <>
      {/* Role switcher for admins */}
      {isAdmin && (
        <div className="flex items-center gap-2 flex-wrap">
          {(Object.keys(VIEW_LABELS) as DashboardView[]).map((key) => (
            <button
              key={key}
              onClick={() => setViewAs(key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewAs === key
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {VIEW_LABELS[key]}
            </button>
          ))}
        </div>
      )}

      {/* Render the appropriate dashboard */}
      {(() => {
        // Only pass viewAs when admin is previewing a different role
        const previewRole = isAdmin && viewAs !== "auto" ? viewAs : undefined;
        switch (effectiveRole) {
          case "buyer_agent":
            return <BuyerDashboard viewAs={previewRole} />;
          case "listing_agent":
            return <ListingDashboard viewAs={previewRole} />;
          case "visit_agent":
            return <FieldDashboard viewAs={previewRole} />;
          default:
            return <AdminDashboard />;
        }
      })()}
    </>
  );
}

export function DashboardContent() {
  const activeTab = useDashboardStore((state) => state.activeTab);

  if (activeTab === "Dashboard") {
    return (
      <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 bg-background w-full">
        <WelcomeSection />
        <RoleDashboard />
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
