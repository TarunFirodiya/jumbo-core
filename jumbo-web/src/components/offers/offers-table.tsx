"use client";

import * as React from "react";
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
import { offers } from "@/mock-data/offers";

// Define Offer type based on mock data
interface Offer {
  id: string;
  property: string;
  buyer: string;
  status: string;
  amount: number;
  agent: string;
  agentInitials: string;
  date: string;
}

export const columns: ColumnDef<Offer>[] = [
  {
    accessorKey: "property",
    header: "Property",
    cell: ({ row }) => <div className="font-medium truncate">{row.getValue("property")}</div>,
  },
  {
    accessorKey: "buyer",
    header: "Buyer",
    cell: ({ row }) => <div className="text-muted-foreground truncate">{row.getValue("buyer")}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant="secondary" className="bg-purple-100 text-purple-700 font-medium text-xs whitespace-nowrap">
        {row.getValue("status")}
      </Badge>
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => (
      <div className="text-muted-foreground tabular-nums whitespace-nowrap">
        ₹{Number(row.getValue("amount")).toLocaleString()}
      </div>
    ),
  },
  {
    accessorKey: "agent",
    header: "Agent",
    cell: ({ row }) => {
      const offer = row.original;
      return (
        <div className="flex items-center gap-2">
          <Avatar className="size-6 bg-muted">
            <AvatarFallback className="text-[10px] font-extrabold text-muted-foreground uppercase">
              {offer.agentInitials}
            </AvatarFallback>
          </Avatar>
          <span className="text-muted-foreground text-sm truncate">{offer.agent}</span>
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
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Offer
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

export function OffersTable() {
  return <DataTable columns={columns} data={offers} filterColumn="property" />;
}
