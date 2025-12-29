"use client";

import { AlertCircle, CheckCheck, Clock, FileText } from "lucide-react";
import { Stats, type StatItem } from "@/components/ui/stats";

const statsData: StatItem[] = [
  {
    title: "Total Offers",
    value: "156",
    change: "+18%",
    changeType: "positive",
    icon: FileText,
  },
  {
    title: "Pending Response",
    value: "28",
    change: "-5%",
    changeType: "positive",
    icon: Clock,
  },
  {
    title: "Accepted",
    value: "45",
    change: "+12%",
    changeType: "positive",
    icon: CheckCheck,
  },
  {
    title: "Negotiation",
    value: "12",
    change: "+2%",
    changeType: "positive",
    icon: AlertCircle,
  },
  {
    title: "Rejected",
    value: "71",
    change: "+5%",
    changeType: "negative",
    icon: AlertCircle,
  },
];

export function OffersStats() {
  return <Stats data={statsData} className="lg:grid-cols-5" />;
}
