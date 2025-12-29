"use client";

import { VisitsStats } from "@/components/visits/visits-stats";
import { VisitsTable } from "@/components/visits/visits-table";
import { VisitsKanban } from "@/components/visits/visits-kanban";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, List } from "lucide-react";
import type { VisitFormatted } from "@/app/(dashboard)/visits/page";

interface VisitsPageContentProps {
  data: VisitFormatted[];
  stats: {
    totalVisits: number;
    scheduledVisits: number;
    completedVisits: number;
    pendingVisits: number;
  };
}

export function VisitsPageContent({ data, stats }: VisitsPageContentProps) {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="h1">Visits</h1>
          <p className="p1">
            Schedule and manage property visits.
          </p>
        </div>
      </div>

      <VisitsStats stats={stats} />

      <Tabs defaultValue="list" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid w-[200px] grid-cols-2">
            <TabsTrigger value="list" className="gap-2">
              <List className="size-4" />
              List
            </TabsTrigger>
            <TabsTrigger value="kanban" className="gap-2">
              <LayoutGrid className="size-4" />
              Board
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list" className="m-0">
          <VisitsTable data={data} />
        </TabsContent>
        <TabsContent value="kanban" className="m-0 h-[calc(100vh-380px)]">
          <VisitsKanban data={data} />
        </TabsContent>
      </Tabs>
    </>
  );
}

