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

export function SellersTable() {
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 10;
  
  // Reuse deals data but mapped as sellers
  const sellers = deals.map(d => ({
    id: d.id,
    name: d.client,
    email: `${d.client.toLowerCase().replace(" ", ".")}@example.com`,
    properties: Math.floor(Math.random() * 5) + 1,
    status: "Active",
    lastContact: "1 week ago",
    agent: d.owner,
    agentInitials: d.ownerInitials
  }));

  const totalPages = Math.ceil(sellers.length / pageSize);
  const paginatedSellers = sellers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:px-6 sm:py-3.5">
        <div className="flex items-center gap-2 sm:gap-2.5 flex-1">
          <Button variant="outline" size="icon" className="size-7 sm:size-8 shrink-0">
            <ClipboardList className="size-4 sm:size-[18px] text-muted-foreground" />
          </Button>
          <span className="text-sm sm:text-base font-medium">All Sellers</span>
          <Badge variant="secondary" className="ml-1 text-[10px] sm:text-xs">
            {sellers.length}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 sm:size-5 text-muted-foreground" />
            <Input
              placeholder="Search sellers..."
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
              <TableHead className="min-w-[180px] font-medium text-muted-foreground text-xs sm:text-sm">Seller Name</TableHead>
              <TableHead className="hidden md:table-cell min-w-[140px] font-medium text-muted-foreground text-xs sm:text-sm">Email</TableHead>
              <TableHead className="min-w-[90px] font-medium text-muted-foreground text-xs sm:text-sm">Properties</TableHead>
              <TableHead className="min-w-[90px] font-medium text-muted-foreground text-xs sm:text-sm">Status</TableHead>
              <TableHead className="hidden lg:table-cell min-w-[150px] font-medium text-muted-foreground text-xs sm:text-sm">Agent</TableHead>
              <TableHead className="w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSellers.map((seller, index) => (
              <TableRow key={seller.id}>
                <TableCell className="font-medium text-xs sm:text-sm">
                  {(currentPage - 1) * pageSize + index + 1}
                </TableCell>
                <TableCell>
                  <span className="font-medium text-xs sm:text-sm block truncate">{seller.name}</span>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-xs sm:text-sm">
                  {seller.email}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs sm:text-sm tabular-nums">
                  {seller.properties}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 font-medium text-[10px] sm:text-xs">
                    {seller.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-5 sm:size-6 bg-muted">
                      <AvatarFallback className="text-[8px] sm:text-[10px] font-extrabold text-muted-foreground uppercase">
                        {seller.agentInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-muted-foreground text-xs sm:text-sm">{seller.agent}</span>
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
                        <Pencil className="size-4 mr-2" /> Edit Seller
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

