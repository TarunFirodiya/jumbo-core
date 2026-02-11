"use client";

import * as React from "react";
import { Loader2, UserPlus, Pencil, Trash2, Clock } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

import { Card, CardContent } from "@/components/ui/card";

import type { AuditLogWithRelations } from "@/types";

interface ActivityTabProps {
  entityType: "lead" | "seller_lead" | "visit";
  entityId: string;
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  if (isToday(date)) return `Today at ${format(date, "h:mm a")}`;
  if (isYesterday(date)) return `Yesterday at ${format(date, "h:mm a")}`;
  return format(date, "MMM d, yyyy 'at' h:mm a");
}

function formatChangeDescription(changes: Record<string, { old: unknown; new: unknown }>): string[] {
  return Object.entries(changes).map(([field, { old: oldVal, new: newVal }]) => {
    const fieldLabel = field
      .replace(/_/g, " ")
      .replace(/([A-Z])/g, " $1")
      .toLowerCase()
      .trim();
    const oldStr = oldVal == null || oldVal === "" ? "empty" : String(oldVal);
    const newStr = newVal == null || newVal === "" ? "empty" : String(newVal);
    return `${fieldLabel} changed from "${oldStr}" to "${newStr}"`;
  });
}

function ActionIcon({ action }: { action: string }) {
  switch (action) {
    case "create":
      return <UserPlus className="size-4" />;
    case "update":
      return <Pencil className="size-4" />;
    case "delete":
      return <Trash2 className="size-4" />;
    default:
      return <Clock className="size-4" />;
  }
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
          <div className="relative border-l border-muted ml-4 pl-8 space-y-8 pb-4">
            {auditLogs.map((log) => {
              const changes = log.changes as Record<string, { old: unknown; new: unknown }> | null;
              const descriptions = changes ? formatChangeDescription(changes) : [];

              return (
                <div key={log.id} className="relative">
                  <div className="absolute -left-8 -translate-x-1/2 top-1 bg-background rounded-full border p-1.5 z-10 shadow-sm text-primary">
                    <ActionIcon action={log.action} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-foreground capitalize">{log.action}</h4>
                        {log.performedBy && (
                          <span className="text-xs text-muted-foreground">
                            by {log.performedBy.fullName}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {log.createdAt ? formatTimestamp(new Date(log.createdAt).toISOString()) : ""}
                      </span>
                    </div>
                    {descriptions.length > 0 && (
                      <div className="mt-1 bg-muted/30 p-3 rounded-md border space-y-1">
                        {descriptions.map((desc, i) => (
                          <p key={i} className="text-sm text-muted-foreground">{desc}</p>
                        ))}
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
  );
}
