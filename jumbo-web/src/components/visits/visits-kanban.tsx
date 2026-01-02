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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Clock,
  MapPin,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { VisitFormatted } from "@/app/(dashboard)/visits/page";
import { toast } from "sonner";

interface KanbanVisit extends KanbanItemProps {
  original: VisitFormatted;
}

interface VisitsKanbanProps {
  data: VisitFormatted[];
}

const COLUMNS: KanbanColumnProps[] = [
  { id: "Scheduled", name: "Scheduled" },
  { id: "Pending", name: "Pending" },
  { id: "Completed", name: "Completed" },
  { id: "Cancelled", name: "Cancelled" },
];

export function VisitsKanban({ data }: VisitsKanbanProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [agentFilter, setAgentFilter] = useState<string>("all");

  const agents = useMemo(() => {
    const agentSet = new Set(data.map((v) => v.agent.name));
    return Array.from(agentSet);
  }, [data]);

  const initialData: KanbanVisit[] = useMemo(() => {
    return data
      .filter((visit) => {
        const matchesSearch =
          visit.property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          visit.client.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesAgent =
          agentFilter === "all" || visit.agent.name === agentFilter;
        return matchesSearch && matchesAgent;
      })
      .map((visit) => ({
        id: visit.id,
        name: visit.property.name,
        column: visit.status,
        original: visit,
      }));
  }, [data, searchQuery, agentFilter]);

  const [tasks, setTasks] = useState<KanbanVisit[]>(initialData);

  useEffect(() => {
    setTasks(initialData);
  }, [initialData]);

  // Handle drag and drop status updates
  const handleDataChange = async (newData: KanbanVisit[]) => {
    setTasks(newData);
    
    // Find visits that changed status
    const statusUpdates = newData
      .filter((item) => {
        const original = data.find((v) => v.id === item.id);
        return original && original.status !== item.column;
      })
      .map((item) => ({
        id: item.id,
        status: item.column.toLowerCase(), // Convert to lowercase for API
      }));

    // Update each changed visit
    for (const update of statusUpdates) {
      try {
        const response = await fetch(`/api/v1/visits/${update.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: update.status }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to update visit status");
        }
      } catch (error) {
        console.error("Error updating visit status:", error);
        toast.error(error instanceof Error ? error.message : "Failed to update visit status");
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
            placeholder="Search visits..."
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
                {(item: KanbanVisit) => (
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
                            {item.original.property.name}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="size-3 shrink-0" />
                            <span className="truncate">
                              {item.original.property.address}
                            </span>
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
                            <Link href={`/visits/${item.id}`} className="cursor-pointer w-full">
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
                       <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="size-3" />
                        <span className="truncate">Client: {item.original.client.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            <span>{item.original.dateTime.date}</span>
                        </div>
                         {item.original.dateTime.time && (
                             <div className="flex items-center gap-1">
                                <Clock className="size-3" />
                                <span>{item.original.dateTime.time}</span>
                            </div>
                         )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t mt-2">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span>Agent: {item.original.agent.name}</span>
                            <Avatar className="size-5">
                                <AvatarImage src={item.original.agent.image} />
                                <AvatarFallback className="text-[9px]">
                                    {item.original.agent.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
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
