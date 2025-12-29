"use client";

import { BuyersStats } from "@/components/buyers/buyers-stats";
import { BuyersTable } from "@/components/buyers/buyers-table";
import { BuyersKanban } from "@/components/buyers/buyers-kanban";
import { NewLeadForm } from "@/components/buyers/new-lead-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LayoutGrid, List, Plus } from "lucide-react";
import type { LeadWithRelations } from "@/types";
import { useState, useEffect } from "react";

interface BuyersPageContentProps {
  data: LeadWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    totalBuyers: number;
    activeBuyers: number;
    newThisMonth: number;
  };
}

export function BuyersPageContent({ data, pagination, stats }: BuyersPageContentProps) {
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="h1">Buyers</h1>
          <p className="p1">
            Manage potential buyers, track requirements, and follow up on leads.
          </p>
        </div>
        <Dialog open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="size-4" />
              New Lead
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
              <DialogDescription>
                Create a new lead manually.
              </DialogDescription>
            </DialogHeader>
            <NewLeadForm onSuccess={() => setIsNewLeadOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <BuyersStats stats={stats} />

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
          <BuyersTable data={data} pagination={pagination} />
        </TabsContent>
        <TabsContent value="kanban" className="m-0 h-[calc(100vh-380px)]">
          <BuyersKanban data={data} />
        </TabsContent>
      </Tabs>
    </>
  );
}

