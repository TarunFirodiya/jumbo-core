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
import { sellers, type Seller } from "@/mock-data/sellers";
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
  Phone,
  Mail,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KanbanSeller extends KanbanItemProps {
  original: Seller;
}

const COLUMNS: KanbanColumnProps[] = [
  { id: "New", name: "New" },
  { id: "Active", name: "Active" },
  { id: "Pending", name: "Pending" },
  { id: "Inactive", name: "Inactive" },
];

export function SellersKanban() {
  const [searchQuery, setSearchQuery] = useState("");
  const [agentFilter, setAgentFilter] = useState<string>("all");

  const agents = useMemo(() => {
    const agentSet = new Set(sellers.map((b) => b.assignedAgent.name));
    return Array.from(agentSet);
  }, []);

  const initialData: KanbanSeller[] = useMemo(() => {
    return sellers
      .filter((seller) => {
        const matchesSearch =
          seller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          seller.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesAgent =
          agentFilter === "all" || seller.assignedAgent.name === agentFilter;
        return matchesSearch && matchesAgent;
      })
      .map((seller) => ({
        id: seller.id,
        name: seller.name,
        column: seller.status,
        original: seller,
      }));
  }, [searchQuery, agentFilter]);

  const [tasks, setTasks] = useState<KanbanSeller[]>(initialData);

  useEffect(() => {
    setTasks(initialData);
  }, [initialData]);

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search sellers..."
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
                          <span className="font-medium text-sm block truncate">
                            {item.original.name}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="size-3 shrink-0" />
                            <span className="truncate">
                              {item.original.email}
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

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge
                          variant="outline"
                          className="font-normal text-[10px] h-5"
                        >
                          <Home className="size-3 mr-1" />
                          {item.original.properties} Properties
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            <span>{item.original.lastContact}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t mt-2">
                        <div className="flex gap-1">
                             <Button variant="ghost" size="icon" className="size-6 h-6 w-6">
                                <Phone className="size-3" />
                            </Button>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span>{item.original.assignedAgent.name}</span>
                            <Avatar className="size-5">
                                <AvatarFallback className="text-[9px]">
                                    {item.original.assignedAgent.initials}
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
