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
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
  MoreHorizontal,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  accepted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  countered: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  expired: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

export function DealsTable() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [offers, setOffers] = React.useState<OfferRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [totalCount, setTotalCount] = React.useState(0);

  // Fetch offers from API
  React.useEffect(() => {
    async function fetchOffers() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: pageSize.toString(),
        });
        const response = await fetch(`/api/v1/offers?${params}`);
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
  }, [currentPage, pageSize]);

  const filteredOffers = React.useMemo(() => {
    if (!searchQuery) return offers;
    const query = searchQuery.toLowerCase();
    return offers.filter((offer) => {
      const buildingName = offer.listing?.unit?.building?.name?.toLowerCase() || "";
      const buyerName = offer.lead?.contact?.name?.toLowerCase() || "";
      const agentName = offer.createdBy?.fullName?.toLowerCase() || "";
      return buildingName.includes(query) || buyerName.includes(query) || agentName.includes(query);
    });
  }, [offers, searchQuery]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const formatAmount = (amount: string) => {
    const num = Number(amount);
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
    return `₹${num.toLocaleString("en-IN")}`;
  };

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:px-6 sm:py-3.5">
        <div className="flex items-center gap-2 sm:gap-2.5 flex-1">
          <Button variant="outline" size="icon" className="size-7 sm:size-8 shrink-0">
            <ClipboardList className="size-4 sm:size-[18px] text-muted-foreground" />
          </Button>
          <span className="text-sm sm:text-base font-medium">Active Offers</span>
          <Badge variant="secondary" className="ml-1 text-[10px] sm:text-xs">
            {totalCount}
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
        </div>
      </div>

      <div className="px-3 sm:px-6 pb-3 sm:pb-4 overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[40px] font-medium text-muted-foreground text-xs sm:text-sm">
                  #
                </TableHead>
                <TableHead className="min-w-[180px] font-medium text-muted-foreground text-xs sm:text-sm">
                  Property
                </TableHead>
                <TableHead className="hidden md:table-cell min-w-[140px] font-medium text-muted-foreground text-xs sm:text-sm">
                  Buyer
                </TableHead>
                <TableHead className="min-w-[100px] font-medium text-muted-foreground text-xs sm:text-sm">
                  Status
                </TableHead>
                <TableHead className="min-w-[90px] font-medium text-muted-foreground text-xs sm:text-sm">
                  Amount
                </TableHead>
                <TableHead className="hidden lg:table-cell min-w-[150px] font-medium text-muted-foreground text-xs sm:text-sm">
                  Created By
                </TableHead>
                <TableHead className="hidden sm:table-cell font-medium text-muted-foreground text-xs sm:text-sm">
                  Date
                </TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOffers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-32 text-center"
                  >
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileX2 className="size-8 opacity-50" />
                      <p className="text-sm">No offers yet</p>
                      <p className="text-xs">Offers will appear here when buyers make offers on listings.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOffers.map((offer, index) => (
                  <TableRow key={offer.id}>
                    <TableCell className="font-medium text-xs sm:text-sm">
                      {(currentPage - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="min-w-0">
                        <span className="font-medium text-xs sm:text-sm block truncate">
                          {offer.listing?.unit?.building?.name || "Unknown"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {offer.listing?.unit?.unitNumber || ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-xs sm:text-sm">
                      {offer.lead?.contact?.name || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "font-medium text-[10px] sm:text-xs border-0",
                          statusColors[offer.status] || statusColors.pending
                        )}
                      >
                        {offer.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs sm:text-sm tabular-nums">
                      {formatAmount(offer.offerAmount)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {offer.createdBy ? (
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
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-xs sm:text-sm">
                      {offer.createdAt
                        ? new Date(offer.createdAt).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 sm:px-6 py-3 border-t">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <span className="hidden sm:inline">Rows per page:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(1);
              }}
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
              {Math.min((currentPage - 1) * pageSize + 1, totalCount)}-
              {Math.min(currentPage * pageSize, totalCount)} of {totalCount}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="size-8" onClick={() => goToPage(1)} disabled={currentPage === 1}>
              <ChevronsLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon" className="size-8" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
              <ChevronLeft className="size-4" />
            </Button>
            <div className="flex items-center gap-1 mx-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="icon"
                    className="size-8"
                    onClick={() => goToPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button variant="outline" size="icon" className="size-8" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
              <ChevronRight className="size-4" />
            </Button>
            <Button variant="outline" size="icon" className="size-8" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>
              <ChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
