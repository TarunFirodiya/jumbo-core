/**
 * Shared types for page components
 * Ensures consistency across page components
 */

import type { ReactNode } from "react";
import type { PaginatedResult } from "@/services/types";

/**
 * Standard pagination object
 */
export interface PagePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Base props for page content components
 */
export interface BasePageContentProps {
  className?: string;
}

/**
 * Props for pages with stats
 */
export interface PageWithStatsProps<TStats = Record<string, unknown>> extends BasePageContentProps {
  stats: TStats;
}

/**
 * Props for pages with data and pagination
 */
export interface PageWithDataProps<TData = unknown> extends BasePageContentProps {
  data: TData[];
  pagination: PagePagination;
}

/**
 * Props for pages with data, pagination, and stats
 */
export interface PageWithDataAndStatsProps<TData = unknown, TStats = Record<string, unknown>>
  extends BasePageContentProps {
  data: TData[];
  pagination: PagePagination;
  stats: TStats;
}

/**
 * Props for page header action
 */
export interface PageHeaderAction {
  label: string;
  component: ReactNode;
}

