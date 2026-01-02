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
  MapPin,
  Calendar,
  Phone,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { LeadWithRelations } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface BuyersKanbanProps {
  data: LeadWithRelations[];
}

interface KanbanBuyer extends KanbanItemProps {
  original: LeadWithRelations;
}

const COLUMNS: KanbanColumnProps[] = [
  { id: "new", name: "New" },
  { id: "contacted", name: "Contacted" },
  { id: "active_visitor", name: "Active Visitor" },
  { id: "at_risk", name: "At Risk" },
  { id: "closed", name: "Closed" },
];

export function BuyersKanban({ data }: BuyersKanbanProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [agentFilter, setAgentFilter] = useState<string>("all");

  const agents = useMemo(() => {
    const agentSet = new Set(
      data
        .map((b) => b.assignedAgent?.fullName)
        .filter((name): name is string => !!name)
    );
    return Array.from(agentSet);
  }, [data]);

  const initialData: KanbanBuyer[] = useMemo(() => {
    return data
      .filter((lead) => {
        const leadName = lead.profile?.fullName || "Unknown";
        const location = (lead.requirementJson as any)?.localities?.join(", ") || "";
        
        const matchesSearch =
          leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          location.toLowerCase().includes(searchQuery.toLowerCase());
          
        const matchesAgent =
          agentFilter === "all" || lead.assignedAgent?.fullName === agentFilter;
          
        return matchesSearch && matchesAgent;
      })
      .map((lead) => ({
        id: lead.id,
        name: lead.profile?.fullName || "Unknown",
        column: lead.status || "new",
        original: lead,
      }));
  }, [data, searchQuery, agentFilter]);

  const [tasks, setTasks] = useState<KanbanBuyer[]>(initialData);

  useEffect(() => {
    setTasks(initialData);
  }, [initialData]);

  // Handle drag and drop status updates
  const handleDataChange = async (newData: KanbanBuyer[]) => {
    setTasks(newData);
    
    // Find leads that changed status
    const statusUpdates = newData
      .filter((item) => {
        const original = data.find((l) => l.id === item.id);
        return original && original.status !== item.column;
      })
      .map((item) => ({
        id: item.id,
        status: item.column,
      }));

    // Update each changed lead
    for (const update of statusUpdates) {
      try {
        const response = await fetch(`/api/v1/leads/${update.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: update.status }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to update lead status");
        }
      } catch (error) {
        console.error("Error updating lead status:", error);
        toast.error(error instanceof Error ? error.message : "Failed to update lead status");
        // Revert to original data
        setTasks(initialData);
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
            placeholder="Search buyers..."
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
                {(item: KanbanBuyer) => {
                  const lead = item.original;
                  const requirements = lead.requirementJson as any || {};
                  const budget = requirements.budget_max 
                    ? `$${(requirements.budget_max / 100000).toFixed(1)}L` 
                    : requirements.budget_desc || "No Budget";
                  const location = requirements.localities?.[0] || "No Location";

                  return (
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
                            {item.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <Link
                            href={`/buyers/${lead.id}`}
                            className="font-medium text-sm block truncate hover:underline"
                          >
                            {lead.profile?.fullName || "Unknown"}
                          </Link>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3 shrink-0" />
                            <span className="truncate">
                              {location}
                            </span>
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
                            <Link href={`/buyers/${lead.id}`}>
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
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge
                          variant="outline"
                          className="font-normal text-[10px] h-5"
                        >
                          {requirements.bhk ? `${requirements.bhk} BHK` : "Any"}
                        </Badge>
                        <span>{budget}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            <span>
                              {lead.lastContactedAt 
                                ? formatDistanceToNow(new Date(lead.lastContactedAt), { addSuffix: true }) 
                                : "Never contacted"}
                            </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t mt-2">
                        <div className="flex gap-1">
                             <Button variant="ghost" size="icon" className="size-6 h-6 w-6">
                                <Phone className="size-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="size-6 h-6 w-6">
                                <Mail className="size-3" />
                            </Button>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span>{lead.assignedAgent?.fullName || "Unassigned"}</span>
                            <Avatar className="size-5">
                                <AvatarFallback className="text-[9px]">
                                    {lead.assignedAgent?.fullName?.substring(0, 2).toUpperCase() || "?"}
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
