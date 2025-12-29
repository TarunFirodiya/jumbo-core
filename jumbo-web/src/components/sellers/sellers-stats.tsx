"use client";

import { useState, useEffect } from "react";
import { Users, Building, Calendar, Home, Loader2 } from "lucide-react";
import { Stats, type StatItem } from "@/components/ui/stats";
import type { SellerStats } from "@/types";

export function SellersStats() {
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/v1/sellers/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch seller stats:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 text-muted-foreground h-24">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading stats...
      </div>
    );
  }

  const statsData: StatItem[] = [
    {
      title: "New Leads",
      value: String(stats?.newLeads ?? 0),
      subtitle: "This month",
      icon: Users,
    },
    {
      title: "Homes Live",
      value: String(stats?.homesLive ?? 0),
      subtitle: "This month",
      icon: Home,
    },
    {
      title: "Schedule Inspections",
      value: String(stats?.inspectionPending ?? 0),
      subtitle: "Pending",
      icon: Calendar,
    },
    {
      title: "Active Sellers",
      value: String(stats?.activeSellers ?? 0),
      subtitle: "With live listings",
      icon: Building,
    },
  ];

  return <Stats data={statsData} />;
}
