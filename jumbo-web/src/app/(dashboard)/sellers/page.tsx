"use client";

import { SellersStats } from "@/components/sellers/sellers-stats";
import { SellersTable } from "@/components/sellers/sellers-table";
import { SellersKanban } from "@/components/sellers/sellers-kanban";
import { NewSellerForm } from "@/components/sellers/new-seller-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LayoutGrid, List, Plus } from "lucide-react";
import { useState } from "react";

export default function SellersPage() {
  const [isNewSellerOpen, setIsNewSellerOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="h1">Seller Leads</h1>
          <p className="p1">
            Manage property seller leads and track their journey.
          </p>
        </div>
        <Dialog open={isNewSellerOpen} onOpenChange={setIsNewSellerOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="size-4" />
              New Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Seller Lead</DialogTitle>
              <DialogDescription>
                Create a new seller lead to track through your pipeline.
              </DialogDescription>
            </DialogHeader>
            <NewSellerForm onSuccess={() => setIsNewSellerOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <SellersStats />

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
          <SellersTable />
        </TabsContent>
        <TabsContent value="kanban" className="m-0 h-[calc(100vh-380px)]">
          <SellersKanban />
        </TabsContent>
      </Tabs>
    </>
  );
}
