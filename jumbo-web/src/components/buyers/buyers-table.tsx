"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
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

export const columns: ColumnDef<LeadWithRelations>[] = [
  {
    id: "contact.name",
    accessorKey: "contact.name",
    header: "Buyer Name",
    cell: ({ row }) => (
      <Link href={`/buyers/${row.original.id}`} className="font-medium truncate hover:underline block">
        {row.original.contact?.name || "Unknown"}
      </Link>
    ),
  },
  {
    accessorKey: "contact.email",
    header: "Email",
    cell: ({ row }) => <div className="text-muted-foreground truncate">{row.original.contact?.email || "-"}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 font-medium text-xs whitespace-nowrap">
        {row.getValue("status")}
      </Badge>
    ),
  },
  {
    id: "budget",
    header: "Budget",
    cell: ({ row }) => {
      const req = row.original.requirementJson as any;
      if (req?.budget_min && req?.budget_max) {
        return <div className="text-muted-foreground tabular-nums text-center">{`${(req.budget_min / 100000).toFixed(1)}L - ${(req.budget_max / 100000).toFixed(1)}L`}</div>;
      }
      if (req?.budget_min) return <div className="text-muted-foreground tabular-nums text-center">{`> ${(req.budget_min / 100000).toFixed(1)}L`}</div>;
      if (req?.budget_max) return <div className="text-muted-foreground tabular-nums text-center">{`< ${(req.budget_max / 100000).toFixed(1)}L`}</div>;
      return <div className="text-muted-foreground tabular-nums text-center">-</div>;
    },
  },
  {
    accessorKey: "assignedAgent",
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
          <span className="text-muted-foreground text-sm truncate">{agent?.fullName || "Unassigned"}</span>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
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
      );
    },
  },
];

export function BuyersTable({ data }: BuyersTableProps) {
  return <DataTable columns={columns} data={data} filterColumn="contact.name" />;
}
