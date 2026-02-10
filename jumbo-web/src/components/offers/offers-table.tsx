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
import type { Offer } from "@/services/types";
import Link from "next/link";

// Transform Offer from service to table display format
type TableOffer = {
  id: string;
  property: string;
  buyer: string;
  status: string;
  amount: number;
  agent: string;
  agentInitials: string;
  date: string;
};

function transformOffer(offer: Offer & {
  listing?: {
    unit?: {
      building?: { name: string | null } | null;
    } | null;
  } | null;
  lead?: {
    profile?: { fullName: string | null } | null;
  } | null;
  createdBy?: { fullName: string | null } | null;
}): TableOffer {
  const buildingName = offer.listing?.unit?.building?.name || "Unknown Building";
  const buyerName = offer.lead?.profile?.fullName || "Unknown Buyer";
  const agentName = offer.createdBy?.fullName || "Unassigned";
  const agentInitials = agentName
    ? agentName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";
  
  const statusLabel = offer.status?.charAt(0).toUpperCase() + (offer.status?.slice(1) || "") || "Pending";
  const amount = offer.offerAmount ? Number(offer.offerAmount) : 0;
  const date = offer.createdAt ? new Date(offer.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

  return {
    id: offer.id,
    property: buildingName,
    buyer: buyerName,
    status: statusLabel,
    amount,
    agent: agentName,
    agentInitials,
    date,
  };
}

export const columns: ColumnDef<TableOffer>[] = [
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

interface OffersTableProps {
  data: Offer[];
}

export function OffersTable({ data }: OffersTableProps) {
  const tableData = data.map(transformOffer);
  return <DataTable columns={columns} data={tableData} filterColumn="property" />;
}
