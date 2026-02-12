"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  GenericDataTable,
  SortableHeader,
} from "@/components/ui/generic-data-table";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Eye, Pencil, Trash2, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LeadWithRelations } from "@/types";

interface BuyersTableProps {
  data: LeadWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const leadStatusOptions = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export const columns: ColumnDef<LeadWithRelations>[] = [
  {
    id: "contact.name",
    accessorFn: (row) => row.contact?.name ?? "",
    header: ({ column }) => (
      <SortableHeader column={column}>Name</SortableHeader>
    ),
    cell: ({ row }) => (
      <Link
        href={`/buyers/${row.original.id}`}
        className="font-medium text-sm truncate hover:underline block max-w-[200px]"
      >
        {row.original.contact?.name || "Unknown"}
      </Link>
    ),
  },
  {
    id: "budget",
    header: "Budget",
    cell: ({ row }) => {
      const req = row.original.requirementJson as {
        budget_min?: number;
        budget_max?: number;
      } | null;
      if (req?.budget_min && req?.budget_max) {
        return (
          <span className="text-muted-foreground tabular-nums text-xs sm:text-sm">
            {(req.budget_min / 100000).toFixed(1)}L – {(req.budget_max / 100000).toFixed(1)}L
          </span>
        );
      }
      if (req?.budget_min)
        return (
          <span className="text-muted-foreground tabular-nums text-xs sm:text-sm">
            &gt; {(req.budget_min / 100000).toFixed(1)}L
          </span>
        );
      if (req?.budget_max)
        return (
          <span className="text-muted-foreground tabular-nums text-xs sm:text-sm">
            &lt; {(req.budget_max / 100000).toFixed(1)}L
          </span>
        );
      return <span className="text-muted-foreground">–</span>;
    },
  },
  {
    id: "localities",
    header: "Preferred Areas",
    cell: ({ row }) => {
      const req = row.original.requirementJson as {
        localities?: string[];
      } | null;
      const localities = req?.localities;
      if (!localities || localities.length === 0)
        return <span className="text-muted-foreground text-sm">–</span>;
      const display = localities.slice(0, 2).join(", ");
      const extra = localities.length > 2 ? ` +${localities.length - 2}` : "";
      return (
        <span className="text-muted-foreground text-xs sm:text-sm truncate block max-w-[180px]" title={localities.join(", ")}>
          {display}{extra}
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <SortableHeader column={column}>Status</SortableHeader>
    ),
    cell: ({ row }) => <StatusBadge status={row.getValue("status") as string} />,
  },
  {
    id: "agent",
    header: "Agent",
    cell: ({ row }) => {
      const agent = row.original.assignedAgent;
      return (
        <div className="flex items-center gap-2">
          <Avatar className="size-6 bg-muted">
            <AvatarFallback className="text-[10px] font-extrabold text-muted-foreground uppercase">
              {agent?.fullName?.substring(0, 2).toUpperCase() || "??"}
            </AvatarFallback>
          </Avatar>
          <span className="text-muted-foreground text-xs sm:text-sm truncate max-w-[120px]">
            {agent?.fullName || "Unassigned"}
          </span>
        </div>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/buyers/${row.original.id}`} className="flex items-center">
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Buyer
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

export function BuyersTable({ data }: BuyersTableProps) {
  return (
    <GenericDataTable
      columns={columns}
      data={data}
      searchPlaceholder="Search buyers..."
      filters={[
        { column: "status", label: "Status", options: leadStatusOptions },
      ]}
      enableSelection
      emptyIcon={
        <div className="rounded-full bg-muted p-4">
          <Users className="size-8 text-muted-foreground/60" />
        </div>
      }
      emptyMessage="No buyers found"
      emptyDescription="Buyers will appear here once leads are created."
    />
  );
}
