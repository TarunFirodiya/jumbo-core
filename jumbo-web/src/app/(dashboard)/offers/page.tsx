"use client";

import { OffersStats } from "@/components/offers/offers-stats";
import { OffersTable } from "@/components/offers/offers-table";
import { OffersKanban } from "@/components/offers/offers-kanban";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, List } from "lucide-react";

export default function OffersPage() {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="h1">Offers</h1>
          <p className="p1">
            Track and manage property offers.
          </p>
        </div>
      </div>

      <OffersStats />

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
          <OffersTable />
        </TabsContent>
        <TabsContent value="kanban" className="m-0 h-[calc(100vh-380px)]">
          <OffersKanban />
        </TabsContent>
      </Tabs>
    </>
  );
}
