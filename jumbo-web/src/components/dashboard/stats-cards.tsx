"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, CheckCircle, FileText, Home } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

type DateFilter = "yesterday" | "this_week" | "last_week" | "this_month" | "last_3_months";

interface DashboardStats {
  userLeads: number;
  uniqueVisitorsCompleted: number;
  offers: number;
  homesAdded: number;
}

interface StatCardData {
  title: string;
  value: number;
  previousValue: number;
  dateFilter: DateFilter;
  icon: typeof Users;
}

const dateFilterOptions: { value: DateFilter; label: string }[] = [
  { value: "yesterday", label: "Yesterday" },
  { value: "this_week", label: "This Week" },
  { value: "last_week", label: "Last Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_3_months", label: "Last 3 Months" },
];


function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

function calculateChange(current: number, previous: number): {
  percentage: string;
  absolute: number;
  isPositive: boolean;
} {
  if (previous === 0) {
    return {
      percentage: current > 0 ? "+100%" : "0%",
      absolute: current,
      isPositive: current >= 0,
    };
  }
  const percentage = ((current - previous) / previous) * 100;
  const absolute = current - previous;
  return {
    percentage: `${percentage >= 0 ? "+" : ""}${percentage.toFixed(0)}%`,
    absolute,
    isPositive: percentage >= 0,
  };
}

function getFilterLabel(filter: DateFilter): string {
  return dateFilterOptions.find((opt) => opt.value === filter)?.label || "This Month";
}

export function StatsCards() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [previousStats, setPreviousStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilters, setDateFilters] = useState<Record<string, DateFilter>>({
    userLeads: "this_month",
    uniqueVisitorsCompleted: "this_month",
    offers: "this_month",
    homesAdded: "this_month",
  });

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      try {
        // Optimized: Fetch all stats in a single API call
        const params = new URLSearchParams({
          userLeadsFilter: dateFilters.userLeads,
          uniqueVisitorsFilter: dateFilters.uniqueVisitorsCompleted,
          offersFilter: dateFilters.offers,
          homesAddedFilter: dateFilters.homesAdded,
        });

        const response = await fetch(`/api/v1/dashboard/stats?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data.current);
          setPreviousStats(data.previous);
        }
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [dateFilters]);

  const handleFilterChange = async (key: string, filter: DateFilter) => {
    // Update filter immediately for responsive UI
    const newFilters = { ...dateFilters, [key]: filter };
    setDateFilters(newFilters);
    
    // Fetch all stats with new filters (single optimized call)
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        userLeadsFilter: newFilters.userLeads,
        uniqueVisitorsFilter: newFilters.uniqueVisitorsCompleted,
        offersFilter: newFilters.offers,
        homesAddedFilter: newFilters.homesAdded,
      });

      const response = await fetch(`/api/v1/dashboard/stats?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.current);
        setPreviousStats(data.previous);
      }
    } catch (error) {
      console.error("Error updating stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const statsData: StatCardData[] = [
    {
      title: "User Leads",
      value: stats?.userLeads ?? 0,
      previousValue: previousStats?.userLeads ?? 0,
      dateFilter: dateFilters.userLeads,
      icon: Users,
    },
    {
      title: "Unique Visitors Completed",
      value: stats?.uniqueVisitorsCompleted ?? 0,
      previousValue: previousStats?.uniqueVisitorsCompleted ?? 0,
      dateFilter: dateFilters.uniqueVisitorsCompleted,
      icon: CheckCircle,
    },
    {
      title: "Offers",
      value: stats?.offers ?? 0,
      previousValue: previousStats?.offers ?? 0,
      dateFilter: dateFilters.offers,
      icon: FileText,
    },
    {
      title: "Homes Added",
      value: stats?.homesAdded ?? 0,
      previousValue: previousStats?.homesAdded ?? 0,
      dateFilter: dateFilters.homesAdded,
      icon: Home,
    },
  ];

  if (isLoading && !stats) {
    return (
      <Card>
        <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 p-3 sm:p-4 lg:p-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 p-3 sm:p-4 lg:p-6">
        {statsData.map((stat, index) => {
          const change = calculateChange(stat.value, stat.previousValue);
          const filterLabel = getFilterLabel(stat.dateFilter);

          return (
            <div key={stat.title} className="flex items-start">
              <div className="flex-1 space-y-2 sm:space-y-4 lg:space-y-6">
                <div className="flex items-center justify-between gap-1 sm:gap-1.5">
                  <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground">
                    <stat.icon className="size-3.5 sm:size-[18px]" />
                    <span className="text-[10px] sm:text-xs lg:text-sm font-medium truncate">
                      {stat.title}
                    </span>
                  </div>
                  <Select
                    value={stat.dateFilter}
                    onValueChange={(value) =>
                      handleFilterChange(
                        stat.title === "User Leads"
                          ? "userLeads"
                          : stat.title === "Unique Visitors Completed"
                          ? "uniqueVisitorsCompleted"
                          : stat.title === "Offers"
                          ? "offers"
                          : "homesAdded",
                        value as DateFilter
                      )
                    }
                  >
                    <SelectTrigger className="h-6 w-fit px-2 text-[10px] sm:text-xs border-none shadow-none bg-transparent hover:bg-accent">
                      <SelectValue>{filterLabel}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {dateFilterOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-lg sm:text-xl lg:text-[28px] font-semibold leading-tight tracking-tight">
                  {formatNumber(stat.value)}
                </p>
                <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[10px] sm:text-xs lg:text-sm font-medium">
                  <span
                    className={change.isPositive ? "text-emerald-600" : "text-red-600"}
                  >
                    {change.percentage}
                    <span className="hidden sm:inline">
                      {" "}
                      ({change.absolute >= 0 ? "+" : ""}
                      {change.absolute})
                    </span>
                  </span>
                  <span className="text-muted-foreground hidden sm:inline">vs Previous</span>
                </div>
              </div>
              {index < statsData.length - 1 && (
                <div className="hidden lg:block w-px h-full bg-border mx-4 xl:mx-6" />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
