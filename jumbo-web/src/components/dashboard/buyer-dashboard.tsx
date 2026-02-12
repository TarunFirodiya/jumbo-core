"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Handshake, CalendarCheck, Phone } from "lucide-react";
import { Loader2 } from "lucide-react";
import { MyTasksWidget } from "./my-tasks-widget";
import { NotificationsWidget } from "./notifications-widget";

interface BuyerAgentStats {
  newLeads: number;
  activeDeals: number;
  visitsScheduled: number;
  pipeline: Array<{ status: string; count: number }>;
  todayFollowUps: number;
}

interface RoleDashboardData {
  role: string;
  stats: BuyerAgentStats;
  tasks: any[];
  notifications: any[];
  unreadCount: number;
}

const PIPELINE_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  active_visitor: "Active Visitor",
  at_risk: "At Risk",
  closed: "Closed",
};

const PIPELINE_COLORS: Record<string, string> = {
  new: "bg-blue-500",
  contacted: "bg-yellow-500",
  active_visitor: "bg-green-500",
  at_risk: "bg-red-500",
  closed: "bg-gray-500",
};

export function BuyerDashboard({ viewAs }: { viewAs?: string }) {
  const { profile, user } = useAuth();
  const [data, setData] = useState<RoleDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const fetchData = async () => {
      try {
        const params = viewAs ? `?viewAs=${viewAs}` : "";
        const response = await fetch(`/api/v1/dashboard/role-stats${params}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error("Error fetching buyer dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [profile, viewAs]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  const { stats, tasks, notifications, unreadCount } = data;
  const totalPipeline = stats.pipeline.reduce((sum, p) => sum + p.count, 0);

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="New Leads"
          value={stats.newLeads}
          subtitle="This month"
          icon={Users}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <MetricCard
          title="Active Deals"
          value={stats.activeDeals}
          subtitle="Contacted + Active"
          icon={Handshake}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <MetricCard
          title="Visits Scheduled"
          value={stats.visitsScheduled}
          subtitle="Upcoming"
          icon={CalendarCheck}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
        <MetricCard
          title="Today's Follow-ups"
          value={stats.todayFollowUps}
          subtitle="Calls & contacts"
          icon={Phone}
          color="text-amber-600"
          bgColor="bg-amber-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Widget */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Lead Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            {totalPipeline === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No leads in your pipeline yet.
              </p>
            ) : (
              <div className="space-y-3">
                {/* Pipeline bar */}
                <div className="flex rounded-full overflow-hidden h-3">
                  {stats.pipeline
                    .filter((p) => p.count > 0)
                    .map((p) => (
                      <div
                        key={p.status}
                        className={`${PIPELINE_COLORS[p.status] || "bg-gray-400"}`}
                        style={{ width: `${(p.count / totalPipeline) * 100}%` }}
                      />
                    ))}
                </div>
                {/* Pipeline legend */}
                <div className="flex flex-wrap gap-4">
                  {stats.pipeline.map((p) => (
                    <div key={p.status} className="flex items-center gap-2">
                      <div
                        className={`size-3 rounded-full ${
                          PIPELINE_COLORS[p.status] || "bg-gray-400"
                        }`}
                      />
                      <span className="text-sm text-muted-foreground">
                        {PIPELINE_LABELS[p.status] || p.status}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {p.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <NotificationsWidget notifications={notifications} unreadCount={unreadCount} />
      </div>

      {/* Tasks */}
      <MyTasksWidget tasks={tasks} />
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  bgColor,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: typeof Users;
  color: string;
  bgColor: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className={`${bgColor} p-3 rounded-lg`}>
            <Icon className={`size-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
