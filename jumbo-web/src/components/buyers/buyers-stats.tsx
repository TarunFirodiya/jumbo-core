"use client";

import { UserCheck, UserPlus, Users, Wallet } from "lucide-react";
import { Stats, type StatItem } from "@/components/ui/stats";

interface BuyersStatsProps {
  stats: {
    totalBuyers: number;
    activeBuyers: number;
    newThisMonth: number;
  };
}

export function BuyersStats({ stats }: BuyersStatsProps) {
  const statsData: StatItem[] = [
    {
      title: "Total Buyers",
      value: stats.totalBuyers.toLocaleString(),
      change: "+12%",
      changeType: "positive",
      icon: Users,
    },
    {
      title: "Active Buyers",
      value: stats.activeBuyers.toLocaleString(),
      change: "+8%",
      changeType: "positive",
      icon: UserCheck,
    },
    {
      title: "New This Month",
      value: stats.newThisMonth.toLocaleString(),
      change: "-5%",
      changeType: "negative",
      icon: UserPlus,
    },
    {
      title: "Total Budget",
      value: "$42M",
      change: "+15%",
      changeType: "positive",
      icon: Wallet,
    },
  ];

  return <Stats data={statsData} />;
}
