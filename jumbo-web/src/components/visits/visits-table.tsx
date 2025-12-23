"use client";

import * as React from "react";
import {
  Calendar as CalendarIcon,
  Search,
  Filter,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Plus,
  X,
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
import { Card, CardContent } from "@/components/ui/card";
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
import { visits } from "@/mock-data/visits";
import { VisitForm } from "@/components/visits/visit-form";
import { cn } from "@/lib/utils";

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
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [isVisitModalOpen, setIsVisitModalOpen] = React.useState(false);

  const statuses = React.useMemo(() => Array.from(new Set(visits.map((v) => v.status))), []);

  const hasActiveFilters = statusFilter !== "all";

  const filteredVisits = React.useMemo(() => {
    return visits.filter((visit) => {
      const matchesSearch =
        visit.property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visit.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visit.agent.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || visit.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredVisits.length / pageSize);

  const paginatedVisits = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredVisits.slice(startIndex, startIndex + pageSize);
  }, [filteredVisits, currentPage, pageSize]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, pageSize]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setSearchQuery("");
  };

  return (
    <Card>
      <VisitForm 
        open={isVisitModalOpen} 
        onOpenChange={setIsVisitModalOpen} 
      />
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:px-6 sm:py-3.5">
        <div className="flex items-center gap-2 sm:gap-2.5 flex-1">
          <Button variant="outline" size="icon" className="size-7 sm:size-8 shrink-0">
            <CalendarIcon className="size-4 sm:size-[18px] text-muted-foreground" />
          </Button>
          <span className="text-sm sm:text-base font-medium">All Visits</span>
          <Badge variant="secondary" className="ml-1 text-[10px] sm:text-xs">
            {filteredVisits.length}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 sm:size-5 text-muted-foreground" />
            <Input
              placeholder="Search visits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 sm:pl-10 w-full sm:w-[160px] lg:w-[200px] h-8 sm:h-9 text-sm"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 sm:h-9 gap-1.5 sm:gap-2",
                  hasActiveFilters && "border-primary text-primary"
                )}
              >
                <Filter className="size-3.5 sm:size-4" />
                <span className="hidden sm:inline">Filter</span>
                {hasActiveFilters && (
                  <span className="size-1.5 sm:size-2 rounded-full bg-primary" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={statusFilter === "all"}
                onCheckedChange={() => setStatusFilter("all")}
              >
                All Statuses
              </DropdownMenuCheckboxItem>
              {statuses.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={statusFilter === status}
                  onCheckedChange={() => setStatusFilter(status)}
                >
                  {status}
                </DropdownMenuCheckboxItem>
              ))}

               {hasActiveFilters && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={clearFilters}
                    className="text-destructive"
                  >
                    <X className="size-4 mr-2" />
                    Clear all filters
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

           <div className="hidden sm:block w-px h-[22px] bg-border" />

           <Button variant="outline" size="sm" className="h-8 sm:h-9 gap-1.5 sm:gap-2">
             <Download className="size-3.5 sm:size-4" />
             <span className="hidden sm:inline">Export</span>
           </Button>

           <Button size="sm" className="h-8 sm:h-9 gap-1.5 sm:gap-2 bg-primary" onClick={() => setIsVisitModalOpen(true)}>
             <Plus className="size-3.5 sm:size-4" />
             <span className="hidden sm:inline">New Visit</span>
           </Button>
        </div>
      </div>

       {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 px-3 sm:px-6 pb-3">
          <span className="text-[10px] sm:text-xs text-muted-foreground">Filters:</span>
          {statusFilter !== "all" && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer text-[10px] sm:text-xs h-5 sm:h-6"
              onClick={() => setStatusFilter("all")}
            >
              Status: {statusFilter}
              <X className="size-2.5 sm:size-3" />
            </Badge>
          )}
        </div>
      )}

      <CardContent className="p-0">
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
             {paginatedVisits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No visits found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
            paginatedVisits.map((visit) => (
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
            ))
          )}
          </TableBody>
          </Table>
        </div>
      </CardContent>

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
             {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredVisits.length)} of {filteredVisits.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="size-8" onClick={() => goToPage(1)} disabled={currentPage === 1}>
            <ChevronsLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon" className="size-8" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon" className="size-8" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="outline" size="icon" className="size-8" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
