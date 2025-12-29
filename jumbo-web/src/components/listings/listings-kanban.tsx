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
  Home,
  BedDouble,
  Maximize,
} from "lucide-react";
import { cn, formatINR } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import type { ListingWithRelations } from "@/types";

// Status labels
const statusLabels: Record<string, string> = {
  draft: "Draft",
  inspection_pending: "Inspection Pending",
  active: "Active",
  inactive: "Inactive",
  sold: "Sold",
};

// Transform DB listing to kanban format
type KanbanListingData = {
  id: string;
  unitNumber: string;
  buildingName: string;
  locality: string;
  bhk: number | null;
  carpetArea: number | null;
  floorNumber: number | null;
  askingPrice: string | null;
  status: string;
  listingAgentName: string;
  listingAgentInitials: string;
  images: string[];
};

function transformListingForKanban(listing: ListingWithRelations): KanbanListingData {
  const unit = listing.unit;
  const building = unit?.building;
  const agent = listing.listingAgent;
  
  const agentName = agent?.fullName || "Unassigned";
  const agentInitials = agent?.fullName
    ? agent.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  return {
    id: listing.id,
    unitNumber: unit?.unitNumber || "N/A",
    buildingName: building?.name || "Unknown Building",
    locality: building?.locality || "Unknown",
    bhk: unit?.bhk || null,
    carpetArea: unit?.carpetArea || null,
    floorNumber: unit?.floorNumber || null,
    askingPrice: listing.askingPrice,
    status: listing.status || "draft",
    listingAgentName: agentName,
    listingAgentInitials: agentInitials,
    images: Array.isArray(listing.images) ? listing.images : [],
  };
}

interface KanbanListing extends KanbanItemProps {
  original: KanbanListingData;
}

interface ListingsKanbanProps {
  data: ListingWithRelations[];
}

const COLUMNS: KanbanColumnProps[] = [
  { id: "draft", name: "Draft" },
  { id: "inspection_pending", name: "Inspection Pending" },
  { id: "active", name: "Active" },
  { id: "inactive", name: "Inactive" },
  { id: "sold", name: "Sold" },
];

export function ListingsKanban({ data }: ListingsKanbanProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [agentFilter, setAgentFilter] = useState<string>("all");

  const transformedData = useMemo(() => data.map(transformListingForKanban), [data]);

  const agents = useMemo(() => {
    const agentSet = new Set(transformedData.map((l) => l.listingAgentName));
    return Array.from(agentSet);
  }, [transformedData]);

  const initialData: KanbanListing[] = useMemo(() => {
    return transformedData
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
  }, [transformedData, searchQuery, agentFilter]);

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
                {(item: KanbanListing) => (
                  <KanbanCard
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    column={item.column}
                    className="p-3 space-y-3"
                  >
                    <div className="flex gap-3">
                        <div className="relative size-16 rounded-md overflow-hidden shrink-0 bg-muted">
                            {item.original.images && item.original.images.length > 0 ? (
                                <Image
                                    src={item.original.images[0]}
                                    alt={item.original.buildingName}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                    No Image
                                </div>
                            )}
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
                                {item.original.askingPrice ? formatINR(item.original.askingPrice) : "Price not set"}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground border-t pt-2">
                         {item.original.bhk && (
                            <div className="flex items-center gap-1">
                                <BedDouble className="size-3" />
                                <span>{item.original.bhk} BHK</span>
                            </div>
                         )}
                        {item.original.carpetArea && (
                            <div className="flex items-center gap-1">
                                <Maximize className="size-3" />
                                <span>{item.original.carpetArea} sqft</span>
                            </div>
                        )}
                         {item.original.floorNumber && (
                            <div className="flex items-center gap-1">
                                <Home className="size-3" />
                                <span>Floor {item.original.floorNumber}</span>
                            </div>
                         )}
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
