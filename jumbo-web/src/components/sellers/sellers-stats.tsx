"use client";

import { Users, Building, Calendar, Home } from "lucide-react";
import { Stats, type StatItem } from "@/components/ui/stats";
import type { SellerStats } from "@/types";

interface SellersStatsProps {
  stats: SellerStats;
}

export function SellersStats({ stats }: SellersStatsProps) {
  const statsData: StatItem[] = [
    {
      title: "New Leads",
      value: String(stats.newLeads),
      subtitle: "This month",
      icon: Users,
    },
    {
      title: "Homes Live",
      value: String(stats.homesLive),
      subtitle: "This month",
      icon: Home,
    },
    {
      title: "Schedule Inspections",
      value: String(stats.inspectionPending),
      subtitle: "Pending",
      icon: Calendar,
    },
    {
      title: "Active Sellers",
      value: String(stats.activeSellers),
      subtitle: "With live listings",
      icon: Building,
    },
  ];

  return <Stats data={statsData} />;
}
