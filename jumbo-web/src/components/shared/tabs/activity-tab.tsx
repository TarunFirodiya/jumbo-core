"use client";

import * as React from "react";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Clock,
  ArrowRightLeft,
  MessageSquare,
  UserCheck,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

import type { AuditLogWithRelations } from "@/types";

interface ActivityTabProps {
  entityType: "lead" | "seller_lead" | "visit" | "listing";
  entityId: string;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;

  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return `Yesterday ${format(date, "h:mm a")}`;
  return format(date, "MMM d, h:mm a");
}

function getDateGroupLabel(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Unknown";
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d, yyyy");
}

function getActionIcon(action: string) {
  switch (action) {
    case "status_change":
      return <ArrowRightLeft className="size-3.5" />;
    case "comment":
      return <MessageSquare className="size-3.5" />;
    case "assignment":
      return <UserCheck className="size-3.5" />;
    case "create":
      return <Plus className="size-3.5" />;
    case "update":
      return <Pencil className="size-3.5" />;
    case "delete":
      return <Trash2 className="size-3.5" />;
    default:
      return <Clock className="size-3.5" />;
  }
}

function getActionLabel(action: string): string {
  switch (action) {
    case "status_change":
      return "Status changed";
    case "comment":
      return "Comment added";
    case "assignment":
      return "Assigned";
    case "create":
      return "Created";
    case "update":
      return "Updated";
    case "delete":
      return "Deleted";
    default:
      return action.charAt(0).toUpperCase() + action.slice(1);
  }
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatFieldLabel(field: string): string {
  return field
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .toLowerCase()
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function formatValue(val: unknown): string {
  if (val == null || val === "") return "empty";
  return String(val);
}

// Group audit logs by date
function groupByDate(
  logs: AuditLogWithRelations[]
): { label: string; logs: AuditLogWithRelations[] }[] {
  const groups: Record<string, AuditLogWithRelations[]> = {};
  const order: string[] = [];

  for (const log of logs) {
    const key = log.createdAt
      ? getDateGroupLabel(new Date(log.createdAt).toISOString())
      : "Unknown";
    if (!groups[key]) {
      groups[key] = [];
      order.push(key);
    }
    groups[key].push(log);
  }

  return order.map((label) => ({ label, logs: groups[label] }));
}

export function ActivityTab({ entityType, entityId }: ActivityTabProps) {
  const [auditLogs, setAuditLogs] = React.useState<AuditLogWithRelations[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = React.useState(true);

  React.useEffect(() => {
    async function fetchAuditLogs() {
      if (!entityId) return;
      setIsLoadingLogs(true);
      try {
        const response = await fetch(
          `/api/v1/audit-logs?entityType=${entityType}&entityId=${entityId}`
        );
        if (response.ok) {
          const data = await response.json();
          setAuditLogs(data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch audit logs:", error);
      } finally {
        setIsLoadingLogs(false);
      }
    }
    fetchAuditLogs();
  }, [entityType, entityId]);

  const dateGroups = React.useMemo(() => groupByDate(auditLogs), [auditLogs]);

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-bold mb-6">Recent Activity</h3>
        {isLoadingLogs ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading activity...
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="size-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No activity recorded yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {dateGroups.map((group) => (
              <div key={group.label}>
                {/* Date group header */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.label}
                  </span>
                  <Separator className="flex-1" />
                </div>

                {/* Timeline entries */}
                <div className="relative ml-4 pl-6 border-l border-muted space-y-6">
                  {group.logs.map((log) => {
                    const changes = log.changes as Record<
                      string,
                      { old: unknown; new: unknown }
                    > | null;

                    return (
                      <div key={log.id} className="relative">
                        {/* Timeline dot */}
                        <div className="absolute -left-6 -translate-x-1/2 top-0.5 bg-background rounded-full border p-1.5 shadow-sm text-muted-foreground">
                          {getActionIcon(log.action)}
                        </div>

                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Action + performer */}
                            <div className="flex items-center gap-2">
                              {log.performedBy && (
                                <Avatar className="size-6 bg-muted shrink-0">
                                  <AvatarFallback className="text-[9px] font-bold text-muted-foreground uppercase">
                                    {getInitials(log.performedBy.fullName || "?")}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div className="min-w-0">
                                <span className="text-sm font-semibold text-foreground">
                                  {getActionLabel(log.action)}
                                </span>
                                {log.performedBy && (
                                  <span className="text-xs text-muted-foreground ml-1.5">
                                    by {log.performedBy.fullName}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Change details */}
                            {changes && Object.keys(changes).length > 0 && (
                              <div className="mt-2 bg-muted/40 rounded-md border p-3 space-y-1.5">
                                {Object.entries(changes).map(
                                  ([field, { old: oldVal, new: newVal }]) => (
                                    <div
                                      key={field}
                                      className="text-xs flex flex-wrap items-baseline gap-1"
                                    >
                                      <span className="font-medium text-muted-foreground">
                                        {formatFieldLabel(field)}:
                                      </span>
                                      <span className="text-muted-foreground line-through">
                                        {formatValue(oldVal)}
                                      </span>
                                      <span className="text-muted-foreground">&rarr;</span>
                                      <span className="font-medium text-accent-blue">
                                        {formatValue(newVal)}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          </div>

                          {/* Timestamp */}
                          <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0 pt-0.5">
                            {log.createdAt
                              ? formatRelativeTime(
                                  new Date(log.createdAt).toISOString()
                                )
                              : ""}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
