"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";
import { StatsCards } from "./stats-cards";
import { LeadSourcesChart } from "./lead-sources-chart";
import { RevenueFlowChart } from "./revenue-flow-chart";
import { DealsTable } from "./deals-table";
import { MyTasksWidget } from "./my-tasks-widget";
import { NotificationsWidget } from "./notifications-widget";

interface AdminDashboardData {
  role: string;
  tasks: any[];
  notifications: any[];
  unreadCount: number;
}

export function AdminDashboard() {
  const { profile } = useAuth();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const fetchData = async () => {
      try {
        const response = await fetch("/api/v1/dashboard/role-stats");
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error("Error fetching admin dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [profile]);

  return (
    <>
      <StatsCards />
      <div className="flex flex-col xl:flex-row gap-4 sm:gap-6">
        <LeadSourcesChart />
        <RevenueFlowChart />
      </div>
      {!isLoading && data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MyTasksWidget tasks={data.tasks} />
          <NotificationsWidget
            notifications={data.notifications}
            unreadCount={data.unreadCount}
          />
        </div>
      )}
      <DealsTable />
    </>
  );
}
