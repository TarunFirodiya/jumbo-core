"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  Search,
  Filter,
  Globe,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { SellerLeadWithRelations } from "@/types";
import { sellerLeadStatusOptions } from "@/lib/validations/seller";

// Status badge colors
const statusColors: Record<string, { bg: string; text: string }> = {
  new: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
  proposal_sent: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" },
  proposal_accepted: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400" },
  dropped: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
};

export const columns: ColumnDef<SellerLeadWithRelations>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <Link
        href={`/sellers/${row.original.id}`}
        className="font-medium truncate hover:underline block w-full"
      >
        <div className="flex items-center gap-2">
          {row.getValue("name") || "Unknown"}
          {row.original.isNri && (
            <Globe className="size-3 text-blue-500" />
          )}
        </div>
      </Link>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const colors = statusColors[status] || statusColors.new;
      const label = sellerLeadStatusOptions.find((s) => s.value === status)?.label || status;
      return (
        <Badge className={cn(colors.bg, colors.text, "font-medium text-xs whitespace-nowrap")}>
          {label}
        </Badge>
      );
    },
  },
  {
    id: "building",
    header: "Building / Unit",
    cell: ({ row }) => {
      const building = row.original.building;
      const unit = row.original.unit;
      if (!building && !unit) {
        return <span className="text-muted-foreground">-</span>;
      }
      return (
        <div className="text-sm">
          <div className="font-medium">{building?.name || "-"}</div>
          {unit && (
            <div className="text-xs text-muted-foreground">
              Unit {unit.unitNumber}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => (
      <div className="text-muted-foreground tabular-nums">
        {row.getValue("phone")}
      </div>
    ),
  },
  {
    id: "assignedTo",
    header: "Assigned To",
    cell: ({ row }) => {
      const agent = row.original.assignedTo;
      if (!agent) {
        return <span className="text-muted-foreground text-sm">Unassigned</span>;
      }
      return (
        <div className="text-sm">{agent.fullName}</div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const lead = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/sellers/${lead.id}`} className="cursor-pointer w-full">
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function SellersTable() {
  const [data, setData] = React.useState<SellerLeadWithRelations[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const fetchSellerLeads = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter !== "all") params.set("status", statusFilter);
      
      const response = await fetch(`/api/v1/seller-leads?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error:", response.status, response.statusText, errorData);
        throw new Error(errorData.message || `Failed to fetch seller leads (${response.status})`);
      }
      const result = await response.json();
      setData(result.data);
    } catch (error) {
      console.error("Error fetching seller leads:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load seller leads");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter]);

  React.useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      fetchSellerLeads();
    }, 300);
    return () => clearTimeout(debounceTimeout);
  }, [fetchSellerLeads]);

  return (
    <div className="space-y-4">
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
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 gap-2",
                  statusFilter !== "all" && "border-primary text-primary"
                )}
              >
                <Filter className="size-4" />
                <span>Status</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={statusFilter === "all"}
                onCheckedChange={() => setStatusFilter("all")}
              >
                All Statuses
              </DropdownMenuCheckboxItem>
              {sellerLeadStatusOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={statusFilter === option.value}
                  onCheckedChange={() => setStatusFilter(option.value)}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 text-muted-foreground h-24">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading seller leads...
        </div>
      ) : (
        <DataTable columns={columns} data={data} filterColumn="name" />
      )}
    </div>
  );
}
