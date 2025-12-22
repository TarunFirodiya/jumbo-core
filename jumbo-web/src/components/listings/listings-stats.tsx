"use client";

import { Building2, Home, Key, TrendingUp } from "lucide-react";

const statsData = [
  {
    label: "Total Listings",
    value: "142",
    subValue: "+12 from last month",
    icon: Building2,
    color: "text-blue-600",
  },
  {
    label: "Active Listings",
    value: "89",
    subValue: "64% occupancy",
    icon: Home,
    color: "text-emerald-600",
  },
  {
    label: "Sold This Month",
    value: "12",
    subValue: "+24% vs last month",
    icon: TrendingUp,
    color: "text-purple-600",
  },
  {
    label: "Under Contract",
    value: "8",
    subValue: "Avg 14 days to close",
    icon: Key,
    color: "text-orange-600",
  },
];

export function ListingsStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 p-3 sm:p-4 lg:p-6 rounded-xl border bg-card">
      {statsData.map((stat, index) => (
        <div key={stat.label} className="flex items-start">
          <div className="flex-1 space-y-2 sm:space-y-4 lg:space-y-6">
            <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground">
              <stat.icon className={`size-3.5 sm:size-[18px] ${stat.color}`} />
              <span className="text-[10px] sm:text-xs lg:text-sm font-medium truncate">
                {stat.label}
              </span>
            </div>
            <p className="text-lg sm:text-xl lg:text-[28px] font-semibold leading-tight tracking-tight">
              {stat.value}
            </p>
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[10px] sm:text-xs lg:text-sm font-medium">
              <span className="text-muted-foreground">{stat.subValue}</span>
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

