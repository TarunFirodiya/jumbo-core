"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  GenericDataTable,
  SortableHeader,
} from "@/components/ui/generic-data-table";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Eye,
  Trash2,
  Globe,
  Building2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SellerLeadWithRelations } from "@/types";
import { sellerLeadStatusOptions } from "@/lib/validations/seller";
import type { SellerLead } from "@/services/types";
import type { PaginatedResult } from "@/services/types";

const sellerLeadSourceLabels: Record<string, string> = {
  website: "Website",
  "99acres": "99Acres",
  magicbricks: "Magicbricks",
  housing: "Housing.com",
  nobroker: "NoBroker",
  mygate: "MyGate",
  referral: "Referral",
};

export const columns: ColumnDef<SellerLeadWithRelations>[] = [
  {
    id: "property",
    accessorFn: (row) => row.building?.name ?? row.contact?.name ?? "",
    header: ({ column }) => (
      <SortableHeader column={column}>Property / Name</SortableHeader>
    ),
    cell: ({ row }) => {
      const building = row.original.building;
      const unit = row.original.unit;
      const contactName = row.original.contact?.name || "Unknown";
      return (
        <Link
          href={`/sellers/${row.original.id}`}
          className="block hover:underline max-w-[220px]"
        >
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">
              {building?.name || contactName}
            </span>
            {row.original.isNri && (
              <Globe className="size-3 text-accent-blue shrink-0" />
            )}
          </div>
          {unit && (
            <div className="text-xs text-muted-foreground truncate">
              Unit {unit.unitNumber}
            </div>
          )}
        </Link>
      );
    },
  },
  {
    id: "askingPrice",
    header: "Asking Price",
    cell: ({ row }) => {
      // Seller leads don't have an asking price directly — show from first listing if available
      const listings = row.original.listings;
      const price = listings?.[0]?.askingPrice;
      if (!price) return <span className="text-muted-foreground text-sm">–</span>;
      const num = Number(price);
      if (num >= 10000000)
        return <span className="text-sm tabular-nums">₹{(num / 10000000).toFixed(2)} Cr</span>;
      if (num >= 100000)
        return <span className="text-sm tabular-nums">₹{(num / 100000).toFixed(2)} L</span>;
      return <span className="text-sm tabular-nums">₹{num.toLocaleString("en-IN")}</span>;
    },
  },
  {
    id: "source",
    accessorFn: (row) => (row as SellerLead).source ?? "",
    header: ({ column }) => (
      <SortableHeader column={column}>Lead Source</SortableHeader>
    ),
    cell: ({ row }) => {
      const source = (row.original as unknown as SellerLead).source;
      if (!source) return <span className="text-muted-foreground text-sm">–</span>;
      return (
        <span className="text-muted-foreground text-xs sm:text-sm">
          {sellerLeadSourceLabels[source] ?? source}
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <SortableHeader column={column}>Status</SortableHeader>
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const label =
        sellerLeadStatusOptions.find((s) => s.value === status)?.label;
      return <StatusBadge status={status} label={label} />;
    },
  },
  {
    id: "assignedTo",
    header: "Assigned To",
    cell: ({ row }) => {
      const agent = row.original.assignedTo;
      if (!agent)
        return <span className="text-muted-foreground text-sm">Unassigned</span>;
      return <span className="text-sm">{agent.fullName}</span>;
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
            <Link
              href={`/sellers/${row.original.id}`}
              className="cursor-pointer w-full"
            >
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
    ),
  },
];

interface SellersTableProps {
  data: SellerLead[];
  pagination: PaginatedResult<SellerLead>["pagination"];
}

export function SellersTable({ data, pagination }: SellersTableProps) {
  return (
    <GenericDataTable
      columns={columns}
      data={data as SellerLeadWithRelations[]}
      searchPlaceholder="Search sellers..."
      filters={[
        {
          column: "status",
          label: "Status",
          options: sellerLeadStatusOptions.map((s) => ({
            label: s.label,
            value: s.value,
          })),
        },
      ]}
      enableSelection
      emptyIcon={
        <div className="rounded-full bg-muted p-4">
          <Building2 className="size-8 text-muted-foreground/60" />
        </div>
      }
      emptyMessage="No seller leads found"
      emptyDescription="Seller leads will appear here once created."
    />
  );
}
