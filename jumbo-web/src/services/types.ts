/**
 * Service Layer Types
 * Shared types for all services
 */

import type {
  Lead,
  Listing,
  Building,
  Unit,
  TeamMember,
  Profile,
  SellerLead,
  Visit,
  VisitTour,
  Communication,
  Note,
  MediaItem,
  HomeInspection,
  HomeCatalogue,
  Offer,
  CreditLedgerEntry,
  CreditRule,
  Contact,
  AutomationTrigger,
  AutomationAction,
  AutomationExecutionLog,
  Notification,
} from "@/lib/db/schema";

// ============================================
// PAGINATION TYPES
// ============================================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// FILTER TYPES
// ============================================

export interface LeadFilters extends PaginationParams {
  status?: string;
  source?: string;
  agentId?: string;
  includeDeleted?: boolean;
}

export interface ListingFilters extends PaginationParams {
  status?: string;
  isVerified?: boolean;
  minPrice?: number;
  maxPrice?: number;
  bhk?: number;
  locality?: string;
  city?: string;
  includeDeleted?: boolean;
}

export interface BuildingFilters extends PaginationParams {
  city?: string;
  locality?: string;
  includeDeleted?: boolean;
}

export interface SellerLeadFilters extends PaginationParams {
  status?: string;
  source?: string;
  assignedToId?: string;
  includeDeleted?: boolean;
}

export interface VisitFilters extends PaginationParams {
  status?: string;
  leadId?: string;
  listingId?: string;
  tourId?: string;
  includeDeleted?: boolean;
}

export interface TourFilters extends PaginationParams {
  status?: string;
  fieldAgentId?: string;
  dispatchAgentId?: string;
  tourDate?: string;
}

export interface OfferFilters extends PaginationParams {
  status?: string;
  listingId?: string;
  leadId?: string;
  includeDeleted?: boolean;
}

export interface InspectionFilters extends PaginationParams {
  listingId?: string;
  status?: string;
  inspectedById?: string;
}

export interface CatalogueFilters extends PaginationParams {
  listingId?: string;
  status?: string;
  cataloguedById?: string;
}

// ============================================
// COMPLETE VISIT DATA
// ============================================

export interface CompleteVisitData {
  otpCode: string;
  location: {
    latitude: number;
    longitude: number;
  };
  feedback?: {
    text?: string;
    rating?: number;
    buyerScore?: number;
    primaryPainPoint?: string;
  };
}

export interface CompleteInspectionData {
  location: {
    latitude: number;
    longitude: number;
  };
  inspectionScore?: number;
  notes?: string;
  knownIssues?: string[];
}

// ============================================
// CREATE LISTING REQUEST (for upsert)
// ============================================

export interface CreateListingData {
  building:
    | { id: string }
    | {
        name: string;
        locality?: string;
        city?: string;
        latitude?: number;
        longitude?: number;
        amenities?: Record<string, boolean>;
        waterSource?: string;
      };
  unit: {
    unitNumber?: string;
    bhk: number;
    floorNumber?: number;
    carpetArea?: number;
    ownerId?: string;
  };
  listingAgentId?: string;
  askingPrice: number;
  description?: string;
  images?: string[];
  amenities?: string[];
  externalIds?: {
    housing_id?: string;
    magicbricks_id?: string;
    "99acres_id"?: string;
  };
}

// ============================================
// RE-EXPORT ENTITY TYPES
// ============================================

export type {
  Lead,
  Listing,
  Building,
  Unit,
  TeamMember,
  Profile,
  SellerLead,
  Visit,
  VisitTour,
  Communication,
  Note,
  MediaItem,
  HomeInspection,
  HomeCatalogue,
  Offer,
  CreditLedgerEntry,
  CreditRule,
  Contact,
  AutomationTrigger,
  AutomationAction,
  AutomationExecutionLog,
  Notification,
};
