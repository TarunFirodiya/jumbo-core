"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  GenericDataTable,
  SortableHeader,
} from "@/components/ui/generic-data-table";
import { ColumnDef } from "@tanstack/react-table";
import { MoreVertical, Eye, CalendarDays } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VisitForm } from "@/components/visits/visit-form";

// Visit type matching the page's data shape
interface Visit {
  id: string;
  property: {
    name: string;
    address: string;
    image: string;
  };
  dateTime: {
    date: string;
    time: string;
  };
  agent: {
    name: string;
    image: string;
  };
  client: {
    name: string;
    type: string;
  };
  status: string;
}

const visitStatusOptions = [
  { value: "Scheduled", label: "Scheduled" },
  { value: "Pending", label: "Pending" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
];

export const columns: ColumnDef<Visit>[] = [
  {
    id: "property",
    accessorFn: (row) => row.property.name,
    header: ({ column }) => (
      <SortableHeader column={column}>Property</SortableHeader>
    ),
    cell: ({ row }) => {
      const visit = row.original;
      return (
        <Link
          href={`/visits/${visit.id}`}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="size-10 rounded-md bg-muted overflow-hidden shrink-0 hidden sm:block">
            <img
              src={visit.property.image}
              alt={visit.property.name}
              className="size-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-xs sm:text-sm truncate">
              {visit.property.name}
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
              {visit.property.address}
            </div>
          </div>
        </Link>
      );
    },
  },
  {
    id: "client",
    accessorFn: (row) => row.client.name,
    header: ({ column }) => (
      <SortableHeader column={column}>Buyer / Client</SortableHeader>
    ),
    cell: ({ row }) => {
      const visit = row.original;
      return (
        <div className="flex flex-col items-start gap-1">
          <span className="font-medium text-xs sm:text-sm truncate">
            {visit.client.name}
          </span>
          <Badge
            variant="outline"
            className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground whitespace-nowrap"
          >
            {visit.client.type}
          </Badge>
        </div>
      );
    },
  },
  {
    id: "dateTime",
    accessorFn: (row) => row.dateTime.date,
    header: ({ column }) => (
      <SortableHeader column={column}>Date & Time</SortableHeader>
    ),
    cell: ({ row }) => {
      const visit = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium text-xs sm:text-sm">
            {visit.dateTime.date}
          </span>
          {visit.dateTime.time && (
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              {visit.dateTime.time}
            </span>
          )}
        </div>
      );
    },
  },
  {
    id: "agent",
    accessorFn: (row) => row.agent.name,
    header: "Agent",
    cell: ({ row }) => {
      const visit = row.original;
      return (
        <div className="flex items-center gap-2">
          <Avatar className="size-5 sm:size-6">
            <AvatarImage src={visit.agent.image} />
            <AvatarFallback className="text-[10px]">
              {visit.agent.name[0]}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs sm:text-sm text-muted-foreground truncate">
            {visit.agent.name}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <SortableHeader column={column}>Status</SortableHeader>
    ),
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const visit = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 sm:size-8 text-muted-foreground hover:text-foreground"
            >
              <MoreVertical className="size-3.5 sm:size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {visit.status === "Pending" && (
              <DropdownMenuItem>Confirm Visit</DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link
                href={`/visits/${visit.id}`}
                className="cursor-pointer w-full"
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Edit Visit</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              Cancel Visit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

interface VisitsTableProps {
  data: Visit[];
}

export function VisitsTable({ data }: VisitsTableProps) {
  const [isVisitModalOpen, setIsVisitModalOpen] = React.useState(false);

  return (
    <>
      <VisitForm
        open={isVisitModalOpen}
        onOpenChange={setIsVisitModalOpen}
        onSuccess={() => {
          window.location.reload();
        }}
      />
      <GenericDataTable
        columns={columns}
        data={data}
        searchPlaceholder="Search visits..."
        filters={[
          { column: "status", label: "Status", options: visitStatusOptions },
        ]}
        enableSelection
        emptyIcon={
          <div className="rounded-full bg-muted p-4">
            <CalendarDays className="size-8 text-muted-foreground/60" />
          </div>
        }
        emptyMessage="No visits found"
        emptyDescription="Scheduled visits will appear here."
      />
    </>
  );
}
