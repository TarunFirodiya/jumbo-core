"use client";

import { UserCheck, UserPlus, Users, Wallet } from "lucide-react";

const statsData = [
  {
    title: "Total Buyers",
    value: "2,420",
    change: "+12%",
    changeValue: "(320)",
    isPositive: true,
    icon: Users,
  },
  {
    title: "Active Buyers",
    value: "845",
    change: "+8%",
    changeValue: "(124)",
    isPositive: true,
    icon: UserCheck,
  },
  {
    title: "New This Month",
    value: "156",
    change: "-5%",
    changeValue: "(12)",
    isPositive: false,
    icon: UserPlus,
  },
  {
    title: "Total Budget",
    value: "$42M",
    change: "+15%",
    changeValue: "($5M)",
    isPositive: true,
    icon: Wallet,
  },
];

export function BuyersStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 p-3 sm:p-4 lg:p-6 rounded-xl border bg-card">
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
              <span className="text-muted-foreground hidden sm:inline">vs Last Months</span>
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

