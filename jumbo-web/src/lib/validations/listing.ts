import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { listings } from "@/lib/db/schema";

// Enum definitions for listing fields (viewEnum, facingEnum defined in unit.ts)
export const configurationEnum = z.enum(["1BHK", "2BHK", "3BHK", "4BHK", "5BHK", "Studio", "Villa", "Penthouse"]);
export const uspEnum = z.enum(["corner_unit", "high_floor", "parking", "balcony", "modern_kitchen", "spacious", "natural_light", "other"]);
export const propertyTypeEnum = z.enum(["apartment", "villa", "penthouse", "plot", "commercial"]);
export const occupancyEnum = z.enum(["ready_to_move", "under_construction", "new_launch"]);
export const furnishingEnum = z.enum(["furnished", "semi_furnished", "unfurnished"]);
export const soldByEnum = z.enum(["jumbo", "owner", "other_agent"]);
export const inventoryTypeEnum = z.enum(["primary", "secondary", "resale"]);
export const urgencyEnum = z.enum(["low", "medium", "high", "urgent"]);
export const priorityEnum = z.enum(["low", "medium", "high", "urgent"]);

export const LISTING_STATUSES = ["draft", "proposal_sent", "proposal_accepted", "inspection_pending", "catalogue_pending", "live", "on_hold", "sold"] as const;
export const listingTierEnum = z.enum(["reserve", "cash_plus", "lite"]);

// Base schemas from Drizzle
export const insertListingSchema = createInsertSchema(listings);
export const selectListingSchema = createSelectSchema(listings);

// API request schemas
export const createListingRequestSchema = z.object({
  // Building info (can reference existing or create new)
  building: z.union([
    z.object({
      id: z.string().uuid(),
    }),
    z.object({
      name: z.string().min(2),
      locality: z.string().optional(),
      city: z.string().optional(),
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
      amenities: z.record(z.string(), z.boolean()).optional(),
      waterSource: z.string().optional(),
    }),
  ]),
  // Unit info
  unit: z.object({
    unitNumber: z.string().optional(),
    bhk: z.number().min(0.5).max(10),
    floorNumber: z.number().int().min(-5).max(100).optional(),
    carpetArea: z.number().positive().optional(),
    ownerId: z.string().uuid().optional(),
  }),
  // Listing info
  askingPrice: z.number().positive(),
  externalIds: z.object({
    housing_id: z.string().optional(),
    magicbricks_id: z.string().optional(),
  }).optional(),
});

export const updateListingStatusSchema = z.object({
  status: z.enum(LISTING_STATUSES),
});

export const updateListingPriceSchema = z.object({
  askingPrice: z.number().positive(),
});

export const verifyListingSchema = z.object({
  isVerified: z.boolean(),
  inspectionNotes: z.string().optional(),
});

// Extended listing update schema with all new fields
export const updateListingSchema = z.object({
  jumboId: z.string().optional(),
  hid: z.string().optional(),
  listingSlug: z.string().optional(),
  configuration: configurationEnum.optional(),
  flatNumber: z.string().optional(),
  askPriceLacs: z.number().positive().optional(),
  pricePerSqft: z.number().positive().optional(),
  msp: z.number().positive().optional(),
  maintenance: z.number().positive().optional(),
  sellerFeesPercent: z.number().min(0).max(100).optional(),
  usp1: uspEnum.optional(),
  usp2: uspEnum.optional(),
  usp3: uspEnum.optional(),
  propertyType: propertyTypeEnum.optional(),
  occupancy: occupancyEnum.optional(),
  furnishing: furnishingEnum.optional(),
  zoneLeadId: z.string().uuid().optional().nullable(),
  tier: listingTierEnum.optional().nullable(),
  status: z.enum(LISTING_STATUSES).optional(),
  onHold: z.boolean().optional(),
  sold: z.boolean().optional(),
  soldBy: soldByEnum.optional(),
  inventoryType: inventoryTypeEnum.optional(),
  sellingPrice: z.number().positive().optional(),
  bookingDate: z.string().datetime().optional().nullable(),
  mouDate: z.string().datetime().optional().nullable(),
  sourcePrice: z.number().positive().optional(),
  urgency: urgencyEnum.optional(),
  videoUrl: z.string().url().optional().nullable(),
  floorPlanUrl: z.string().url().optional().nullable(),
  tour3dUrl: z.string().url().optional().nullable(),
  brochureUrl: z.string().url().optional().nullable(),
  gtmJumboListingUrl: z.string().url().optional(),
  gtmWebsiteLiveDate: z.string().datetime().optional().nullable(),
  gtmHousingUrl: z.string().url().optional(),
  gtm99AcresUrl: z.string().url().optional(),
  gtmHousingListingId: z.string().optional(),
  gtm99AcresListingId: z.string().optional(),
  gtmReady: z.boolean().optional(),
  gtmHousingLiveDate: z.string().datetime().optional().nullable(),
  photoshootScheduled: z.string().datetime().optional().nullable(),
  photoshootCompleted: z.string().datetime().optional().nullable(),
  photoshootAvailability1: z.string().datetime().optional().nullable(),
  photoshootAvailability2: z.string().datetime().optional().nullable(),
  photoshootAvailability3: z.string().datetime().optional().nullable(),
  photoshootRtmi: z.boolean().optional(),
  photoshootAssignedToId: z.string().uuid().optional().nullable(),
  offboardingDatetime: z.string().datetime().optional().nullable(),
  offboardingDelistedById: z.string().uuid().optional().nullable(),
  spotlight: z.boolean().optional(),
  priority: priorityEnum.optional(),
  builderUnit: z.boolean().optional(),
  description: z.string().optional(),
  mediaJson: z.record(z.string(), z.array(z.string())).optional(),
  externalIds: z.object({
    housing_id: z.string().optional(),
    magicbricks_id: z.string().optional(),
    "99acres_id": z.string().optional(),
  }).optional(),
});

// Query params schema
export const listingQuerySchema = z.object({
  status: z.enum(LISTING_STATUSES).optional(),
  isVerified: z.coerce.boolean().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  bhk: z.coerce.number().optional(),
  locality: z.string().optional(),
  city: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Public API schema (for jumbohomes.in)
export const publicListingQuerySchema = z.object({
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  bhk: z.coerce.number().optional(),
  locality: z.string().optional(),
  city: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

// Type exports
export type CreateListingRequest = z.infer<typeof createListingRequestSchema>;
export type UpdateListingStatus = z.infer<typeof updateListingStatusSchema>;
export type UpdateListing = z.infer<typeof updateListingSchema>;
export type UpdateListingPrice = z.infer<typeof updateListingPriceSchema>;
export type VerifyListing = z.infer<typeof verifyListingSchema>;
export type ListingQuery = z.infer<typeof listingQuerySchema>;
export type PublicListingQuery = z.infer<typeof publicListingQuerySchema>;
