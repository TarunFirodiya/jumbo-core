"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
  type KanbanColumnProps,
  type KanbanItemProps,
} from "@/components/kibo-ui/kanban";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Calendar,
  Phone,
  Mail,
  Globe,
  Building,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import type { SellerLeadWithRelations } from "@/types";
import { sellerLeadStatusOptions } from "@/lib/validations/seller";

interface KanbanSellerLead extends KanbanItemProps {
  original: SellerLeadWithRelations;
}

const COLUMNS: KanbanColumnProps[] = sellerLeadStatusOptions.map((option) => ({
  id: option.value,
  name: option.label,
}));

export function SellersKanban() {
  const [searchQuery, setSearchQuery] = useState("");
  const [allLeads, setAllLeads] = useState<SellerLeadWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSellerLeads = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/v1/seller-leads?limit=100");
      if (!response.ok) {
        throw new Error("Failed to fetch seller leads");
      }
      const result = await response.json();
      setAllLeads(result.data || []);
    } catch (error) {
      console.error("Error fetching seller leads:", error);
      toast.error("Failed to load seller leads");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSellerLeads();
  }, [fetchSellerLeads]);

  const filteredData: KanbanSellerLead[] = useMemo(() => {
    return allLeads
      .filter((lead) => {
        const matchesSearch =
          lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.phone.includes(searchQuery);
        return matchesSearch;
      })
      .map((lead) => ({
        id: lead.id,
        name: lead.name,
        column: lead.status || "new",
        original: lead,
      }));
  }, [allLeads, searchQuery]);

  const [tasks, setTasks] = useState<KanbanSellerLead[]>(filteredData);

  useEffect(() => {
    setTasks(filteredData);
  }, [filteredData]);

  // Handle drag-and-drop status update
  const handleDataChange = async (newData: KanbanSellerLead[]) => {
    const previousTasks = tasks;
    setTasks(newData);

    // Find which item changed column
    for (const item of newData) {
      const previousItem = previousTasks.find((t) => t.id === item.id);
      if (previousItem && previousItem.column !== item.column) {
        try {
          const response = await fetch(`/api/v1/seller-leads/${item.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: item.column }),
          });
          if (!response.ok) {
            throw new Error("Failed to update status");
          }
          toast.success(`Status updated to ${sellerLeadStatusOptions.find(s => s.value === item.column)?.label}`);
          // Update original data
          setAllLeads((prev) =>
            prev.map((lead) =>
              lead.id === item.id ? { ...lead, status: item.column as any } : lead
            )
          );
        } catch (error) {
          console.error("Failed to update status:", error);
          toast.error("Failed to update status");
          setTasks(previousTasks);
        }
        break;
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 text-muted-foreground h-64">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading seller leads...
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      <div className="flex-1 overflow-x-auto min-h-0">
        <KanbanProvider
          columns={COLUMNS}
          data={tasks}
          onDataChange={handleDataChange}
          className="h-[calc(100vh-280px)] min-h-[500px]"
        >
          {(column) => (
            <KanbanBoard key={column.id} id={column.id}>
              <KanbanHeader className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{column.name}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 h-5">
                    {tasks.filter((item) => item.column === column.id).length}
                  </Badge>
                </div>
              </KanbanHeader>
              <KanbanCards id={column.id}>
                {(item: KanbanSellerLead) => (
                  <KanbanCard
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    column={item.column}
                    className="p-3 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs">
                            {item.original.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-sm block truncate">
                              {item.original.name}
                            </span>
                            {item.original.isNri && (
                              <Globe className="size-3 text-blue-500 shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="size-3 shrink-0" />
                            <span className="truncate">{item.original.phone}</span>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 -mr-1"
                          >
                            <MoreHorizontal className="size-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/sellers/${item.id}`}
                              className="cursor-pointer w-full"
                            >
                              <Eye className="size-4 mr-2" /> View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Pencil className="size-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="size-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-1.5">
                      {item.original.building && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge
                            variant="outline"
                            className="font-normal text-[10px] h-5"
                          >
                            <Building className="size-3 mr-1" />
                            {item.original.building.name}
                          </Badge>
                        </div>
                      )}

                      {item.original.followUpDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="size-3" />
                          <span>
                            {new Date(item.original.followUpDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {item.original.assignedTo && (
                      <div className="flex items-center justify-end pt-2 border-t mt-2">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span>{item.original.assignedTo.fullName}</span>
                          <Avatar className="size-5">
                            <AvatarFallback className="text-[9px]">
                              {item.original.assignedTo.fullName
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2) || "?"}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    )}
                  </KanbanCard>
                )}
              </KanbanCards>
            </KanbanBoard>
          )}
        </KanbanProvider>
      </div>
    </div>
  );
}
