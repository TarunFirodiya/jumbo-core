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
import { mockListings, type MockListing, statusLabels, formatINR } from "@/mock-data/listings";
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
  Home,
  BedDouble,
  Maximize,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

interface KanbanListing extends KanbanItemProps {
  original: MockListing;
}

const COLUMNS: KanbanColumnProps[] = [
  { id: "draft", name: "Draft" },
  { id: "inspection_pending", name: "Inspection Pending" },
  { id: "active", name: "Active" },
  { id: "inactive", name: "Inactive" },
  { id: "sold", name: "Sold" },
];

export function ListingsKanban() {
  const [searchQuery, setSearchQuery] = useState("");
  const [agentFilter, setAgentFilter] = useState<string>("all");

  const agents = useMemo(() => {
    const agentSet = new Set(mockListings.map((l) => l.listingAgentName));
    return Array.from(agentSet);
  }, []);

  const initialData: KanbanListing[] = useMemo(() => {
    return mockListings
      .filter((listing) => {
        const matchesSearch =
          listing.buildingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          listing.locality.toLowerCase().includes(searchQuery.toLowerCase()) ||
          listing.unitNumber.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesAgent =
          agentFilter === "all" || listing.listingAgentName === agentFilter;
        return matchesSearch && matchesAgent;
      })
      .map((listing) => ({
        id: listing.id,
        name: listing.buildingName,
        column: listing.status,
        original: listing,
      }));
  }, [searchQuery, agentFilter]);

  const [tasks, setTasks] = useState<KanbanListing[]>(initialData);

  useEffect(() => {
    setTasks(initialData);
  }, [initialData]);

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search listings..."
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
                    <div className="flex gap-3">
                        <div className="relative size-16 rounded-md overflow-hidden shrink-0">
                            <Image
                                src={item.original.images[0]}
                                alt={item.original.buildingName}
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-1">
                                <Link
                                    href={`/listings/${item.original.id}`}
                                    className="font-medium text-sm block truncate hover:underline"
                                >
                                    {item.original.unitNumber} • {item.original.buildingName}
                                </Link>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-6 -mr-1 -mt-1"
                                    >
                                        <MoreHorizontal className="size-3" />
                                    </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <Link href={`/listings/${item.original.id}`}>
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
                             <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                <MapPin className="size-3 shrink-0" />
                                <span className="truncate">
                                    {item.original.locality}
                                </span>
                            </div>
                             <div className="font-semibold text-sm mt-1">
                                {formatINR(item.original.askingPrice)}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground border-t pt-2">
                         <div className="flex items-center gap-1">
                            <BedDouble className="size-3" />
                            <span>{item.original.bhk} BHK</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Maximize className="size-3" />
                            <span>{item.original.carpetArea} sqft</span>
                        </div>
                         <div className="flex items-center gap-1">
                            <Home className="size-3" />
                            <span>Floor {item.original.floorNumber}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t mt-2">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span>{item.original.listingAgentName}</span>
                            <Avatar className="size-5">
                                <AvatarFallback className="text-[9px]">
                                    {item.original.listingAgentInitials}
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
