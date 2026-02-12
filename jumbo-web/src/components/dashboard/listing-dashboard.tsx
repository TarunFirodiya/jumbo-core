"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  ClipboardCheck,
  FileEdit,
  Camera,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { MyTasksWidget } from "./my-tasks-widget";
import { NotificationsWidget } from "./notifications-widget";
import Link from "next/link";

interface ListingAgentStats {
  newSellerLeads: number;
  pendingInspections: number;
  draftListings: number;
  cataloguePending: number;
}

interface RoleDashboardData {
  role: string;
  stats: ListingAgentStats;
  tasks: any[];
  notifications: any[];
  unreadCount: number;
}

export function ListingDashboard({ viewAs }: { viewAs?: string }) {
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
        console.error("Error fetching listing dashboard:", error);
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

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="New Seller Leads"
          value={stats.newSellerLeads}
          subtitle="Awaiting contact"
          icon={UserPlus}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <MetricCard
          title="Pending Inspections"
          value={stats.pendingInspections}
          subtitle="Schedule required"
          icon={ClipboardCheck}
          color="text-orange-600"
          bgColor="bg-orange-50"
        />
        <MetricCard
          title="Draft Listings"
          value={stats.draftListings}
          subtitle="In progress"
          icon={FileEdit}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
        <MetricCard
          title="Catalogue Pending"
          value={stats.cataloguePending}
          subtitle="Awaiting photography"
          icon={Camera}
          color="text-teal-600"
          bgColor="bg-teal-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Action Items */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Action Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.cataloguePending > 0 && (
              <ActionItem
                title="Approve Catalogues"
                description={`${stats.cataloguePending} listing${stats.cataloguePending > 1 ? "s" : ""} awaiting catalogue approval`}
                href="/listings?status=catalogue_pending"
                badge={stats.cataloguePending}
                badgeColor="bg-teal-100 text-teal-700"
              />
            )}
            {stats.pendingInspections > 0 && (
              <ActionItem
                title="Schedule Inspections"
                description={`${stats.pendingInspections} listing${stats.pendingInspections > 1 ? "s" : ""} need inspection scheduling`}
                href="/listings?status=inspection_pending"
                badge={stats.pendingInspections}
                badgeColor="bg-orange-100 text-orange-700"
              />
            )}
            {stats.newSellerLeads > 0 && (
              <ActionItem
                title="Contact New Seller Leads"
                description={`${stats.newSellerLeads} new seller lead${stats.newSellerLeads > 1 ? "s" : ""} to reach out to`}
                href="/seller-leads?status=new"
                badge={stats.newSellerLeads}
                badgeColor="bg-blue-100 text-blue-700"
              />
            )}
            {stats.draftListings > 0 && (
              <ActionItem
                title="Complete Draft Listings"
                description={`${stats.draftListings} draft listing${stats.draftListings > 1 ? "s" : ""} to finalize`}
                href="/listings?status=draft"
                badge={stats.draftListings}
                badgeColor="bg-purple-100 text-purple-700"
              />
            )}
            {stats.cataloguePending === 0 &&
              stats.pendingInspections === 0 &&
              stats.newSellerLeads === 0 &&
              stats.draftListings === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No action items. You&apos;re all caught up!
                </p>
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
  icon: typeof UserPlus;
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

function ActionItem({
  title,
  description,
  href,
  badge,
  badgeColor,
}: {
  title: string;
  description: string;
  href: string;
  badge: number;
  badgeColor: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{title}</p>
          <Badge className={`text-[10px] px-1.5 py-0 ${badgeColor} border-0`}>
            {badge}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <ArrowRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
    </Link>
  );
}
