import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  numeric,
  real,
  date,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================
// ENUMS
// ============================================

export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "listing_agent",
  "team_lead",
  "buyer_agent",
  "visit_agent",
  "dispatch_agent",
  "closing_agent",
  "seller_agent",
]);

export const sellerLeadStatusEnum = pgEnum("seller_lead_status", [
  "new",
  "proposal_sent",
  "proposal_accepted",
  "dropped",
]);

export const sellerLeadSourceEnum = pgEnum("seller_lead_source", [
  "website",
  "99acres",
  "magicbricks",
  "housing",
  "nobroker",
  "mygate",
  "referral",
]);

export const auditActionEnum = pgEnum("audit_action", [
  "create",
  "update",
  "delete",
]);

// New enums for schema migration
export const dropReasonEnum = pgEnum("drop_reason", [
  "not_interested",
  "price_too_high",
  "found_elsewhere",
  "invalid_lead",
  "duplicate",
  "other",
]);

export const configurationEnum = pgEnum("configuration", [
  "1BHK",
  "2BHK",
  "3BHK",
  "4BHK",
  "5BHK",
  "Studio",
  "Villa",
  "Penthouse",
]);

export const viewEnum = pgEnum("view", [
  "park",
  "road",
  "pool",
  "garden",
  "city",
  "lake",
  "other",
]);

export const facingEnum = pgEnum("facing", [
  "north",
  "south",
  "east",
  "west",
  "northeast",
  "northwest",
  "southeast",
  "southwest",
]);

export const uspEnum = pgEnum("usp", [
  "corner_unit",
  "high_floor",
  "parking",
  "balcony",
  "modern_kitchen",
  "spacious",
  "natural_light",
  "other",
]);

export const propertyTypeEnum = pgEnum("property_type", [
  "apartment",
  "villa",
  "penthouse",
  "plot",
  "commercial",
]);

export const occupancyEnum = pgEnum("occupancy", [
  "ready_to_move",
  "under_construction",
  "new_launch",
]);

export const furnishingEnum = pgEnum("furnishing", [
  "furnished",
  "semi_furnished",
  "unfurnished",
]);

export const soldByEnum = pgEnum("sold_by", [
  "jumbo",
  "owner",
  "other_agent",
]);

export const inventoryTypeEnum = pgEnum("inventory_type", [
  "primary",
  "secondary",
  "resale",
]);

export const urgencyEnum = pgEnum("urgency", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const priorityEnum = pgEnum("priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const visitedWithEnum = pgEnum("visited_with", [
  "alone",
  "family",
  "friends",
  "agent",
]);

export const primaryPainPointEnum = pgEnum("primary_pain_point", [
  "price",
  "location",
  "size",
  "condition",
  "amenities",
  "other",
]);

export const mediaTypeEnum = pgEnum("media_type", [
  "image",
  "video",
  "floor_plan",
  "document",
]);

export const inspectionStatusEnum = pgEnum("inspection_status", [
  "pending",
  "in_progress",
  "completed",
  "rejected",
]);

export const catalogueStatusEnum = pgEnum("catalogue_status", [
  "pending",
  "approved",
  "rejected",
  "needs_revision",
]);

export const offerStatusEnum = pgEnum("offer_status", [
  "pending",
  "accepted",
  "rejected",
  "countered",
]);

export const contactTypeEnum = pgEnum("contact_type", [
  "customer",
  "partner",
  "internal",
]);

// ============================================
// 0. UNIVERSAL CONTACTS (Identity Layer)
// ============================================

export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  phone: text("phone").unique().notNull(), // The primary identifier
  name: text("name"),
  email: text("email"),
  type: contactTypeEnum("type").default("customer"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// 1. USER & AGENT MANAGEMENT
// ============================================

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: text("full_name").notNull(),
  phone: text("phone").unique().notNull(),
  email: text("email").unique(),
  secondaryPhone: text("secondary_phone"),
  role: userRoleEnum("role").default("buyer_agent"),
  territoryId: text("territory_id"),
  totalCoins: integer("total_coins").default(0),
  contactId: uuid("contact_id").references((): any => contacts.id),
  createdById: uuid("created_by_id").references((): any => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// ============================================
// 2. INVENTORY HIERARCHY (Buildings -> Units -> Listings)
// ============================================

export const buildings = pgTable("buildings", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  locality: text("locality"),
  city: text("city"),
  nearestLandmark: text("nearest_landmark"),
  possessionDate: timestamp("possession_date", { withTimezone: true }),
  totalFloors: integer("total_floors"),
  totalUnits: integer("total_units"),
  acres: numeric("acres"),
  mapLink: text("map_link"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  amenitiesJson: jsonb("amenities_json").$type<Record<string, boolean>>(),
  waterSource: text("water_source"),
  khata: text("khata"),
  reraNumber: text("rera_number"),
  jumboPriceEstimate: numeric("jumbo_price_estimate"),
  underConstruction: boolean("under_construction").default(false),
  isModelFlatAvailable: boolean("is_model_flat_available").default(false),
  googleRating: numeric("google_rating"),
  gtmHousingName: text("gtm_housing_name"),
  gtmHousingId: text("gtm_housing_id"),
  mediaJson: jsonb("media_json").$type<Record<string, string[]>>(),
  createdById: uuid("created_by_id").references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const units = pgTable("units", {
  id: uuid("id").primaryKey().defaultRandom(),
  buildingId: uuid("building_id").references(() => buildings.id),
  unitNumber: text("unit_number"),
  bhk: real("bhk"),
  floorNumber: integer("floor_number"),
  carpetArea: real("carpet_area"),
  tower: text("tower"),
  view: viewEnum("view"),
  superBuiltupArea: numeric("super_builtup_area"),
  facing: facingEnum("facing"),
  uds: numeric("uds"),
  parkingCount: integer("parking_count"),
  bedroomCount: integer("bedroom_count"),
  bathroomCount: integer("bathroom_count"),
  balconyCount: integer("balcony_count"),
  lpgConnection: boolean("lpg_connection").default(false),
  keysPhone: text("keys_phone"),
  keysWith: text("keys_with"),
  ownerId: uuid("owner_id").references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const listings = pgTable("listings", {
  id: uuid("id").primaryKey().defaultRandom(),
  unitId: uuid("unit_id").references(() => units.id),
  listingAgentId: uuid("listing_agent_id").references(() => profiles.id),
  jumboId: text("jumbo_id"),
  hid: text("hid"),
  listingSlug: text("listing_slug"),
  configuration: configurationEnum("configuration"),
  flatNumber: text("flat_number"),
  status: text("status").default("draft"),
  askingPrice: numeric("asking_price"),
  askPriceLacs: numeric("ask_price_lacs"),
  pricePerSqft: numeric("price_per_sqft"),
  msp: numeric("msp"),
  maintenance: numeric("maintenance"),
  sellerFeesPercent: numeric("seller_fees_percent"),
  usp1: uspEnum("usp_1"),
  usp2: uspEnum("usp_2"),
  usp3: uspEnum("usp_3"),
  propertyType: propertyTypeEnum("property_type"),
  occupancy: occupancyEnum("occupancy"),
  furnishing: furnishingEnum("furnishing"),
  zoneLeadId: uuid("zone_lead_id").references(() => profiles.id),
  onHold: boolean("on_hold").default(false),
  sold: boolean("sold").default(false),
  soldBy: soldByEnum("sold_by"),
  inventoryType: inventoryTypeEnum("inventory_type"),
  sellingPrice: numeric("selling_price"),
  bookingDate: timestamp("booking_date", { withTimezone: true }),
  mouDate: timestamp("mou_date", { withTimezone: true }),
  sourcePrice: numeric("source_price"),
  urgency: urgencyEnum("urgency"),
  gtmJumboListingUrl: text("gtm_jumbo_listing_url"),
  gtmWebsiteLiveDate: timestamp("gtm_website_live_date", { withTimezone: true }),
  gtmHousingUrl: text("gtm_housing_url"),
  gtm99AcresUrl: text("gtm_99acres_url"),
  gtmHousingListingId: text("gtm_housing_listing_id"),
  gtm99AcresListingId: text("gtm_99acres_listing_id"),
  gtmReady: boolean("gtm_ready").default(false),
  gtmHousingLiveDate: timestamp("gtm_housing_live_date", { withTimezone: true }),
  photoshootScheduled: timestamp("photoshoot_scheduled", { withTimezone: true }),
  photoshootCompleted: timestamp("photoshoot_completed", { withTimezone: true }),
  photoshootAvailability1: timestamp("photoshoot_availability_1", { withTimezone: true }),
  photoshootAvailability2: timestamp("photoshoot_availability_2", { withTimezone: true }),
  photoshootAvailability3: timestamp("photoshoot_availability_3", { withTimezone: true }),
  photoshootRtmi: boolean("photoshoot_rtmi").default(false),
  photoshootAssignedToId: uuid("photoshoot_assigned_to_id").references(() => profiles.id),
  offboardingDatetime: timestamp("offboarding_datetime", { withTimezone: true }),
  offboardingDelistedById: uuid("offboarding_delisted_by_id").references(() => profiles.id),
  spotlight: boolean("spotlight").default(false),
  priority: priorityEnum("priority"),
  builderUnit: boolean("builder_unit").default(false),
  description: text("description"),
  images: jsonb("images").$type<string[]>().default([]),
  mediaJson: jsonb("media_json").$type<Record<string, string[]>>(),
  amenitiesJson: jsonb("amenities_json").$type<string[]>().default([]),
  externalIds: jsonb("external_ids").$type<{
    housing_id?: string;
    magicbricks_id?: string;
    "99acres_id"?: string;
  }>(),
  isVerified: boolean("is_verified").default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// ============================================
// 3. CRM & LEAD MANAGEMENT (Buyer Leads)
// ============================================

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").references(() => profiles.id),
  leadId: text("lead_id"),
  source: text("source"),
  externalId: text("external_id"), // ID from Housing.com, MagicBricks, etc.
  secondaryPhone: text("secondary_phone"),
  sourceListingId: text("source_listing_id"),
  contactId: uuid("contact_id").references(() => contacts.id), // Migration: Link to Identity
  dropReason: text("drop_reason"),
  locality: text("locality"),
  zone: text("zone"),
  pipeline: boolean("pipeline").default(false),
  referredBy: text("referred_by"),
  testListingId: text("test_listing_id"),
  status: text("status").default("new"),
  assignedAgentId: uuid("assigned_agent_id").references(() => profiles.id),
  requirementJson: jsonb("requirement_json").$type<{
    bhk?: number[];
    budget_min?: number;
    budget_max?: number;
    localities?: string[];
  }>(),
  preferenceJson: jsonb("preference_json").$type<{
    configuration?: string[];
    max_cap?: string;
    landmark?: string;
    property_type?: string;
    floor_preference?: string;
    khata?: string;
    main_door_facing?: string;
    must_haves?: string[];
    buy_reason?: string;
    preferred_buildings?: string[];
  }>(),
  lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// ============================================
// 3b. CRM & LEAD MANAGEMENT (Seller Leads)
// ============================================

export const sellerLeads = pgTable("seller_leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").references(() => profiles.id),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  secondaryPhone: text("secondary_phone"),
  status: sellerLeadStatusEnum("status").default("new"),
  source: sellerLeadSourceEnum("source").notNull(),
  sourceUrl: text("source_url"),
  sourceListingUrl: text("source_listing_url"),
  contactId: uuid("contact_id").references(() => contacts.id), // Migration: Link to Identity
  dropReason: dropReasonEnum("drop_reason"),
  referredById: uuid("referred_by_id").references(() => profiles.id),
  buildingId: uuid("building_id").references(() => buildings.id),
  unitId: uuid("unit_id").references(() => units.id),
  assignedToId: uuid("assigned_to_id").references(() => profiles.id),
  followUpDate: timestamp("follow_up_date", { withTimezone: true }),
  isNri: boolean("is_nri").default(false),
  createdById: uuid("created_by_id").references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// ============================================
// 4. COMMUNICATIONS LOG (WhatsApp & Calls)
// ============================================

export const communications = pgTable("communications", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id").references(() => leads.id),
  sellerLeadId: uuid("seller_lead_id").references(() => sellerLeads.id),
  listingId: uuid("listing_id").references(() => listings.id),
  visitId: uuid("visit_id").references(() => visits.id),
  agentId: uuid("agent_id").references(() => profiles.id),
  channel: text("channel"),
  direction: text("direction"),
  content: text("content"),
  recordingUrl: text("recording_url"),
  metadata: jsonb("metadata").$type<{
    duration?: number;
    wa_message_id?: string;
  }>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// 5. OPERATIONS & LOGISTICS (Tours & Visits)
// ============================================

export const visitTours = pgTable("visit_tours", {
  id: uuid("id").primaryKey().defaultRandom(),
  dispatchAgentId: uuid("dispatch_agent_id").references(() => profiles.id),
  fieldAgentId: uuid("field_agent_id").references(() => profiles.id),
  tourDate: date("tour_date"),
  optimizedRoute: jsonb("optimized_route").$type<{
    waypoints?: Array<{ lat: number; lng: number; listing_id: string }>;
  }>(),
  status: text("status").default("planned"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const visits = pgTable("visits", {
  id: uuid("id").primaryKey().defaultRandom(),
  tourId: uuid("tour_id").references(() => visitTours.id),
  leadId: uuid("lead_id").references(() => leads.id),
  listingId: uuid("listing_id").references(() => listings.id),
  visitorName: text("visitor_name"),
  homesVisited: text("homes_visited"),
  visitStatus: text("visit_status"),
  visitCompleted: boolean("visit_completed").default(false),
  visitCanceled: boolean("visit_canceled").default(false),
  visitConfirmed: boolean("visit_confirmed").default(false),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  canceledAt: timestamp("canceled_at", { withTimezone: true }),
  dropReason: dropReasonEnum("drop_reason"),
  visitedWith: visitedWithEnum("visited_with"),
  secondaryPhone: text("secondary_phone"),
  otpCode: text("otp_code"),
  otpVerified: boolean("otp_verified").default(false),
  otpStartEntry: integer("otp_start_entry"),
  otpStartEntryTime: timestamp("otp_start_entry_time", { withTimezone: true }),
  completionLatitude: real("completion_latitude"),
  completionLongitude: real("completion_longitude"),
  visitLocation: text("visit_location"),
  primaryPainPoint: primaryPainPointEnum("primary_pain_point"),
  buyerScore: numeric("buyer_score"),
  rescheduleTime: timestamp("reschedule_time", { withTimezone: true }),
  rescheduleRequested: boolean("reschedule_requested").default(false),
  rescheduledFromVisitId: uuid("rescheduled_from_visit_id").references((): any => visits.id),
  assignedVaId: uuid("assigned_va_id").references(() => profiles.id),
  completedById: uuid("completed_by_id").references(() => profiles.id),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  status: text("status").default("pending"),
  feedbackText: text("feedback_text"),
  feedback: text("feedback"),
  feedbackRating: integer("feedback_rating"),
  bsaBool: boolean("bsa_bool").default(false),
  agentLatitude: real("agent_latitude"),
  agentLongitude: real("agent_longitude"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// 6. TASK MANAGEMENT
// ============================================

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  creatorId: uuid("creator_id").references(() => profiles.id),
  assigneeId: uuid("assignee_id").references(() => profiles.id),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").default("medium"),
  dueAt: timestamp("due_at", { withTimezone: true }),
  relatedLeadId: uuid("related_lead_id").references(() => leads.id),
  sellerLeadId: uuid("seller_lead_id").references(() => sellerLeads.id),
  status: text("status").default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// ============================================
// 7. PERFORMANCE MANAGEMENT (Jumbo-Coins Ledger)
// ============================================

export const creditRules = pgTable("credit_rules", {
  actionType: text("action_type").primaryKey(),
  coinValue: integer("coin_value").notNull(),
  description: text("description"),
});

export const creditLedger = pgTable("credit_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id").references(() => profiles.id),
  amount: integer("amount").notNull(),
  actionType: text("action_type"),
  referenceId: uuid("reference_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// 8. AUDIT LOGS (Timeline/History Tracking)
// ============================================

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityType: text("entity_type").notNull(), // seller_lead, listing, visit, lead, etc.
  entityId: uuid("entity_id").notNull(),
  action: auditActionEnum("action").notNull(),
  changes: jsonb("changes").$type<Record<string, { old: unknown; new: unknown }>>(),
  performedById: uuid("performed_by_id").references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// 9. NOTES (Multi-note system)
// ============================================

export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityType: text("entity_type").notNull(), // 'seller_lead', 'buyer_lead', 'listing', 'visit', 'building', 'unit'
  entityId: uuid("entity_id").notNull(),
  content: text("content").notNull(),
  createdById: uuid("created_by_id").references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// ============================================
// 10. MEDIA ITEMS (Detailed media management)
// ============================================

export const mediaItems = pgTable("media_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityType: text("entity_type").notNull(), // 'listing', 'building', 'home_inspection', 'home_catalogue'
  entityId: uuid("entity_id").notNull(),
  mediaType: mediaTypeEnum("media_type").notNull(),
  tag: text("tag"), // 'living_room', 'kitchen', 'bedroom_1', 'facade', etc.
  cloudinaryUrl: text("cloudinary_url").notNull(),
  cloudinaryPublicId: text("cloudinary_public_id"),
  order: integer("order").default(0),
  metadata: jsonb("metadata").$type<{
    width?: number;
    height?: number;
    duration?: number;
    format?: string;
    [key: string]: unknown;
  }>(),
  uploadedById: uuid("uploaded_by_id").references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// ============================================
// 11. HOME INSPECTIONS (On-premise workflow)
// ============================================

export const homeInspections = pgTable("home_inspections", {
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id").references(() => listings.id),
  name: text("name"),
  location: text("location"),
  inspectedOn: timestamp("inspected_on", { withTimezone: true }),
  inspectedById: uuid("inspected_by_id").references(() => profiles.id),
  inspectionLatitude: real("inspection_latitude"),
  inspectionLongitude: real("inspection_longitude"),
  inspectionScore: numeric("inspection_score"),
  attempts: integer("attempts").default(0),
  notes: text("notes"),
  cauveryChecklist: boolean("cauvery_checklist").default(false),
  knownIssues: jsonb("known_issues").$type<string[]>(),
  imagesJsonUrl: text("images_json_url"),
  buildingJsonUrl: text("building_json_url"),
  videoLink: text("video_link"),
  thumbnailUrl: text("thumbnail_url"),
  status: inspectionStatusEnum("status").default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// 12. HOME CATALOGUES (Approval workflow)
// ============================================

export const homeCatalogues = pgTable("home_catalogues", {
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id").references(() => listings.id),
  inspectionId: uuid("inspection_id").references(() => homeInspections.id),
  name: text("name"),
  inspectedOn: timestamp("inspected_on", { withTimezone: true }),
  cataloguedById: uuid("catalogued_by_id").references(() => profiles.id),
  cataloguingScore: numeric("cataloguing_score"),
  cauveryChecklist: boolean("cauvery_checklist").default(false),
  thumbnailUrl: text("thumbnail_url"),
  floorPlanUrl: text("floor_plan_url"),
  buildingJsonUrl: text("building_json_url"),
  listingJsonUrl: text("listing_json_url"),
  video30SecUrl: text("video_30sec_url"),
  status: catalogueStatusEnum("status").default("pending"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// 13. BUYER EVENTS (Buyer interaction events)
// ============================================

export const buyerEvents = pgTable("buyer_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id").references(() => leads.id),
  profileId: uuid("profile_id").references(() => profiles.id),
  phone: text("phone"),
  leadSource: text("lead_source"),
  sourceListingId: text("source_listing_id"),
  eventType: text("event_type"), // 'lead_created', 'listing_viewed', 'contact_made', etc.
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdById: uuid("created_by_id").references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// 14. OFFERS (Offers/Deals tracking)
// ============================================

export const offers = pgTable("offers", {
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id").references(() => listings.id),
  leadId: uuid("lead_id").references(() => leads.id),
  offerAmount: numeric("offer_amount").notNull(),
  status: offerStatusEnum("status").default("pending"),
  terms: jsonb("terms").$type<Record<string, unknown>>(),
  createdById: uuid("created_by_id").references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// ============================================
// RELATIONS
// ============================================

export const profilesRelations = relations(profiles, ({ many, one }) => ({
  ownedUnits: many(units, { relationName: "unitOwner" }),
  createdListings: many(listings, { relationName: "listingAgent" }),
  assignedLeads: many(leads, { relationName: "assignedAgent" }),
  buyerLeads: many(leads, { relationName: "buyerProfile" }),
  assignedSellerLeads: many(sellerLeads, { relationName: "assignedAgent" }),
  referredSellerLeads: many(sellerLeads, { relationName: "referredBy" }),
  createdSellerLeads: many(sellerLeads, { relationName: "createdBy" }),
  communications: many(communications),
  dispatchedTours: many(visitTours, { relationName: "dispatchAgent" }),
  fieldTours: many(visitTours, { relationName: "fieldAgent" }),
  createdTasks: many(tasks, { relationName: "taskCreator" }),
  assignedTasks: many(tasks, { relationName: "taskAssignee" }),
  creditEntries: many(creditLedger),
  auditLogs: many(auditLogs),
  // Notes use polymorphic relationship (entityType/entityId), so we can't use direct relation
  // Query notes separately using entityType and entityId
  mediaItems: many(mediaItems, { relationName: "uploadedBy" }),
  homeInspections: many(homeInspections),
  homeCatalogues: many(homeCatalogues),
  buyerEvents: many(buyerEvents, { relationName: "eventCreator" }),
  offers: many(offers),
  zoneLeads: many(listings, { relationName: "zoneLead" }),
  photoshootAssignments: many(listings, { relationName: "photoshootAssignedTo" }),
  offboardingDelistings: many(listings, { relationName: "offboardingDelistedBy" }),
  assignedVisits: many(visits, { relationName: "assignedVa" }),
  completedVisits: many(visits, { relationName: "completedBy" }),
  contact: one(contacts, {
    fields: [profiles.contactId],
    references: [contacts.id],
  }),
  createdBy: one(profiles, {
    fields: [profiles.createdById],
    references: [profiles.id],
    relationName: "createdByProfile",
  }),
}));

export const buildingsRelations = relations(buildings, ({ many, one }) => ({
  units: many(units),
  sellerLeads: many(sellerLeads),
  // MediaItems use polymorphic relationship (entityType/entityId), so we can't use direct relation
  // Query mediaItems separately using entityType='building' and entityId=building.id
  createdBy: one(profiles, {
    fields: [buildings.createdById],
    references: [profiles.id],
  }),
}));

export const unitsRelations = relations(units, ({ one, many }) => ({
  building: one(buildings, {
    fields: [units.buildingId],
    references: [buildings.id],
  }),
  owner: one(profiles, {
    fields: [units.ownerId],
    references: [profiles.id],
    relationName: "unitOwner",
  }),
  listings: many(listings),
  sellerLeads: many(sellerLeads),
}));

export const listingsRelations = relations(listings, ({ one, many }) => ({
  unit: one(units, {
    fields: [listings.unitId],
    references: [units.id],
  }),
  listingAgent: one(profiles, {
    fields: [listings.listingAgentId],
    references: [profiles.id],
    relationName: "listingAgent",
  }),
  zoneLead: one(profiles, {
    fields: [listings.zoneLeadId],
    references: [profiles.id],
    relationName: "zoneLead",
  }),
  photoshootAssignedTo: one(profiles, {
    fields: [listings.photoshootAssignedToId],
    references: [profiles.id],
    relationName: "photoshootAssignedTo",
  }),
  offboardingDelistedBy: one(profiles, {
    fields: [listings.offboardingDelistedById],
    references: [profiles.id],
    relationName: "offboardingDelistedBy",
  }),
  visits: many(visits),
  // Notes use polymorphic relationship (entityType/entityId), so we can't use direct relation
  // Query notes separately using entityType='listing' and entityId=listing.id
  // MediaItems also use polymorphic relationship (entityType/entityId), so we can't use direct relation
  // Query mediaItems separately using entityType='listing' and entityId=listing.id
  homeInspections: many(homeInspections),
  homeCatalogues: many(homeCatalogues),
  offers: many(offers),
  communications: many(communications),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [leads.profileId],
    references: [profiles.id],
    relationName: "buyerProfile",
  }),
  assignedAgent: one(profiles, {
    fields: [leads.assignedAgentId],
    references: [profiles.id],
    relationName: "assignedAgent",
  }),
  communications: many(communications),
  visits: many(visits),
  tasks: many(tasks),
  // Notes use polymorphic relationship (entityType/entityId), so we can't use direct relation
  // Query notes separately using entityType='buyer_lead' and entityId=lead.id
  buyerEvents: many(buyerEvents),
  offers: many(offers),
  contact: one(contacts, {
    fields: [leads.contactId],
    references: [contacts.id],
  }),
}));

export const communicationsRelations = relations(communications, ({ one }) => ({
  lead: one(leads, {
    fields: [communications.leadId],
    references: [leads.id],
  }),
  sellerLead: one(sellerLeads, {
    fields: [communications.sellerLeadId],
    references: [sellerLeads.id],
  }),
  listing: one(listings, {
    fields: [communications.listingId],
    references: [listings.id],
  }),
  visit: one(visits, {
    fields: [communications.visitId],
    references: [visits.id],
  }),
  agent: one(profiles, {
    fields: [communications.agentId],
    references: [profiles.id],
  }),
}));

export const visitToursRelations = relations(visitTours, ({ one, many }) => ({
  dispatchAgent: one(profiles, {
    fields: [visitTours.dispatchAgentId],
    references: [profiles.id],
    relationName: "dispatchAgent",
  }),
  fieldAgent: one(profiles, {
    fields: [visitTours.fieldAgentId],
    references: [profiles.id],
    relationName: "fieldAgent",
  }),
  visits: many(visits),
}));

export const visitsRelations = relations(visits, ({ one, many }) => ({
  tour: one(visitTours, {
    fields: [visits.tourId],
    references: [visitTours.id],
  }),
  lead: one(leads, {
    fields: [visits.leadId],
    references: [leads.id],
  }),
  listing: one(listings, {
    fields: [visits.listingId],
    references: [listings.id],
  }),
  rescheduledFrom: one(visits, {
    fields: [visits.rescheduledFromVisitId],
    references: [visits.id],
    relationName: "rescheduledFrom",
  }),
  assignedVa: one(profiles, {
    fields: [visits.assignedVaId],
    references: [profiles.id],
    relationName: "assignedVa",
  }),
  completedBy: one(profiles, {
    fields: [visits.completedById],
    references: [profiles.id],
    relationName: "completedBy",
  }),
  // Notes use polymorphic relationship (entityType/entityId), so we can't use direct relation
  // Query notes separately using entityType='visit' and entityId=visit.id
  communications: many(communications),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  creator: one(profiles, {
    fields: [tasks.creatorId],
    references: [profiles.id],
    relationName: "taskCreator",
  }),
  assignee: one(profiles, {
    fields: [tasks.assigneeId],
    references: [profiles.id],
    relationName: "taskAssignee",
  }),
  relatedLead: one(leads, {
    fields: [tasks.relatedLeadId],
    references: [leads.id],
  }),
  sellerLead: one(sellerLeads, {
    fields: [tasks.sellerLeadId],
    references: [sellerLeads.id],
  }),
}));

export const creditLedgerRelations = relations(creditLedger, ({ one }) => ({
  agent: one(profiles, {
    fields: [creditLedger.agentId],
    references: [profiles.id],
  }),
}));

export const sellerLeadsRelations = relations(sellerLeads, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [sellerLeads.profileId],
    references: [profiles.id],
    relationName: "sellerProfile",
  }),
  referredBy: one(profiles, {
    fields: [sellerLeads.referredById],
    references: [profiles.id],
    relationName: "referredBy",
  }),
  building: one(buildings, {
    fields: [sellerLeads.buildingId],
    references: [buildings.id],
  }),
  unit: one(units, {
    fields: [sellerLeads.unitId],
    references: [units.id],
  }),
  assignedTo: one(profiles, {
    fields: [sellerLeads.assignedToId],
    references: [profiles.id],
    relationName: "assignedAgent",
  }),
  createdBy: one(profiles, {
    fields: [sellerLeads.createdById],
    references: [profiles.id],
    relationName: "createdBy",
  }),
  communications: many(communications),
  tasks: many(tasks),
  // Notes use polymorphic relationship (entityType/entityId), so we can't use direct relation
  // Query notes separately using entityType='seller_lead' and entityId=sellerLead.id
  contact: one(contacts, {
    fields: [sellerLeads.contactId],
    references: [contacts.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  performedBy: one(profiles, {
    fields: [auditLogs.performedById],
    references: [profiles.id],
  }),
}));

export const contactsRelations = relations(contacts, ({ many }) => ({
  profiles: many(profiles),
  leads: many(leads),
  sellerLeads: many(sellerLeads),
}));

// ============================================
// NEW TABLE RELATIONS
// ============================================

export const notesRelations = relations(notes, ({ one }) => ({
  createdBy: one(profiles, {
    fields: [notes.createdById],
    references: [profiles.id],
  }),
}));

export const mediaItemsRelations = relations(mediaItems, ({ one }) => ({
  uploadedBy: one(profiles, {
    fields: [mediaItems.uploadedById],
    references: [profiles.id],
    relationName: "uploadedBy",
  }),
}));

export const homeInspectionsRelations = relations(homeInspections, ({ one, many }) => ({
  listing: one(listings, {
    fields: [homeInspections.listingId],
    references: [listings.id],
  }),
  inspectedBy: one(profiles, {
    fields: [homeInspections.inspectedById],
    references: [profiles.id],
  }),
  // MediaItems use polymorphic relationship (entityType/entityId), so we can't use direct relation
  // Query mediaItems separately using entityType='home_inspection' and entityId=inspection.id
  catalogues: many(homeCatalogues),
}));

export const homeCataloguesRelations = relations(homeCatalogues, ({ one, many }) => ({
  listing: one(listings, {
    fields: [homeCatalogues.listingId],
    references: [listings.id],
  }),
  inspection: one(homeInspections, {
    fields: [homeCatalogues.inspectionId],
    references: [homeInspections.id],
  }),
  cataloguedBy: one(profiles, {
    fields: [homeCatalogues.cataloguedById],
    references: [profiles.id],
  }),
  // MediaItems use polymorphic relationship (entityType/entityId), so we can't use direct relation
  // Query mediaItems separately using entityType='home_catalogue' and entityId=catalogue.id
}));

export const buyerEventsRelations = relations(buyerEvents, ({ one }) => ({
  lead: one(leads, {
    fields: [buyerEvents.leadId],
    references: [leads.id],
  }),
  profile: one(profiles, {
    fields: [buyerEvents.profileId],
    references: [profiles.id],
  }),
  createdBy: one(profiles, {
    fields: [buyerEvents.createdById],
    references: [profiles.id],
    relationName: "eventCreator",
  }),
}));

export const offersRelations = relations(offers, ({ one }) => ({
  listing: one(listings, {
    fields: [offers.listingId],
    references: [listings.id],
  }),
  lead: one(leads, {
    fields: [offers.leadId],
    references: [leads.id],
  }),
  createdBy: one(profiles, {
    fields: [offers.createdById],
    references: [profiles.id],
  }),
}));

// ============================================
// TYPE EXPORTS
// ============================================

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type Building = typeof buildings.$inferSelect;
export type NewBuilding = typeof buildings.$inferInsert;

export type Unit = typeof units.$inferSelect;
export type NewUnit = typeof units.$inferInsert;

export type Listing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;

export type Communication = typeof communications.$inferSelect;
export type NewCommunication = typeof communications.$inferInsert;

export type VisitTour = typeof visitTours.$inferSelect;
export type NewVisitTour = typeof visitTours.$inferInsert;

export type Visit = typeof visits.$inferSelect;
export type NewVisit = typeof visits.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

export type CreditRule = typeof creditRules.$inferSelect;
export type NewCreditRule = typeof creditRules.$inferInsert;

export type CreditLedgerEntry = typeof creditLedger.$inferSelect;
export type NewCreditLedgerEntry = typeof creditLedger.$inferInsert;

export type SellerLead = typeof sellerLeads.$inferSelect;
export type NewSellerLead = typeof sellerLeads.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

// Role type for RBAC
export type UserRole = (typeof userRoleEnum.enumValues)[number];

// Seller Lead Status and Source types
export type SellerLeadStatus = (typeof sellerLeadStatusEnum.enumValues)[number];
export type SellerLeadSource = (typeof sellerLeadSourceEnum.enumValues)[number];
export type AuditAction = (typeof auditActionEnum.enumValues)[number];

// New type exports
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;

export type MediaItem = typeof mediaItems.$inferSelect;
export type NewMediaItem = typeof mediaItems.$inferInsert;

export type HomeInspection = typeof homeInspections.$inferSelect;
export type NewHomeInspection = typeof homeInspections.$inferInsert;

export type HomeCatalogue = typeof homeCatalogues.$inferSelect;
export type NewHomeCatalogue = typeof homeCatalogues.$inferInsert;

export type BuyerEvent = typeof buyerEvents.$inferSelect;
export type NewBuyerEvent = typeof buyerEvents.$inferInsert;

export type Offer = typeof offers.$inferSelect;
export type NewOffer = typeof offers.$inferInsert;

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;

// Enum type exports
export type DropReason = (typeof dropReasonEnum.enumValues)[number];
export type Configuration = (typeof configurationEnum.enumValues)[number];
export type View = (typeof viewEnum.enumValues)[number];
export type Facing = (typeof facingEnum.enumValues)[number];
export type Usp = (typeof uspEnum.enumValues)[number];
export type PropertyType = (typeof propertyTypeEnum.enumValues)[number];
export type Occupancy = (typeof occupancyEnum.enumValues)[number];
export type Furnishing = (typeof furnishingEnum.enumValues)[number];
export type SoldBy = (typeof soldByEnum.enumValues)[number];
export type InventoryType = (typeof inventoryTypeEnum.enumValues)[number];
export type Urgency = (typeof urgencyEnum.enumValues)[number];
export type Priority = (typeof priorityEnum.enumValues)[number];
export type VisitedWith = (typeof visitedWithEnum.enumValues)[number];
export type PrimaryPainPoint = (typeof primaryPainPointEnum.enumValues)[number];
export type MediaType = (typeof mediaTypeEnum.enumValues)[number];
export type InspectionStatus = (typeof inspectionStatusEnum.enumValues)[number];
export type CatalogueStatus = (typeof catalogueStatusEnum.enumValues)[number];
export type OfferStatus = (typeof offerStatusEnum.enumValues)[number];

