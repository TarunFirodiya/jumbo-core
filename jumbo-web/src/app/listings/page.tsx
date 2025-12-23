"use client";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ListingsStats } from "@/components/listings/listings-stats";
import { ListingsTable } from "@/components/listings/listings-table";
import { ListingsKanban } from "@/components/listings/listings-kanban";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, List } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ListingsPage() {
  return (
    <SidebarProvider className="bg-sidebar">
      <DashboardSidebar />
      <div className="h-svh overflow-hidden lg:p-2 w-full">
        <div className="lg:border lg:rounded-md overflow-hidden flex flex-col items-center justify-start bg-container h-full w-full bg-background">
          <DashboardHeader />
          <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 bg-background w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="h1">Listings</h1>
                <p className="p1">
                  Manage your property inventory and listings.
                </p>
              </div>
              <Button asChild size="sm" className="hidden sm:flex">
                <Link href="/listings/new">
                  <Plus className="size-4 mr-2" />
                  New Listing
                </Link>
              </Button>
            </div>

            <ListingsStats />

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
                <ListingsTable />
              </TabsContent>
              <TabsContent value="kanban" className="m-0 h-[calc(100vh-380px)]">
                <ListingsKanban />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
