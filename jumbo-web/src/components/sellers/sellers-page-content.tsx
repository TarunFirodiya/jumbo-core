"use client";

import { SellersStats } from "@/components/sellers/sellers-stats";
import { SellersTable } from "@/components/sellers/sellers-table";
import { SellersKanban } from "@/components/sellers/sellers-kanban";
import { NewSellerForm } from "@/components/sellers/new-seller-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useState } from "react";
import { PageLayout } from "@/components/shared";
import type { SellerLead } from "@/services/types";
import type { SellerStats } from "@/types";
import type { PaginatedResult } from "@/services/types";

interface SellersPageContentProps {
  data: SellerLead[];
  pagination: PaginatedResult<SellerLead>["pagination"];
  stats: SellerStats;
}

export function SellersPageContent({ data, pagination, stats }: SellersPageContentProps) {
  const [isNewSellerOpen, setIsNewSellerOpen] = useState(false);

  const newSellerAction = (
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
  );

  return (
    <PageLayout
      title="Seller Leads"
      description="Manage property seller leads and track their journey."
      action={newSellerAction}
      stats={<SellersStats stats={stats} />}
      tabs={{
        listContent: <SellersTable data={data} pagination={pagination} />,
        kanbanContent: <SellersKanban data={data} />,
      }}
    />
  );
}

