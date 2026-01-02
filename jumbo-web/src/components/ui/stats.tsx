"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingDown, TrendingUp, Minus } from "lucide-react";

export interface StatItem {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  subtitle?: string;
  icon?: LucideIcon;
}

interface StatsProps {
  data: StatItem[];
  className?: string;
}

export function Stats({ data, className }: StatsProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {data.map((item) => (
        <Card key={item.title} className="p-4 sm:p-6 w-full h-full flex flex-col justify-between">
          <CardContent className="p-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground min-w-0">
                {item.icon && <item.icon className="size-4 shrink-0" />}
                <span className="truncate" title={item.title}>{item.title}</span>
              </div>
              {item.change && (
                <Badge
                  variant="outline"
                  className={cn(
                    "font-medium inline-flex items-center px-1.5 py-0.5 text-xs shrink-0 whitespace-nowrap",
                    item.changeType === "positive" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
                    item.changeType === "negative" && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
                    item.changeType === "neutral" && "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                  )}
                >
                  {item.changeType === "positive" && (
                    <TrendingUp className="mr-1 size-3 shrink-0" />
                  )}
                  {item.changeType === "negative" && (
                    <TrendingDown className="mr-1 size-3 shrink-0" />
                  )}
                   {item.changeType === "neutral" && (
                    <Minus className="mr-1 size-3 shrink-0" />
                  )}
                  {item.change}
                </Badge>
              )}
            </div>
            <div className="text-2xl font-semibold text-foreground mt-3 truncate" title={String(item.value)}>
              {item.value}
            </div>
            {item.subtitle && (
              <div className="text-xs text-muted-foreground mt-1">{item.subtitle}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

