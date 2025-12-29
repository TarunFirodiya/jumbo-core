"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { MoreVertical, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { VisitForm } from "@/components/visits/visit-form";

// Define the Visit type based on usage
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

const getStatusBadgeStyles = (status: string) => {
  switch (status) {
    case "Scheduled":
      return "bg-blue-100/50 text-blue-700 hover:bg-blue-100/60 border-blue-200";
    case "Pending":
      return "bg-orange-100/50 text-orange-700 hover:bg-orange-100/60 border-orange-200";
    case "Completed":
      return "bg-emerald-100/50 text-emerald-700 hover:bg-emerald-100/60 border-emerald-200";
    case "Cancelled":
      return "bg-red-100/50 text-red-700 hover:bg-red-100/60 border-red-200";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export const columns: ColumnDef<Visit>[] = [
  {
    accessorKey: "property",
    header: "Listing Property",
    cell: ({ row }) => {
      const visit = row.original;
      return (
        <Link 
          href={`/visits/${visit.id}`} 
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="size-10 rounded-md bg-muted overflow-hidden shrink-0">
            <img
              src={visit.property.image}
              alt={visit.property.name}
              className="size-full object-cover"
            />
          </div>
          <div>
            <div className="font-medium text-xs sm:text-sm truncate">{visit.property.name}</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
              {visit.property.address}
            </div>
          </div>
        </Link>
      );
    },
  },
  {
    accessorKey: "dateTime",
    header: "Date & Time",
    cell: ({ row }) => {
      const visit = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium text-xs sm:text-sm">{visit.dateTime.date}</span>
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
    accessorKey: "agent",
    header: "Agent",
    cell: ({ row }) => {
      const visit = row.original;
      return (
        <div className="flex items-center gap-2">
          <Avatar className="size-5 sm:size-6">
            <AvatarImage src={visit.agent.image} />
            <AvatarFallback className="text-[10px]">{visit.agent.name[0]}</AvatarFallback>
          </Avatar>
          <span className="text-xs sm:text-sm text-muted-foreground truncate">{visit.agent.name}</span>
        </div>
      );
    },
  },
  {
    id: "client",
    accessorFn: (row) => row.client.name,
    header: "Lead / Client",
    cell: ({ row }) => {
      const visit = row.original;
      return (
        <div className="flex flex-col items-start gap-1">
          <span className="font-medium text-xs sm:text-sm truncate">{visit.client.name}</span>
          <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground whitespace-nowrap">
            {visit.client.type}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
       const visit = row.original;
       return (
        <Badge
          variant="secondary"
          className={`font-medium text-[10px] sm:text-xs whitespace-nowrap ${getStatusBadgeStyles(visit.status)}`}
        >
          {visit.status}
        </Badge>
       );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const visit = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7 sm:size-8 text-muted-foreground hover:text-foreground">
              <MoreVertical className="size-3.5 sm:size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {visit.status === "Pending" && (
               <DropdownMenuItem>Confirm Visit</DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link href={`/visits/${visit.id}`} className="cursor-pointer w-full">
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
          // Refresh the page to get updated data
          window.location.reload();
        }}
      />
      <DataTable columns={columns} data={data} filterColumn="client" />
    </>
  );
}
