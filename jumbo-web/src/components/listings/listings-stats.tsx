"use client";

import { Building2, Home, Key, TrendingUp } from "lucide-react";
import { Stats, type StatItem } from "@/components/ui/stats";

interface ListingsStatsProps {
  stats: {
    totalListings: number;
    activeListings: number;
    soldThisMonth: number;
    draftListings: number;
  };
}

export function ListingsStats({ stats }: ListingsStatsProps) {
  const activePercentage = stats.totalListings > 0 
    ? Math.round((stats.activeListings / stats.totalListings) * 100) 
    : 0;

  const statsData: StatItem[] = [
    {
      title: "Total Listings",
      value: stats.totalListings.toString(),
      change: "",
      changeType: "neutral",
      icon: Building2,
    },
    {
      title: "Active Listings",
      value: stats.activeListings.toString(),
      change: `${activePercentage}%`,
      changeType: "neutral",
      icon: Home,
    },
    {
      title: "Sold This Month",
      value: stats.soldThisMonth.toString(),
      change: "",
      changeType: "positive",
      icon: TrendingUp,
    },
    {
      title: "Draft Listings",
      value: stats.draftListings.toString(),
      change: "",
      changeType: "neutral",
      icon: Key,
    },
  ];

  return <Stats data={statsData} />;
}
