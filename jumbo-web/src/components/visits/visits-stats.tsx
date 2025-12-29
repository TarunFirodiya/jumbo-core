"use client";

import { Calendar, MoreHorizontal, CheckCircle2, XCircle } from "lucide-react";
import { Stats, type StatItem } from "@/components/ui/stats";

interface VisitsStatsProps {
  stats: {
    totalVisits: number;
    scheduledVisits: number;
    completedVisits: number;
    pendingVisits: number;
  };
}

export function VisitsStats({ stats }: VisitsStatsProps) {
  const statsData: StatItem[] = [
    {
      title: "Total Visits",
      value: stats.totalVisits.toString(),
      change: "",
      changeType: "neutral",
      icon: Calendar,
    },
    {
      title: "Scheduled",
      value: stats.scheduledVisits.toString(),
      change: "",
      changeType: "neutral",
      icon: Calendar,
    },
    {
      title: "Pending",
      value: stats.pendingVisits.toString(),
      change: "",
      changeType: "neutral",
      icon: MoreHorizontal,
    },
    {
      title: "Completed",
      value: stats.completedVisits.toString(),
      change: "",
      changeType: "neutral",
      icon: CheckCircle2,
    },
  ];

  return <Stats data={statsData} />;
}
