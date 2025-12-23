"use client";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { VisitsStats } from "@/components/visits/visits-stats";
import { VisitsTable } from "@/components/visits/visits-table";
import { VisitsKanban } from "@/components/visits/visits-kanban";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, List } from "lucide-react";

export default function VisitsPage() {
  return (
    <SidebarProvider className="bg-sidebar">
      <DashboardSidebar />
      <div className="h-svh overflow-hidden lg:p-2 w-full">
        <div className="lg:border lg:rounded-md overflow-hidden flex flex-col items-center justify-start bg-container h-full w-full bg-background">
          <DashboardHeader />
          <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 bg-background w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="h1">Visits</h1>
                <p className="p1">
                  Schedule and manage property visits.
                </p>
              </div>
            </div>

            <VisitsStats />

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
                <VisitsTable />
              </TabsContent>
              <TabsContent value="kanban" className="m-0 h-[calc(100vh-380px)]">
                <VisitsKanban />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
