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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "lucide-react";
import { deals } from "@/mock-data/deals"; 

export function OffersTable() {
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 10;
  
  // Reuse deals data but mapped as offers
  const offers = deals.map(d => ({
    id: d.id,
    property: d.dealName.split("-")[0] || "Property A",
    buyer: d.client,
    amount: d.value,
    status: ["Pending", "Accepted", "Rejected", "Countered"][Math.floor(Math.random() * 4)],
    date: d.expectedClose,
    agent: d.owner,
    agentInitials: d.ownerInitials
  }));

  const totalPages = Math.ceil(offers.length / pageSize);
  const paginatedOffers = offers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Accepted": return "bg-emerald-100 text-emerald-700";
      case "Rejected": return "bg-red-100 text-red-700";
      case "Countered": return "bg-orange-100 text-orange-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:px-6 sm:py-3.5">
        <div className="flex items-center gap-2 sm:gap-2.5 flex-1">
          <Button variant="outline" size="icon" className="size-7 sm:size-8 shrink-0">
            <ClipboardList className="size-4 sm:size-[18px] text-muted-foreground" />
          </Button>
          <span className="text-sm sm:text-base font-medium">All Offers</span>
          <Badge variant="secondary" className="ml-1 text-[10px] sm:text-xs">
            {offers.length}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 sm:size-5 text-muted-foreground" />
            <Input
              placeholder="Search offers..."
              className="pl-9 sm:pl-10 w-full sm:w-[160px] lg:w-[200px] h-8 sm:h-9 text-sm"
            />
          </div>
          <Button variant="outline" size="sm" className="h-8 sm:h-9 gap-1.5 sm:gap-2">
            <Filter className="size-3.5 sm:size-4" />
            <span className="hidden sm:inline">Filter</span>
          </Button>
        </div>
      </div>

      <div className="px-3 sm:px-6 pb-3 sm:pb-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[40px] font-medium text-muted-foreground text-xs sm:text-sm">#</TableHead>
              <TableHead className="min-w-[180px] font-medium text-muted-foreground text-xs sm:text-sm">Property</TableHead>
              <TableHead className="hidden md:table-cell min-w-[140px] font-medium text-muted-foreground text-xs sm:text-sm">Buyer</TableHead>
              <TableHead className="min-w-[100px] font-medium text-muted-foreground text-xs sm:text-sm">Amount</TableHead>
              <TableHead className="min-w-[90px] font-medium text-muted-foreground text-xs sm:text-sm">Status</TableHead>
              <TableHead className="hidden lg:table-cell min-w-[100px] font-medium text-muted-foreground text-xs sm:text-sm">Date</TableHead>
              <TableHead className="hidden xl:table-cell min-w-[150px] font-medium text-muted-foreground text-xs sm:text-sm">Agent</TableHead>
              <TableHead className="w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOffers.map((offer, index) => (
              <TableRow key={offer.id}>
                <TableCell className="font-medium text-xs sm:text-sm">
                  {(currentPage - 1) * pageSize + index + 1}
                </TableCell>
                <TableCell>
                  <span className="font-medium text-xs sm:text-sm block truncate">{offer.property}</span>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-xs sm:text-sm">
                  {offer.buyer}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs sm:text-sm tabular-nums">
                  ${offer.amount.toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={`${getStatusColor(offer.status)} font-medium text-[10px] sm:text-xs`}>
                    {offer.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground text-xs sm:text-sm">
                  {offer.date}
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-5 sm:size-6 bg-muted">
                      <AvatarFallback className="text-[8px] sm:text-[10px] font-extrabold text-muted-foreground uppercase">
                        {offer.agentInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-muted-foreground text-xs sm:text-sm">{offer.agent}</span>
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
                      <DropdownMenuItem>
                        <Eye className="size-4 mr-2" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Pencil className="size-4 mr-2" /> Edit Offer
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="size-4 mr-2" /> Delete
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
        <div className="text-xs sm:text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
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
    </div>
  );
}

