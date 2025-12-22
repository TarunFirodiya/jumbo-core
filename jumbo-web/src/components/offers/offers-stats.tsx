"use client";

import { AlertCircle, CheckCheck, Clock, FileText } from "lucide-react";

const statsData = [
  {
    title: "Total Offers",
    value: "156",
    change: "+18%",
    changeValue: "(24)",
    isPositive: true,
    icon: FileText,
  },
  {
    title: "Pending Response",
    value: "28",
    change: "-5%",
    changeValue: "(2)",
    isPositive: true,
    icon: Clock,
  },
  {
    title: "Accepted",
    value: "45",
    change: "+12%",
    changeValue: "(8)",
    isPositive: true,
    icon: CheckCheck,
  },
  {
    title: "Negotiation",
    value: "12",
    change: "+2%",
    changeValue: "(1)",
    isPositive: true,
    icon: AlertCircle,
  },
  {
    title: "Rejected",
    value: "71",
    change: "+5%",
    changeValue: "(5)",
    isPositive: false,
    icon: AlertCircle,
  },
];

export function OffersStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 p-3 sm:p-4 lg:p-6 rounded-xl border bg-card">
      {statsData.map((stat, index) => (
        <div key={stat.title} className="flex items-start">
          <div className="flex-1 space-y-2 sm:space-y-4 lg:space-y-6">
            <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground">
              <stat.icon className="size-3.5 sm:size-[18px]" />
              <span className="text-[10px] sm:text-xs lg:text-sm font-medium truncate">{stat.title}</span>
            </div>
            <p className="text-lg sm:text-xl lg:text-[28px] font-semibold leading-tight tracking-tight">
              {stat.value}
            </p>
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[10px] sm:text-xs lg:text-sm font-medium">
              <span
                className={stat.isPositive ? "text-emerald-600" : "text-red-600"}
              >
                {stat.change}
                <span className="hidden sm:inline">{stat.changeValue}</span>
              </span>
            </div>
          </div>
          {index < statsData.length - 1 && (
            <div className="hidden lg:block w-px h-full bg-border mx-4 xl:mx-6" />
          )}
        </div>
      ))}
    </div>
  );
}

