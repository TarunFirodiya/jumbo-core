/**
 * Common type definitions for Jumbo-Core
 */

// Re-export database types
export type {
  Profile,
  NewProfile,
  Building,
  NewBuilding,
  Unit,
  NewUnit,
  Listing,
  NewListing,
  Lead,
  NewLead,
  Communication,
  NewCommunication,
  VisitTour,
  NewVisitTour,
  Visit,
  NewVisit,
  Task,
  NewTask,
  CreditRule,
  NewCreditRule,
  CreditLedgerEntry,
  NewCreditLedgerEntry,
  UserRole,
} from "@/lib/db/schema";

import { Profile, Lead } from "@/lib/db/schema";

export type LeadWithRelations = Lead & {
  profile: Profile | null;
  assignedAgent: Profile | null;
};

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

// Lead status types
export type LeadStatus = "new" | "contacted" | "active_visitor" | "at_risk" | "closed";

// Listing status types
export type ListingStatus = "draft" | "inspection_pending" | "active" | "inactive" | "sold";

// Task priority types
export type TaskPriority = "low" | "medium" | "high" | "urgent";

// Task status types
export type TaskStatus = "open" | "in_progress" | "completed" | "archived";

// Visit status types
export type VisitStatus = "pending" | "completed" | "cancelled" | "no_show";

// Tour status types
export type TourStatus = "planned" | "ongoing" | "completed";

// Communication channel types
export type CommunicationChannel = "whatsapp" | "call" | "email";

// Communication direction types
export type CommunicationDirection = "inbound" | "outbound";

// Jumbo Coins action types
export type CoinActionType =
  | "inspection_approved"
  | "visit_completed"
  | "deal_closed"
  | "missed_visit"
  | "no_followup"
  | "new_listing";

