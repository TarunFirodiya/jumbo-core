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
  SellerLead,
  NewSellerLead,
  SellerLeadStatus,
  SellerLeadSource,
  AuditLog,
  NewAuditLog,
  AuditAction,
  Note,
  NewNote,
  MediaItem,
  NewMediaItem,
  HomeInspection,
  NewHomeInspection,
  HomeCatalogue,
  NewHomeCatalogue,
  BuyerEvent,
  NewBuyerEvent,
  Offer,
  NewOffer,
  DropReason,
  Configuration,
  View,
  Facing,
  Usp,
  PropertyType,
  Occupancy,
  Furnishing,
  SoldBy,
  InventoryType,
  Urgency,
  Priority,
  VisitedWith,
  PrimaryPainPoint,
  MediaType,
  InspectionStatus,
  CatalogueStatus,
  OfferStatus,
} from "@/lib/db/schema";

import { Profile, Lead, SellerLead, Building, Unit, AuditLog, Communication, Task, Listing, Note, MediaItem, HomeInspection, HomeCatalogue, Offer, BuyerEvent } from "@/lib/db/schema";

export type LeadWithRelations = Lead & {
  profile: Profile | null;
  assignedAgent: Profile | null;
  notes?: Note[];
  buyerEvents?: BuyerEvent[];
  offers?: Offer[];
};

export type ListingWithRelations = Listing & {
  unit: (Unit & {
    building: Building | null;
  }) | null;
  notes?: Note[];
  mediaItems?: MediaItem[];
  homeInspections?: HomeInspection[];
  homeCatalogues?: HomeCatalogue[];
  offers?: Offer[];
};

export type SellerLeadWithRelations = SellerLead & {
  profile: Profile | null;
  building: Building | null;
  unit: Unit | null;
  assignedTo: Profile | null;
  referredBy: Profile | null;
  createdBy: Profile | null;
  communications?: Communication[];
  tasks?: Task[];
  notes?: Note[];
  listings?: ListingWithRelations[];
};

export type AuditLogWithRelations = AuditLog & {
  performedBy: Profile | null;
};

// Seller stats response
export interface SellerStats {
  newLeads: number;
  homesLive: number;
  inspectionPending: number;
  activeSellers: number;
}

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
export type ListingStatus = "draft" | "inspection_pending" | "cataloguing_pending" | "active" | "on_hold" | "sold" | "delisted";

// Task priority types
export type TaskPriority = "low" | "medium" | "high" | "urgent";

// Task status types
export type TaskStatus = "open" | "in_progress" | "completed" | "archived";

// Visit status types
export type VisitStatus = "pending" | "scheduled" | "in_progress" | "completed" | "cancelled" | "no_show";

// Visit workflow types
export type VisitWorkflowState = {
  visitCompleted: boolean;
  visitCanceled: boolean;
  visitConfirmed: boolean;
  otpVerified: boolean;
};

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
