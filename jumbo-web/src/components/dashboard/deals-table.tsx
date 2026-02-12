"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  GenericDataTable,
  SortableHeader,
} from "@/components/ui/generic-data-table";
import { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ClipboardList,
  MoreHorizontal,
  Eye,
  FileX2,
} from "lucide-react";
import Link from "next/link";

interface OfferRecord {
  id: string;
  offerAmount: string;
  status: string;
  createdAt: string;
  listing?: {
    id: string;
    unit?: {
      unitNumber?: string;
      building?: {
        name: string;
        locality?: string;
      };
    };
  };
  lead?: {
    contact?: {
      name: string;
      phone?: string;
    };
  };
  createdBy?: {
    fullName: string;
  };
}

const offerStatusOptions = [
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "countered", label: "Countered" },
  { value: "expired", label: "Expired" },
];

function formatAmount(amount: string) {
  const num = Number(amount);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return `₹${num.toLocaleString("en-IN")}`;
}

const columns: ColumnDef<OfferRecord>[] = [
  {
    id: "property",
    accessorFn: (row) => row.listing?.unit?.building?.name ?? "",
    header: ({ column }) => (
      <SortableHeader column={column}>Property</SortableHeader>
    ),
    cell: ({ row }) => {
      const offer = row.original;
      return (
        <div className="min-w-0">
          <span className="font-medium text-xs sm:text-sm block truncate">
            {offer.listing?.unit?.building?.name || "Unknown"}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {offer.listing?.unit?.unitNumber || ""}
          </span>
        </div>
      );
    },
  },
  {
    id: "buyer",
    accessorFn: (row) => row.lead?.contact?.name ?? "",
    header: "Buyer",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs sm:text-sm">
        {row.original.lead?.contact?.name || "—"}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <SortableHeader column={column}>Status</SortableHeader>
    ),
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: "amount",
    accessorFn: (row) => Number(row.offerAmount),
    header: ({ column }) => (
      <SortableHeader column={column}>Amount</SortableHeader>
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs sm:text-sm tabular-nums">
        {formatAmount(row.original.offerAmount)}
      </span>
    ),
  },
  {
    id: "createdBy",
    header: "Created By",
    cell: ({ row }) => {
      const offer = row.original;
      if (!offer.createdBy)
        return <span className="text-muted-foreground text-xs">—</span>;
      return (
        <div className="flex items-center gap-2">
          <Avatar className="size-5 sm:size-6 bg-muted">
            <AvatarFallback className="text-[8px] sm:text-[10px] font-extrabold text-muted-foreground uppercase">
              {offer.createdBy.fullName
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <span className="text-muted-foreground text-xs sm:text-sm">
            {offer.createdBy.fullName}
          </span>
        </div>
      );
    },
  },
  {
    id: "date",
    accessorFn: (row) => row.createdAt,
    header: ({ column }) => (
      <SortableHeader column={column}>Date</SortableHeader>
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs sm:text-sm">
        {row.original.createdAt
          ? new Date(row.original.createdAt).toLocaleDateString()
          : "—"}
      </span>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const offer = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 sm:size-8 text-muted-foreground hover:text-foreground"
            >
              <MoreHorizontal className="size-3.5 sm:size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/offers/${offer.id}`} className="cursor-pointer">
                <Eye className="size-4 mr-2" />
                View Details
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function DealsTable() {
  const [offers, setOffers] = React.useState<OfferRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [totalCount, setTotalCount] = React.useState(0);

  React.useEffect(() => {
    async function fetchOffers() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/v1/offers?limit=100`);
        if (response.ok) {
          const result = await response.json();
          setOffers(result.data || []);
          setTotalCount(result.pagination?.total || 0);
        }
      } catch (error) {
        console.error("Error fetching offers:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOffers();
  }, []);

  return (
    <Card>
      <div className="flex items-center gap-2 sm:gap-2.5 p-3 sm:px-6 sm:py-3.5">
        <Button
          variant="outline"
          size="icon"
          className="size-7 sm:size-8 shrink-0"
        >
          <ClipboardList className="size-4 sm:size-[18px] text-muted-foreground" />
        </Button>
        <span className="text-sm sm:text-base font-medium">Active Offers</span>
        <Badge variant="secondary" className="ml-1 text-[10px] sm:text-xs">
          {totalCount}
        </Badge>
      </div>

      <div className="px-3 sm:px-6 pb-3 sm:pb-4">
        <GenericDataTable
          columns={columns}
          data={offers}
          searchPlaceholder="Search offers..."
          filters={[
            {
              column: "status",
              label: "Status",
              options: offerStatusOptions,
            },
          ]}
          isLoading={isLoading}
          emptyIcon={
            <div className="rounded-full bg-muted p-4">
              <FileX2 className="size-8 text-muted-foreground/60" />
            </div>
          }
          emptyMessage="No offers yet"
          emptyDescription="Offers will appear here when buyers make offers on listings."
        />
      </div>
    </Card>
  );
}
