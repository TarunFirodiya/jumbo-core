"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
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
  FileInput,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
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

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export function BuyersTable({ data, pagination }: BuyersTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize state from URL params
  const initialSearch = searchParams.get("search") || "";
  const [searchQuery, setSearchQuery] = React.useState(initialSearch);

  const statusFilter = searchParams.get("status") || "all";
  const agentFilter = searchParams.get("agentId") || "all";

  // Helper to update URL params
  const updateUrl = React.useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "all" || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // Reset to page 1 when filtering
    if (updates.status || updates.agentId || updates.search !== undefined) {
       params.set("page", "1");
    }

    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams]);

  // Handle search debounce
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== initialSearch) {
        updateUrl({ search: searchQuery });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, updateUrl, initialSearch]);

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const setPageSize = (size: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", size.toString());
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearchQuery("");
    updateUrl({ status: "all", agentId: "all", search: "" });
  };

  const hasActiveFilters = statusFilter !== "all" || agentFilter !== "all" || searchQuery !== "";
  
  const statuses = ["new", "contacted", "active_visitor", "at_risk", "closed"];

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:px-6 sm:py-3.5">
        <div className="flex items-center gap-2 sm:gap-2.5 flex-1">
          <Button variant="outline" size="icon" className="size-7 sm:size-8 shrink-0">
            <ClipboardList className="size-4 sm:size-[18px] text-muted-foreground" />
          </Button>
          <span className="text-sm sm:text-base font-medium">All Buyers</span>
          <Badge variant="secondary" className="ml-1 text-[10px] sm:text-xs">
            {pagination.total}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 sm:size-5 text-muted-foreground" />
            <Input
              placeholder="Search..."
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
                onCheckedChange={() => updateUrl({ status: "all" })}
              >
                All Statuses
              </DropdownMenuCheckboxItem>
              {statuses.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={statusFilter === status}
                  onCheckedChange={() => updateUrl({ status })}
                >
                  {status.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                </DropdownMenuCheckboxItem>
              ))}
              
              <DropdownMenuSeparator />
              {hasActiveFilters && (
                <>
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
              onClick={() => updateUrl({ status: "all" })}
            >
              Status: {statusFilter}
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
              <TableHead className="min-w-[180px] font-medium text-muted-foreground text-xs sm:text-sm">Buyer Name</TableHead>
              <TableHead className="hidden md:table-cell min-w-[140px] font-medium text-muted-foreground text-xs sm:text-sm">Email</TableHead>
              <TableHead className="min-w-[100px] font-medium text-muted-foreground text-xs sm:text-sm">Status</TableHead>
              <TableHead className="min-w-[90px] font-medium text-muted-foreground text-xs sm:text-sm">Budget</TableHead>
              <TableHead className="hidden lg:table-cell min-w-[150px] font-medium text-muted-foreground text-xs sm:text-sm">Agent</TableHead>
              <TableHead className="w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No buyers found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              data.map((lead, index) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium text-xs sm:text-sm">
                    {(pagination.page - 1) * pagination.limit + index + 1}
                  </TableCell>
                  <TableCell>
                    <Link href={`/buyers/${lead.id}`} className="font-medium text-xs sm:text-sm block truncate hover:underline">
                      {lead.profile?.fullName || "Unknown"}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-xs sm:text-sm">
                    {lead.profile?.email || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 font-medium text-[10px] sm:text-xs">
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs sm:text-sm tabular-nums">
                    {(() => {
                      const req = lead.requirementJson as any;
                      if (req?.budget_min && req?.budget_max) {
                        return `${(req.budget_min / 100000).toFixed(1)}L - ${(req.budget_max / 100000).toFixed(1)}L`;
                      }
                      if (req?.budget_min) return `> ${(req.budget_min / 100000).toFixed(1)}L`;
                      if (req?.budget_max) return `< ${(req.budget_max / 100000).toFixed(1)}L`;
                      return "-";
                    })()}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-5 sm:size-6 bg-muted">
                        <AvatarFallback className="text-[8px] sm:text-[10px] font-extrabold text-muted-foreground uppercase">
                          {lead.assignedAgent?.fullName?.substring(0, 2).toUpperCase() || "??"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-muted-foreground text-xs sm:text-sm">{lead.assignedAgent?.fullName || "Unassigned"}</span>
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
                          <Link href={`/buyers/${lead.id}`} className="flex items-center">
                            <Eye className="size-4 mr-2" /> View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Pencil className="size-4 mr-2" /> Edit Buyer
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
            value={pagination.limit.toString()}
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
            {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="size-8" onClick={() => goToPage(1)} disabled={pagination.page === 1}>
            <ChevronsLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon" className="size-8" onClick={() => goToPage(pagination.page - 1)} disabled={pagination.page === 1}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon" className="size-8" onClick={() => goToPage(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}>
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="outline" size="icon" className="size-8" onClick={() => goToPage(pagination.totalPages)} disabled={pagination.page === pagination.totalPages}>
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
