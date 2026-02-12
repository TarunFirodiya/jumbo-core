"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Unified status color palette.
 *
 * "positive"  → neon-green accent  (Active, Closed/Won, Accepted, Completed, Proposal Accepted)
 * "warning"   → yellow/amber       (Pending, Warm, Contacted, Scheduled, Proposal Sent, Countered)
 * "negative"  → red                (Lost, Cold, Dropped, Rejected, Cancelled)
 * "info"      → blue               (New, Info)
 * "neutral"   → gray               (Draft, Expired, Inactive, Unknown)
 */
type StatusVariant = "positive" | "warning" | "negative" | "info" | "neutral";

const variantStyles: Record<StatusVariant, string> = {
  positive:
    "bg-accent-green/15 text-accent-green border-accent-green/25 dark:bg-accent-green/10 dark:text-accent-green",
  warning:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  negative:
    "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  info: "bg-accent-blue/15 text-accent-blue border-accent-blue/25 dark:bg-accent-blue/10 dark:text-accent-blue",
  neutral:
    "bg-muted text-muted-foreground border-border",
};

/** Auto-resolve variant from common status strings. */
const STATUS_VARIANT_MAP: Record<string, StatusVariant> = {
  // Positive
  active: "positive",
  won: "positive",
  closed: "positive",
  accepted: "positive",
  completed: "positive",
  proposal_accepted: "positive",
  sold: "positive",
  qualified: "positive",
  active_visitor: "positive",

  // Warning
  pending: "warning",
  warm: "warning",
  contacted: "warning",
  scheduled: "warning",
  proposal_sent: "warning",
  countered: "warning",
  negotiation: "warning",
  inspection_pending: "warning",
  cataloguing_pending: "warning",
  on_hold: "warning",
  in_progress: "warning",
  at_risk_lead: "warning",
  at_risk_visitor: "warning",
  reactivated: "warning",

  // Negative
  lost: "warning",
  cold: "negative",
  dropped: "negative",
  rejected: "negative",
  cancelled: "negative",
  delisted: "negative",
  no_show: "negative",
  inactive_lead: "negative",
  inactive_visitor: "negative",

  // Info
  new: "info",
  new_lead: "info",

  // Neutral
  draft: "neutral",
  expired: "neutral",
  inactive: "neutral",
};

function resolveVariant(status: string): StatusVariant {
  const normalised = status.toLowerCase().replace(/[\s-]/g, "_");
  return STATUS_VARIANT_MAP[normalised] ?? "neutral";
}

interface StatusBadgeProps {
  /** The raw status string (e.g. "active", "Pending", "proposal_sent"). */
  status: string;
  /** Optional human-readable label. Defaults to a prettified version of `status`. */
  label?: string;
  /** Force a specific variant instead of auto-resolving from the status string. */
  variant?: StatusVariant;
  /** Extra className overrides. */
  className?: string;
}

function prettifyStatus(status: string): string {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusBadge({
  status,
  label,
  variant,
  className,
}: StatusBadgeProps) {
  const resolved = variant ?? resolveVariant(status);

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium text-[10px] sm:text-xs whitespace-nowrap border",
        variantStyles[resolved],
        className
      )}
    >
      {label ?? prettifyStatus(status)}
    </Badge>
  );
}

export type { StatusVariant };
