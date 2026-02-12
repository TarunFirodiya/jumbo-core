"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  CheckCircle2,
  Clock,
  Navigation,
  Loader2,
  Calendar,
  User,
  Building2,
} from "lucide-react";
import { format } from "date-fns";
import { MyTasksWidget } from "./my-tasks-widget";
import { NotificationsWidget } from "./notifications-widget";

interface FieldAgentStats {
  todayVisits: number;
  completedToday: number;
  todayTours: number;
  pendingToday: number;
}

interface ScheduleItem {
  id: string;
  scheduledAt: string | null;
  status: string | null;
  visitCompleted: boolean | null;
  visitLocation: string | null;
  lead?: { id: string; contactId: string } | null;
  listing?: {
    id: string;
    buildingName: string | null;
    unitNo: string | null;
    locality: string | null;
  } | null;
}

interface RoleDashboardData {
  role: string;
  stats: FieldAgentStats;
  schedule: ScheduleItem[];
  tasks: any[];
  notifications: any[];
  unreadCount: number;
}

const STATUS_BADGE: Record<string, { label: string; variant: string }> = {
  pending: { label: "Pending", variant: "bg-yellow-100 text-yellow-700" },
  scheduled: { label: "Scheduled", variant: "bg-blue-100 text-blue-700" },
  confirmed: { label: "Confirmed", variant: "bg-green-100 text-green-700" },
  completed: { label: "Completed", variant: "bg-gray-100 text-gray-600" },
  cancelled: { label: "Cancelled", variant: "bg-red-100 text-red-700" },
  no_show: { label: "No Show", variant: "bg-red-100 text-red-700" },
};

export function FieldDashboard({ viewAs }: { viewAs?: string }) {
  const { profile } = useAuth();
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
        console.error("Error fetching field dashboard:", error);
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

  const { stats, schedule, tasks, notifications, unreadCount } = data;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Today's Visits"
          value={stats.todayVisits}
          icon={Calendar}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <MetricCard
          title="Completed"
          value={stats.completedToday}
          icon={CheckCircle2}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <MetricCard
          title="Pending"
          value={stats.pendingToday}
          icon={Clock}
          color="text-amber-600"
          bgColor="bg-amber-50"
        />
        <MetricCard
          title="Tours Today"
          value={stats.todayTours}
          icon={Navigation}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Route / Schedule */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MapPin className="size-4" />
                Today&apos;s Route
              </CardTitle>
              {stats.todayVisits > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {stats.completedToday}/{stats.todayVisits} done
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {schedule.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No visits scheduled for today.
              </p>
            ) : (
              <div className="space-y-3">
                {schedule.map((visit, index) => {
                  const statusInfo = STATUS_BADGE[visit.status || "pending"];
                  const isCompleted = visit.visitCompleted;
                  const location =
                    visit.listing
                      ? [visit.listing.buildingName, visit.listing.unitNo, visit.listing.locality]
                          .filter(Boolean)
                          .join(", ")
                      : visit.visitLocation || "Location TBD";

                  return (
                    <div
                      key={visit.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        isCompleted ? "opacity-60" : ""
                      }`}
                    >
                      {/* Timeline indicator */}
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className={`size-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            isCompleted
                              ? "bg-green-100 text-green-700"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="size-4" />
                          ) : (
                            index + 1
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Building2 className="size-3.5 text-muted-foreground" />
                            <p className="text-sm font-medium truncate">
                              {location}
                            </p>
                          </div>
                          <Badge
                            className={`text-[10px] px-1.5 py-0 border-0 ${statusInfo?.variant || ""}`}
                          >
                            {statusInfo?.label || visit.status}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 mt-1">
                          {visit.scheduledAt && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="size-3" />
                              {format(new Date(visit.scheduledAt), "h:mm a")}
                            </span>
                          )}
                        </div>

                        {!isCompleted && visit.listing?.locality && (
                          <div className="mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              onClick={() => {
                                window.open(
                                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                    location
                                  )}`,
                                  "_blank"
                                );
                              }}
                            >
                              <Navigation className="size-3" />
                              Navigate
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
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
  icon: Icon,
  color,
  bgColor,
}: {
  title: string;
  value: number;
  icon: typeof MapPin;
  color: string;
  bgColor: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`${bgColor} p-2.5 rounded-lg`}>
            <Icon className={`size-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
