"use client";

import * as React from "react";
import Link from "next/link";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  House,
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  X,
  Eye,
  Pencil,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  BadgeCheck,
  MapPin,
  IndianRupee,
} from "lucide-react";
import { useListingsStore } from "@/store/listings-store";
import {
  mockListings,
  formatINR,
  statusColors,
  statusLabels,
  type ListingStatus,
} from "@/mock-data/listings";

const statuses: ListingStatus[] = ["draft", "inspection_pending", "active", "inactive", "sold"];
const bhkOptions = [1, 2, 2.5, 3, 4];
const localities = [...new Set(mockListings.map((l) => l.locality))].sort();

const priceRanges = [
  { label: "All Prices", value: "all" },
  { label: "< ₹50 L", value: "under50L" },
  { label: "₹50 L - ₹1 Cr", value: "50L-1Cr" },
  { label: "₹1 Cr - ₹2 Cr", value: "1Cr-2Cr" },
  { label: "> ₹2 Cr", value: "over2Cr" },
];

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export function ListingsTable() {
  const searchQuery = useListingsStore((state) => state.searchQuery);
  const statusFilter = useListingsStore((state) => state.statusFilter);
  const localityFilter = useListingsStore((state) => state.localityFilter);
  const bhkFilter = useListingsStore((state) => state.bhkFilter);
  const setSearchQuery = useListingsStore((state) => state.setSearchQuery);
  const setStatusFilter = useListingsStore((state) => state.setStatusFilter);
  const setLocalityFilter = useListingsStore((state) => state.setLocalityFilter);
  const setBhkFilter = useListingsStore((state) => state.setBhkFilter);
  const clearFilters = useListingsStore((state) => state.clearFilters);

  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [priceFilter, setPriceFilter] = React.useState("all");

  const hasActiveFilters =
    statusFilter !== "all" ||
    localityFilter !== "all" ||
    bhkFilter !== "all" ||
    priceFilter !== "all";

  const filteredListings = React.useMemo(() => {
    return mockListings.filter((listing) => {
      const matchesSearch =
        listing.buildingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.locality.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.ownerName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || listing.status === statusFilter;

      const matchesLocality =
        localityFilter === "all" || listing.locality === localityFilter;

      const matchesBhk = bhkFilter === "all" || listing.bhk === bhkFilter;

      let matchesPrice = true;
      if (priceFilter === "under50L") {
        matchesPrice = listing.askingPrice < 5000000;
      } else if (priceFilter === "50L-1Cr") {
        matchesPrice =
          listing.askingPrice >= 5000000 && listing.askingPrice < 10000000;
      } else if (priceFilter === "1Cr-2Cr") {
        matchesPrice =
          listing.askingPrice >= 10000000 && listing.askingPrice < 20000000;
      } else if (priceFilter === "over2Cr") {
        matchesPrice = listing.askingPrice >= 20000000;
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesLocality &&
        matchesBhk &&
        matchesPrice
      );
    });
  }, [searchQuery, statusFilter, localityFilter, bhkFilter, priceFilter]);

  const totalPages = Math.ceil(filteredListings.length / pageSize);

  const paginatedListings = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredListings.slice(startIndex, endIndex);
  }, [filteredListings, currentPage, pageSize]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, localityFilter, bhkFilter, priceFilter, pageSize]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleClearFilters = () => {
    clearFilters();
    setPriceFilter("all");
  };

  return (
    <div className="rounded-xl border bg-card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:px-6 sm:py-3.5">
        <div className="flex items-center gap-2 sm:gap-2.5 flex-1">
          <Button variant="outline" size="icon" className="size-7 sm:size-8 shrink-0">
            <House className="size-4 sm:size-[18px] text-muted-foreground" />
          </Button>
          <span className="text-sm sm:text-base font-medium">Property Listings</span>
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
                className={`h-8 sm:h-9 gap-1.5 sm:gap-2 ${hasActiveFilters ? "border-primary" : ""}`}
              >
                <Filter className="size-3.5 sm:size-4" />
                <span className="hidden sm:inline">Filter</span>
                {hasActiveFilters && (
                  <span className="size-1.5 sm:size-2 rounded-full bg-primary" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[220px]">
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
                  {statusLabels[status]}
                </DropdownMenuCheckboxItem>
              ))}

              <DropdownMenuSeparator />

              <DropdownMenuLabel>Filter by Locality</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={localityFilter === "all"}
                onCheckedChange={() => setLocalityFilter("all")}
              >
                All Localities
              </DropdownMenuCheckboxItem>
              {localities.map((locality) => (
                <DropdownMenuCheckboxItem
                  key={locality}
                  checked={localityFilter === locality}
                  onCheckedChange={() => setLocalityFilter(locality)}
                >
                  {locality}
                </DropdownMenuCheckboxItem>
              ))}

              <DropdownMenuSeparator />

              <DropdownMenuLabel>Filter by BHK</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={bhkFilter === "all"}
                onCheckedChange={() => setBhkFilter("all")}
              >
                All BHK
              </DropdownMenuCheckboxItem>
              {bhkOptions.map((bhk) => (
                <DropdownMenuCheckboxItem
                  key={bhk}
                  checked={bhkFilter === bhk}
                  onCheckedChange={() => setBhkFilter(bhk)}
                >
                  {bhk} BHK
                </DropdownMenuCheckboxItem>
              ))}

              <DropdownMenuSeparator />

              <DropdownMenuLabel>Filter by Price</DropdownMenuLabel>
              {priceRanges.map((range) => (
                <DropdownMenuCheckboxItem
                  key={range.value}
                  checked={priceFilter === range.value}
                  onCheckedChange={() => setPriceFilter(range.value)}
                >
                  {range.label}
                </DropdownMenuCheckboxItem>
              ))}

              {hasActiveFilters && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleClearFilters}
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

          <Button size="sm" className="h-8 sm:h-9 gap-1.5 sm:gap-2" asChild>
            <Link href="/listings/new">
              <Plus className="size-3.5 sm:size-4" />
              <span className="hidden sm:inline">Add Listing</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 px-3 sm:px-6 pb-3">
          <span className="text-[10px] sm:text-xs text-muted-foreground">Filters:</span>
          {statusFilter !== "all" && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer text-[10px] sm:text-xs h-5 sm:h-6"
              onClick={() => setStatusFilter("all")}
            >
              {statusLabels[statusFilter]}
              <X className="size-2.5 sm:size-3" />
            </Badge>
          )}
          {localityFilter !== "all" && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer text-[10px] sm:text-xs h-5 sm:h-6"
              onClick={() => setLocalityFilter("all")}
            >
              {localityFilter}
              <X className="size-2.5 sm:size-3" />
            </Badge>
          )}
          {bhkFilter !== "all" && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer text-[10px] sm:text-xs h-5 sm:h-6"
              onClick={() => setBhkFilter("all")}
            >
              {bhkFilter} BHK
              <X className="size-2.5 sm:size-3" />
            </Badge>
          )}
          {priceFilter !== "all" && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer text-[10px] sm:text-xs h-5 sm:h-6"
              onClick={() => setPriceFilter("all")}
            >
              {priceRanges.find((r) => r.value === priceFilter)?.label}
              <X className="size-2.5 sm:size-3" />
            </Badge>
          )}
        </div>
      )}

      {/* Table */}
      <div className="px-3 sm:px-6 pb-3 sm:pb-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[50px] font-medium text-muted-foreground text-xs sm:text-sm">
                #
              </TableHead>
              <TableHead className="min-w-[220px] font-medium text-muted-foreground text-xs sm:text-sm">
                Property
              </TableHead>
              <TableHead className="hidden md:table-cell min-w-[100px] font-medium text-muted-foreground text-xs sm:text-sm">
                Unit
              </TableHead>
              <TableHead className="min-w-[90px] font-medium text-muted-foreground text-xs sm:text-sm">
                Config
              </TableHead>
              <TableHead className="min-w-[100px] font-medium text-muted-foreground text-xs sm:text-sm">
                Price
              </TableHead>
              <TableHead className="min-w-[120px] font-medium text-muted-foreground text-xs sm:text-sm">
                Status
              </TableHead>
              <TableHead className="hidden lg:table-cell min-w-[140px] font-medium text-muted-foreground text-xs sm:text-sm">
                Owner
              </TableHead>
              <TableHead className="hidden xl:table-cell min-w-[120px] font-medium text-muted-foreground text-xs sm:text-sm">
                Agent
              </TableHead>
              <TableHead className="w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedListings.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-24 text-center text-muted-foreground text-sm"
                >
                  No listings found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              paginatedListings.map((listing, index) => (
                <TableRow key={listing.id}>
                  <TableCell className="font-medium text-xs sm:text-sm text-muted-foreground">
                    {(currentPage - 1) * pageSize + index + 1}
                  </TableCell>
                  <TableCell>
                    <Link href={`/listings/${listing.id}`} className="block">
                    <div className="flex items-center gap-3">
                      <div className="relative size-10 sm:size-12 rounded-lg overflow-hidden bg-muted shrink-0">
                        <Avatar className="size-full rounded-lg">
                          <AvatarImage
                            src={listing.images[0]}
                            alt={listing.buildingName}
                            className="object-cover"
                          />
                          <AvatarFallback className="rounded-lg text-xs">
                            <House className="size-5 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                        {listing.isVerified && (
                          <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-0.5">
                            <BadgeCheck className="size-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate max-w-[160px] hover:underline">
                          {listing.buildingName}
                        </p>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="size-3" />
                          <span className="text-[10px] sm:text-xs truncate">
                            {listing.locality}
                          </span>
                        </div>
                      </div>
                    </div>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="font-mono text-xs sm:text-sm text-muted-foreground">
                      {listing.unitNumber}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs sm:text-sm">
                      <span className="font-medium">{listing.bhk} BHK</span>
                      <span className="text-muted-foreground block text-[10px] sm:text-xs">
                        {listing.carpetArea} sqft
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold">
                      <IndianRupee className="size-3" />
                      {formatINR(listing.askingPrice).replace("₹", "")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`${statusColors[listing.status].bg} ${statusColors[listing.status].text} font-medium text-[10px] sm:text-xs`}
                    >
                      {statusLabels[listing.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="text-xs sm:text-sm">
                      <p className="font-medium truncate max-w-[120px]">
                        {listing.ownerName}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {listing.ownerPhone}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-5 sm:size-6 bg-muted">
                        <AvatarFallback className="text-[8px] sm:text-[10px] font-extrabold text-muted-foreground uppercase">
                          {listing.listingAgentInitials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-muted-foreground text-xs sm:text-sm truncate">
                        {listing.listingAgentName}
                      </span>
                    </div>
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
                          <Link href={`/listings/${listing.id}`}>
                            <Eye className="size-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/listings/${listing.id}/edit`}>
                            <Pencil className="size-4 mr-2" />
                            Edit Listing
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="size-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="size-4 mr-2" />
                          Delete
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

      {/* Pagination */}
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
            {filteredListings.length > 0
              ? `${(currentPage - 1) * pageSize + 1}-${Math.min(
                  currentPage * pageSize,
                  filteredListings.length
                )} of ${filteredListings.length}`
              : "0 results"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="size-4" />
          </Button>

          <div className="flex items-center gap-1 mx-1">
            {totalPages > 0 &&
              Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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

          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

