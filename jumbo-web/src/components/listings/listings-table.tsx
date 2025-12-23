"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
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
import {
  ClipboardList,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  FileSpreadsheet,
  FileText,
  Database,
  FileInput,
  MapPin,
  Building,
} from "lucide-react";
import Link from "next/link";
import { mockListings, statusLabels, statusColors, formatINR } from "@/mock-data/listings";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export function ListingsTable() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [agentFilter, setAgentFilter] = React.useState("all");
  
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Derived state
  const statuses = React.useMemo(() => Object.keys(statusLabels), []);
  const agents = React.useMemo(() => Array.from(new Set(mockListings.map((l) => l.listingAgentName))), []);
  
  const hasActiveFilters = statusFilter !== "all" || agentFilter !== "all";

  const filteredListings = React.useMemo(() => {
    return mockListings.filter((listing) => {
      const matchesSearch =
        listing.buildingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.locality.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.unitNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || listing.status === statusFilter;
      const matchesAgent = agentFilter === "all" || listing.listingAgentName === agentFilter;

      return matchesSearch && matchesStatus && matchesAgent;
    });
  }, [searchQuery, statusFilter, agentFilter]);

  const totalPages = Math.ceil(filteredListings.length / pageSize);

  const paginatedListings = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredListings.slice(startIndex, startIndex + pageSize);
  }, [filteredListings, currentPage, pageSize]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, agentFilter, pageSize]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setAgentFilter("all");
    setSearchQuery("");
  };

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:px-6 sm:py-3.5">
        <div className="flex items-center gap-2 sm:gap-2.5 flex-1">
          <Button variant="outline" size="icon" className="size-7 sm:size-8 shrink-0">
            <ClipboardList className="size-4 sm:size-[18px] text-muted-foreground" />
          </Button>
          <span className="text-sm sm:text-base font-medium">All Listings</span>
          <Badge variant="secondary" className="ml-1 text-[10px] sm:text-xs">
            {filteredListings.length}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 sm:size-5 text-muted-foreground" />
            <Input
              placeholder="Search listings..."
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
                  {statusLabels[status as keyof typeof statusLabels]}
                </DropdownMenuCheckboxItem>
              ))}
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Filter by Agent</DropdownMenuLabel>
               <DropdownMenuCheckboxItem
                checked={agentFilter === "all"}
                onCheckedChange={() => setAgentFilter("all")}
              >
                All Agents
              </DropdownMenuCheckboxItem>
              {agents.map((agent) => (
                <DropdownMenuCheckboxItem
                  key={agent}
                  checked={agentFilter === agent}
                  onCheckedChange={() => setAgentFilter(agent)}
                >
                  {agent}
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

           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 sm:h-9 gap-1.5 sm:gap-2">
                <FileInput className="size-3.5 sm:size-4" />
                <span className="hidden sm:inline">Import</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <FileSpreadsheet className="size-4 mr-2" />
                Import from CSV
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="size-4 mr-2" />
                Import from Excel
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Database className="size-4 mr-2" />
                Import from CRM
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
              Status: {statusLabels[statusFilter as keyof typeof statusLabels]}
              <X className="size-2.5 sm:size-3" />
            </Badge>
          )}
          {agentFilter !== "all" && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer text-[10px] sm:text-xs h-5 sm:h-6"
              onClick={() => setAgentFilter("all")}
            >
              Agent: {agentFilter}
              <X className="size-2.5 sm:size-3" />
            </Badge>
          )}
        </div>
      )}

      <div className="px-3 sm:px-6 pb-3 sm:pb-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[40px] font-medium text-muted-foreground text-xs sm:text-sm">#</TableHead>
              <TableHead className="min-w-[180px] font-medium text-muted-foreground text-xs sm:text-sm">Property</TableHead>
              <TableHead className="hidden md:table-cell min-w-[140px] font-medium text-muted-foreground text-xs sm:text-sm">Details</TableHead>
              <TableHead className="min-w-[100px] font-medium text-muted-foreground text-xs sm:text-sm">Status</TableHead>
              <TableHead className="min-w-[90px] font-medium text-muted-foreground text-xs sm:text-sm">Price</TableHead>
              <TableHead className="hidden lg:table-cell min-w-[150px] font-medium text-muted-foreground text-xs sm:text-sm">Agent</TableHead>
              <TableHead className="w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedListings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No listings found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              paginatedListings.map((listing, index) => (
                <TableRow key={listing.id}>
                  <TableCell className="font-medium text-xs sm:text-sm">
                    {(currentPage - 1) * pageSize + index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                        <Link href={`/listings/${listing.id}`} className="font-medium text-xs sm:text-sm block truncate hover:underline">
                            {listing.unitNumber} • {listing.buildingName}
                        </Link>
                         <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
                            <MapPin className="size-3 shrink-0" />
                            <span className="truncate">{listing.locality}</span>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                        <span>{listing.bhk} BHK</span>
                        <span>•</span>
                        <span>{listing.carpetArea} sqft</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={cn("font-medium text-[10px] sm:text-xs", statusColors[listing.status].bg, statusColors[listing.status].text)}>
                      {statusLabels[listing.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs sm:text-sm tabular-nums font-medium">
                    {formatINR(listing.askingPrice)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-5 sm:size-6 bg-muted">
                        <AvatarFallback className="text-[8px] sm:text-[10px] font-extrabold text-muted-foreground uppercase">
                          {listing.listingAgentInitials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-muted-foreground text-xs sm:text-sm">{listing.listingAgentName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-7 sm:size-8 text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="size-3.5 sm:size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/listings/${listing.id}`} className="flex items-center">
                            <Eye className="size-4 mr-2" /> View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Pencil className="size-4 mr-2" /> Edit Listing
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="size-4 mr-2" /> Delete
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
            {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredListings.length)} of {filteredListings.length}
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
