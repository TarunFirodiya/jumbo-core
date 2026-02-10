"use client";

import { useMemo, useState, useEffect } from "react";
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
  type KanbanColumnProps,
  type KanbanItemProps,
} from "@/components/kibo-ui/kanban";
import type { Offer } from "@/services/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Calendar,
  User,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

interface KanbanOffer extends KanbanItemProps {
  original: Offer & {
    listing?: {
      unit?: {
        building?: { name: string | null } | null;
      } | null;
    } | null;
    lead?: {
      contact?: { name: string | null } | null;
    } | null;
    createdBy?: { fullName: string | null } | null;
  };
}

const COLUMNS: KanbanColumnProps[] = [
  { id: "pending", name: "Pending" },
  { id: "countered", name: "Countered" },
  { id: "accepted", name: "Accepted" },
  { id: "rejected", name: "Rejected" },
];

interface OffersKanbanProps {
  data: (Offer & Record<string, any>)[];
}

export function OffersKanban({ data: initialData }: OffersKanbanProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [offers, setOffers] = useState(initialData);

  // Update offers when initialData changes
  useEffect(() => {
    setOffers(initialData);
  }, [initialData]);

  const agents = useMemo(() => {
    const agentSet = new Set(
      offers
        .map((o) => o.createdBy?.fullName)
        .filter((name): name is string => !!name)
    );
    return Array.from(agentSet);
  }, [offers]);

  const transformedData: KanbanOffer[] = useMemo(() => {
    return offers
      .filter((offer) => {
        const buildingName = offer.listing?.unit?.building?.name || "";
        const buyerName = offer.lead?.contact?.name || "";
        const agentName = offer.createdBy?.fullName || "";
        
        const matchesSearch =
          buildingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          buyerName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesAgent =
          agentFilter === "all" || agentName === agentFilter;
        return matchesSearch && matchesAgent;
      })
      .map((offer) => {
        const buildingName = offer.listing?.unit?.building?.name || "Unknown Building";
        const status = offer.status || "pending";
        return {
          id: offer.id,
          name: buildingName,
          column: status,
          original: offer,
        };
      });
  }, [offers, searchQuery, agentFilter]);

  const [tasks, setTasks] = useState<KanbanOffer[]>(transformedData);

  useEffect(() => {
    setTasks(transformedData);
  }, [transformedData]);

  // Handle drag and drop status updates
  const handleDataChange = async (newData: KanbanOffer[]) => {
    setTasks(newData);
    
    // Find offers that changed status
    const statusUpdates = newData
      .filter((item) => {
        const original = offers.find((o) => o.id === item.id);
        return original && original.status !== item.column;
      })
      .map((item) => ({
        id: item.id,
        status: item.column,
      }));

    // Update each changed offer
    for (const update of statusUpdates) {
      try {
        const response = await fetch(`/api/v1/offers/${update.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: update.status }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to update offer status");
        }

        const result = await response.json();
        
        // Update local state with the response data
        setOffers((prev) =>
          prev.map((offer) =>
            offer.id === update.id ? { ...offer, status: update.status as any } : offer
          )
        );
      } catch (error) {
        console.error("Error updating offer status:", error);
        toast.error(error instanceof Error ? error.message : "Failed to update offer status");
        // Revert to original data
        setTasks(transformedData);
        break; // Stop processing other updates if one fails
      }
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search offers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 gap-2",
                  agentFilter !== "all" && "border-primary text-primary"
                )}
              >
                <Filter className="size-4" />
                <span>Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Agent</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={agentFilter === "all"}
                onCheckedChange={() => setAgentFilter("all")}
              >
                All Agents
              </DropdownMenuCheckboxItem>
              {agents.map((agent) => (
                <DropdownMenuCheckboxItem
                  key={agent}
                  checked={agentFilter === agent}
                  onCheckedChange={() => setAgentFilter(agent)}
                >
                  {agent}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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
                {(item: KanbanOffer) => {
                  const offer = item.original;
                  const buildingName = offer.listing?.unit?.building?.name || "Unknown Building";
                  const buyerName = offer.lead?.contact?.name || "Unknown Buyer";
                  const agentName = offer.createdBy?.fullName || "Unassigned";
                  const agentInitials = agentName
                    ? agentName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                    : "??";
                  const amount = offer.offerAmount ? Number(offer.offerAmount) : 0;
                  const date = offer.createdAt ? new Date(offer.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

                  return (
                    <KanbanCard
                      key={item.id}
                      id={item.id}
                      name={item.name}
                      column={item.column}
                      className="p-3 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-medium text-sm block truncate">
                            {buildingName}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <User className="size-3 shrink-0" />
                            <span className="truncate">{buyerName}</span>
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
                              <Link href={`/offers/${item.id}`}>
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

                      <div className="space-y-1.5 pt-1">
                        <div className="font-semibold text-sm">
                          ₹{amount.toLocaleString()}
                        </div>
                      
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            <span>{date}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t mt-2">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span>{agentName}</span>
                          <Avatar className="size-5">
                            <AvatarFallback className="text-[9px]">
                              {agentInitials}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    </KanbanCard>
                  );
                }}
              </KanbanCards>
            </KanbanBoard>
          )}
        </KanbanProvider>
      </div>
    </div>
  );
}
