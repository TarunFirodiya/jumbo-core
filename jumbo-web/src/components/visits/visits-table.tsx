"use client";

import * as React from "react";
import {
  Calendar as CalendarIcon,
  Search,
  Filter,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  MoreVertical,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const visitsData = [
  {
    id: 1,
    property: {
      name: "12 Maple Street",
      address: "Downtown, Apt 4B",
      image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    },
    dateTime: {
      date: "Oct 24, 2023",
      time: "10:00 AM - 10:45 AM",
    },
    agent: {
      name: "Sarah Connor",
      image: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah",
    },
    client: {
      name: "John Buyer",
      type: "Warm Lead",
    },
    status: "Scheduled",
  },
  {
    id: 2,
    property: {
      name: "88 Park Avenue",
      address: "Uptown, Villa 12",
      image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    },
    dateTime: {
      date: "Oct 24, 2023",
      time: "02:00 PM - 03:00 PM",
    },
    agent: {
      name: "Mike Ross",
      image: "https://api.dicebear.com/9.x/avataaars/svg?seed=Mike",
    },
    client: {
      name: "Alice Smith",
      type: "New Lead",
    },
    status: "Pending",
  },
  {
    id: 3,
    property: {
      name: "Villa #402",
      address: "Ocean View Complex",
      image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    },
    dateTime: {
      date: "Oct 23, 2023",
      time: "11:00 AM",
    },
    agent: {
      name: "Sarah Connor",
      image: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah",
    },
    client: {
      name: "Bob Jones",
      type: "Returning",
    },
    status: "Completed",
  },
  {
    id: 4,
    property: {
      name: "55 Pine Lane",
      address: "Suburbia, House 5",
      image: "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    },
    dateTime: {
      date: "Oct 25, 2023",
      time: "04:00 PM - 05:00 PM",
    },
    agent: {
      name: "Mike Ross",
      image: "https://api.dicebear.com/9.x/avataaars/svg?seed=Mike",
    },
    client: {
      name: "Emily Davis",
      type: "Investor",
    },
    status: "Scheduled",
  },
  {
    id: 5,
    property: {
      name: "15 Ocean Drive",
      address: "Waterfront, Condo 9",
      image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    },
    dateTime: {
      date: "Oct 22, 2023",
      time: "",
    },
    agent: {
      name: "John Doe",
      image: "https://api.dicebear.com/9.x/avataaars/svg?seed=John",
    },
    client: {
      name: "Tom Wilson",
      type: "Cold Lead",
    },
    status: "Cancelled",
  },
];

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

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

export function VisitsTable() {
  const [pageSize, setPageSize] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [statusFilter, setStatusFilter] = React.useState("all");

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:px-6 sm:py-3.5">
        <div className="flex items-center gap-2 sm:gap-2.5 flex-1">
          <Button variant="outline" size="icon" className="size-7 sm:size-8 shrink-0">
            <CalendarIcon className="size-4 sm:size-[18px] text-muted-foreground" />
          </Button>
          <span className="text-sm sm:text-base font-medium">All Visits</span>
          <Badge variant="secondary" className="ml-1 text-[10px] sm:text-xs">
            {visitsData.length}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 sm:size-5 text-muted-foreground" />
            <Input
              placeholder="Search visits..."
              className="pl-9 sm:pl-10 w-full sm:w-[160px] lg:w-[200px] h-8 sm:h-9 text-sm"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 sm:h-9 gap-1.5 sm:gap-2"
              >
                <Filter className="size-3.5 sm:size-4" />
                <span className="hidden sm:inline">Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={statusFilter === "all"}
                onCheckedChange={() => setStatusFilter("all")}
              >
                All Status
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                 checked={statusFilter === "Scheduled"}
                 onCheckedChange={() => setStatusFilter("Scheduled")}
              >
                Scheduled
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                 checked={statusFilter === "Pending"}
                 onCheckedChange={() => setStatusFilter("Pending")}
              >
                Pending
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                 checked={statusFilter === "Completed"}
                 onCheckedChange={() => setStatusFilter("Completed")}
              >
                Completed
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

           <div className="hidden sm:block w-px h-[22px] bg-border" />

           <Button variant="outline" size="sm" className="h-8 sm:h-9 gap-1.5 sm:gap-2">
             <Download className="size-3.5 sm:size-4" />
             <span className="hidden sm:inline">Export</span>
           </Button>

           <Button size="sm" className="h-8 sm:h-9 gap-1.5 sm:gap-2 bg-primary">
             <Plus className="size-3.5 sm:size-4" />
             <span className="hidden sm:inline">New Visit</span>
           </Button>
        </div>
      </div>

      <div className="px-3 sm:px-6 pb-3 sm:pb-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[300px] font-medium text-muted-foreground text-xs sm:text-sm">LISTING PROPERTY</TableHead>
              <TableHead className="font-medium text-muted-foreground text-xs sm:text-sm">DATE & TIME</TableHead>
              <TableHead className="font-medium text-muted-foreground text-xs sm:text-sm">AGENT</TableHead>
              <TableHead className="font-medium text-muted-foreground text-xs sm:text-sm">LEAD / CLIENT</TableHead>
              <TableHead className="font-medium text-muted-foreground text-xs sm:text-sm">STATUS</TableHead>
              <TableHead className="text-right w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visitsData.map((visit) => (
              <TableRow key={visit.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-md bg-muted overflow-hidden shrink-0">
                      <img
                        src={visit.property.image}
                        alt={visit.property.name}
                        className="size-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-medium text-xs sm:text-sm">{visit.property.name}</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">
                        {visit.property.address}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-xs sm:text-sm">{visit.dateTime.date}</span>
                    {visit.dateTime.time && (
                      <span className="text-[10px] sm:text-xs text-muted-foreground">
                        {visit.dateTime.time}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="size-5 sm:size-6">
                      <AvatarImage src={visit.agent.image} />
                      <AvatarFallback className="text-[10px]">{visit.agent.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs sm:text-sm text-muted-foreground">{visit.agent.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col items-start gap-1">
                    <span className="font-medium text-xs sm:text-sm">{visit.client.name}</span>
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground">
                      {visit.client.type}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`font-medium text-[10px] sm:text-xs ${getStatusBadgeStyles(visit.status)}`}
                  >
                    {visit.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
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
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Edit Visit</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        Cancel Visit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 sm:px-6 py-3 border-t">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <span className="hidden sm:inline">Rows per page:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => setPageSize(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground">
             1-{Math.min(pageSize, visitsData.length)} of {visitsData.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="size-8" disabled>
            <ChevronsLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon" className="size-8" disabled>
            <ChevronLeft className="size-4" />
          </Button>
           <Button variant="default" size="icon" className="size-8">
            1
          </Button>
          <Button variant="outline" size="icon" className="size-8" disabled>
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="outline" size="icon" className="size-8" disabled>
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
