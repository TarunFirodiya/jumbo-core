"use client";

import { AlertCircle, CheckCheck, Clock, FileText } from "lucide-react";
import { Stats, type StatItem } from "@/components/ui/stats";

interface OffersStatsProps {
  stats: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    countered: number;
  };
}

export function OffersStats({ stats }: OffersStatsProps) {
  const statsData: StatItem[] = [
    {
      title: "Total Offers",
      value: String(stats.total),
      subtitle: "All offers",
      icon: FileText,
    },
    {
      title: "Pending Response",
      value: String(stats.pending),
      subtitle: "Awaiting response",
      icon: Clock,
    },
    {
      title: "Accepted",
      value: String(stats.accepted),
      subtitle: "Accepted offers",
      icon: CheckCheck,
    },
    {
      title: "Negotiation",
      value: String(stats.countered),
      subtitle: "Countered offers",
      icon: AlertCircle,
    },
    {
      title: "Rejected",
      value: String(stats.rejected),
      subtitle: "Rejected offers",
      icon: AlertCircle,
    },
  ];

  return <Stats data={statsData} className="lg:grid-cols-5" />;
}
