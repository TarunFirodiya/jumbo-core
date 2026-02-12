"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Row,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Loader2,
  Search,
  SlidersHorizontal,
  Inbox,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  column: string;
  label: string;
  options: FilterOption[];
}

export interface BulkAction<TData> {
  label: string;
  icon?: React.ReactNode;
  variant?: "default" | "destructive";
  onClick: (rows: TData[]) => void;
}

export interface GenericDataTableProps<TData, TValue> {
  /** TanStack column definitions. */
  columns: ColumnDef<TData, TValue>[];
  /** Row data array. */
  data: TData[];
  /** Placeholder text enables global search across all visible string columns. */
  searchPlaceholder?: string;
  /** Filter dropdown configurations. */
  filters?: FilterConfig[];
  /** Enable row-level checkboxes. */
  enableSelection?: boolean;
  /** Bulk actions displayed when rows are selected. */
  bulkActions?: BulkAction<TData>[];
  /** Page size picker values. */
  pageSizeOptions?: number[];
  /** Overlay a loading spinner. */
  isLoading?: boolean;
  /** Custom empty-state icon (ReactNode). */
  emptyIcon?: React.ReactNode;
  /** Custom empty-state message. */
  emptyMessage?: string;
  /** Custom empty-state description. */
  emptyDescription?: string;
  /** Callback when row selection changes. */
  onSelectionChange?: (rows: TData[]) => void;
}

// ─── Sortable Header Helper ─────────────────────────────────────────

export function SortableHeader({
  column,
  children,
}: {
  column: { getIsSorted: () => false | "asc" | "desc"; toggleSorting: (desc?: boolean) => void };
  children: React.ReactNode;
}) {
  const sorted = column.getIsSorted();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 gap-1 font-medium text-xs"
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {children}
      {sorted === "asc" ? (
        <ArrowUp className="size-3.5" />
      ) : sorted === "desc" ? (
        <ArrowDown className="size-3.5" />
      ) : (
        <ArrowUpDown className="size-3.5 opacity-40" />
      )}
    </Button>
  );
}

// ─── Component ───────────────────────────────────────────────────────

export function GenericDataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder,
  filters,
  enableSelection = false,
  bulkActions,
  pageSizeOptions = [10, 20, 50],
  isLoading = false,
  emptyIcon,
  emptyMessage = "No data found",
  emptyDescription = "Try adjusting your search or filters.",
  onSelectionChange,
}: GenericDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [activeFilters, setActiveFilters] = React.useState<Record<string, string>>({});

  // ── Prepend checkbox column when selection is enabled ──
  const allColumns = React.useMemo<ColumnDef<TData, TValue>[]>(() => {
    if (!enableSelection) return columns;

    const selectCol: ColumnDef<TData, TValue> = {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
          className="data-[state=checked]:bg-accent-green data-[state=checked]:border-accent-green"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
          className="data-[state=checked]:bg-accent-green data-[state=checked]:border-accent-green"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    };

    return [selectCol, ...columns];
  }, [columns, enableSelection]);

  // ── Table instance ──
  const table = useReactTable({
    data,
    columns: allColumns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter: searchPlaceholder ? globalFilter : undefined,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableSortingRemoval: true,
  });

  // ── Notify parent of selection changes ──
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  React.useEffect(() => {
    onSelectionChange?.(selectedRows.map((r: Row<TData>) => r.original));
  }, [selectedRows, onSelectionChange]);

  // ── Filter helpers ──
  const handleFilterChange = (columnId: string, value: string) => {
    setActiveFilters((prev) => {
      const next = { ...prev };
      if (value === "all") delete next[columnId];
      else next[columnId] = value;
      return next;
    });
    table.getColumn(columnId)?.setFilterValue(value === "all" ? undefined : value);
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    setGlobalFilter("");
    table.resetColumnFilters();
  };

  const activeFilterCount =
    Object.keys(activeFilters).length + (globalFilter ? 1 : 0);

  // ── Pagination helpers ──
  const pageCount = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex + 1;
  const pageSize = table.getState().pagination.pageSize;
  const totalRows = table.getFilteredRowModel().rows.length;
  const startRow = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRow = Math.min(currentPage * pageSize, totalRows);

  const pageNumbers = React.useMemo(() => {
    const pages: number[] = [];
    const max = 5;
    if (pageCount <= max) {
      for (let i = 1; i <= pageCount; i++) pages.push(i);
    } else if (currentPage <= 3) {
      for (let i = 1; i <= max; i++) pages.push(i);
    } else if (currentPage >= pageCount - 2) {
      for (let i = pageCount - max + 1; i <= pageCount; i++) pages.push(i);
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i);
    }
    return pages;
  }, [pageCount, currentPage]);

  const hasToolbar = !!searchPlaceholder || (filters && filters.length > 0);
  const selectedCount = selectedRows.length;

  return (
    <div className="w-full space-y-3">
      {/* ── Toolbar ── */}
      {hasToolbar && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1">
            {searchPlaceholder && (
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder={searchPlaceholder}
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            )}
          </div>

          {/* Filters + column visibility */}
          <div className="flex items-center gap-2 flex-wrap">
            {filters?.map((filter) => (
              <DropdownMenu key={filter.column}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-9 gap-2",
                      activeFilters[filter.column] &&
                        "border-accent-blue text-accent-blue"
                    )}
                  >
                    <Filter className="size-3.5" />
                    <span className="hidden sm:inline">{filter.label}</span>
                    {activeFilters[filter.column] && (
                      <span className="size-1.5 rounded-full bg-accent-blue" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by {filter.label}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={!activeFilters[filter.column]}
                    onCheckedChange={() => handleFilterChange(filter.column, "all")}
                  >
                    All
                  </DropdownMenuCheckboxItem>
                  {filter.options.map((opt) => (
                    <DropdownMenuCheckboxItem
                      key={opt.value}
                      checked={activeFilters[filter.column] === opt.value}
                      onCheckedChange={() =>
                        handleFilterChange(filter.column, opt.value)
                      }
                    >
                      {opt.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ))}

            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 gap-1.5 text-muted-foreground"
                onClick={clearAllFilters}
              >
                <X className="size-3.5" />
                Clear
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <SlidersHorizontal className="size-3.5 mr-1.5" />
                  <span className="hidden sm:inline">View</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px]">
                {table
                  .getAllColumns()
                  .filter((c) => typeof c.accessorFn !== "undefined" && c.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(v) => column.toggleVisibility(!!v)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* ── Bulk Action Bar ── */}
      {enableSelection && selectedCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-accent-green/30 bg-accent-green/5">
          <span className="text-sm font-medium text-accent-green tabular-nums">
            {selectedCount} selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            {bulkActions?.map((action) => (
              <Button
                key={action.label}
                variant={action.variant === "destructive" ? "destructive" : "outline"}
                size="sm"
                className="h-8 gap-1.5"
                onClick={() =>
                  action.onClick(selectedRows.map((r: Row<TData>) => r.original))
                }
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => table.toggleAllRowsSelected(false)}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="relative rounded-lg border overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        <div className="overflow-x-auto max-h-[calc(100vh-320px)]">
          <Table>
            <TableHeader className="sticky top-0 z-[5] bg-muted/50 backdrop-blur-sm">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      row.getIsSelected() && "bg-accent-green/5"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={allColumns.length}
                    className="h-48"
                  >
                    <div className="flex flex-col items-center justify-center gap-3 text-center py-8">
                      {emptyIcon || (
                        <div className="rounded-full bg-muted p-4">
                          <Inbox className="size-8 text-muted-foreground/60" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          {emptyMessage}
                        </p>
                        <p className="text-xs text-muted-foreground max-w-[280px]">
                          {emptyDescription}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Pagination ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="hidden sm:inline">Rows per page:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(v) => table.setPageSize(Number(v))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="tabular-nums">
            {startRow}–{endRow} of {totalRows}
          </span>
        </div>

        {pageCount > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <div className="flex items-center gap-1 mx-1">
              {pageNumbers.map((p) => (
                <Button
                  key={p}
                  variant={currentPage === p ? "default" : "outline"}
                  size="icon"
                  className="size-8 text-xs"
                  onClick={() => table.setPageIndex(p - 1)}
                >
                  {p}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.setPageIndex(pageCount - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
