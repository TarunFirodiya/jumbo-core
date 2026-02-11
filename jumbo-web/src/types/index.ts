/**
 * Common type definitions for Jumbo-Core
 */

// Re-export database types
export type {
  TeamMember,
  NewTeamMember,
  Profile,
  NewProfile,
  Contact,
  NewContact,
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
  ListingTier,
} from "@/lib/db/schema";

import { TeamMember, Lead, SellerLead, Building, Unit, AuditLog, Communication, Task, Listing, Note, MediaItem, HomeInspection, HomeCatalogue, Offer, BuyerEvent, Contact, Visit } from "@/lib/db/schema";

export type LeadWithRelations = Lead & {
  contact: Contact | null;
  assignedAgent: TeamMember | null;
  notes?: Note[];
  buyerEvents?: BuyerEvent[];
  offers?: Offer[];
};

export type ListingWithRelations = Listing & {
  unit: (Unit & {
    building: Building | null;
    owner?: TeamMember | null;
  }) | null;
  listingAgent?: TeamMember | null;
  zoneLead?: TeamMember | null;
  notes?: Note[];
  mediaItems?: MediaItem[];
  homeInspections?: HomeInspection[];
  homeCatalogues?: HomeCatalogue[];
  offers?: Offer[];
  visits?: Visit[];
  tasks?: Task[];
};

export type SellerLeadWithRelations = SellerLead & {
  contact: Contact | null;
  building: Building | null;
  unit: Unit | null;
  assignedTo: TeamMember | null;
  referredBy: TeamMember | null;
  createdBy: TeamMember | null;
  communications?: Communication[];
  tasks?: Task[];
  notes?: Note[];
  listings?: ListingWithRelations[];
};

export type AuditLogWithRelations = AuditLog & {
  performedBy: TeamMember | null;
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
export type ListingStatus = "draft" | "proposal_sent" | "proposal_accepted" | "inspection_pending" | "catalogue_pending" | "live" | "on_hold" | "sold";

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

// Task item for shared tab components
export interface TaskItem {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  dueAt: string | null;
  completedAt: string | null;
  creatorName: string;
  assigneeName: string;
}

// Communication item for shared tab components
export interface CommunicationItem {
  id: string;
  channel: string;
  direction: string;
  content: string;
  createdAt: string;
}

// Jumbo Coins action types
export type CoinActionType =
  | "inspection_approved"
  | "visit_completed"
  | "deal_closed"
  | "missed_visit"
  | "no_followup"
  | "new_listing";
