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
import { offers, type Offer } from "@/mock-data/offers";
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

interface KanbanOffer extends KanbanItemProps {
  original: Offer;
}

const COLUMNS: KanbanColumnProps[] = [
  { id: "Pending", name: "Pending" },
  { id: "Countered", name: "Countered" },
  { id: "Accepted", name: "Accepted" },
  { id: "Rejected", name: "Rejected" },
];

export function OffersKanban() {
  const [searchQuery, setSearchQuery] = useState("");
  const [agentFilter, setAgentFilter] = useState<string>("all");

  const agents = useMemo(() => {
    const agentSet = new Set(offers.map((o) => o.agent));
    return Array.from(agentSet);
  }, []);

  const initialData: KanbanOffer[] = useMemo(() => {
    return offers
      .filter((offer) => {
        const matchesSearch =
          offer.property.toLowerCase().includes(searchQuery.toLowerCase()) ||
          offer.buyer.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesAgent =
          agentFilter === "all" || offer.agent === agentFilter;
        return matchesSearch && matchesAgent;
      })
      .map((offer) => ({
        id: offer.id,
        name: offer.property,
        column: offer.status,
        original: offer,
      }));
  }, [searchQuery, agentFilter]);

  const [tasks, setTasks] = useState<KanbanOffer[]>(initialData);

  useEffect(() => {
    setTasks(initialData);
  }, [initialData]);

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
          onDataChange={(newData) => setTasks(newData)}
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
                {(item) => (
                  <KanbanCard
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    className="p-3 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <span className="font-medium text-sm block truncate">
                                {item.original.property}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                <User className="size-3 shrink-0" />
                                <span className="truncate">{item.original.buyer}</span>
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
                          <DropdownMenuItem>
                            <Eye className="size-4 mr-2" /> View Details
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
                            ₹{item.original.amount.toLocaleString()}
                        </div>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            <span>{item.original.date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t mt-2">
                         <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span>{item.original.agent}</span>
                            <Avatar className="size-5">
                                <AvatarFallback className="text-[9px]">
                                    {item.original.agentInitials}
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
