"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow, isPast, isToday } from "date-fns";

interface TaskItem {
  id: string;
  title: string;
  priority: string | null;
  dueAt: string | null;
  status: string | null;
  creator?: { fullName: string | null } | null;
}

interface MyTasksWidgetProps {
  tasks: TaskItem[];
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-green-100 text-green-700 border-green-200",
};

export function MyTasksWidget({ tasks }: MyTasksWidgetProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CheckCircle2 className="size-4" />
            My Tasks
            {tasks.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {tasks.length}
              </Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No pending tasks. You&apos;re all caught up!
          </p>
        ) : (
          <>
            {tasks.map((task) => {
              const dueDate = task.dueAt ? new Date(task.dueAt) : null;
              const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate);
              const isDueToday = dueDate && isToday(dueDate);

              return (
                <div
                  key={task.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    isOverdue
                      ? "border-red-200 bg-red-50/50"
                      : isDueToday
                      ? "border-amber-200 bg-amber-50/50"
                      : "border-border"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {task.priority && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${
                            PRIORITY_COLORS[task.priority] || ""
                          }`}
                        >
                          {task.priority}
                        </Badge>
                      )}
                      {dueDate && (
                        <span
                          className={`text-xs flex items-center gap-1 ${
                            isOverdue
                              ? "text-red-600 font-medium"
                              : isDueToday
                              ? "text-amber-600 font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          {isOverdue ? (
                            <AlertTriangle className="size-3" />
                          ) : (
                            <Clock className="size-3" />
                          )}
                          {isOverdue
                            ? `Overdue ${formatDistanceToNow(dueDate, { addSuffix: false })} ago`
                            : isDueToday
                            ? "Due today"
                            : `Due ${formatDistanceToNow(dueDate, { addSuffix: true })}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </CardContent>
    </Card>
  );
}
