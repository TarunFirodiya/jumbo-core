"use client";

import { BuyersStats } from "@/components/buyers/buyers-stats";
import { BuyersTable } from "@/components/buyers/buyers-table";
import { BuyersKanban } from "@/components/buyers/buyers-kanban";
import { NewLeadForm } from "@/components/buyers/new-lead-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import type { LeadWithRelations } from "@/types";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/shared";

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
  const router = useRouter();

  const handleNewLeadSuccess = () => {
    setIsNewLeadOpen(false);
    router.refresh();
  };

  const newLeadAction = (
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
        <NewLeadForm onSuccess={handleNewLeadSuccess} />
      </DialogContent>
    </Dialog>
  );

  return (
    <PageLayout
      title="Buyers"
      description="Manage potential buyers, track requirements, and follow up on leads."
      action={newLeadAction}
      stats={<BuyersStats stats={stats} />}
      tabs={{
        listContent: <BuyersTable data={data} pagination={pagination} />,
        kanbanContent: <BuyersKanban data={data} />,
      }}
    />
  );
}

