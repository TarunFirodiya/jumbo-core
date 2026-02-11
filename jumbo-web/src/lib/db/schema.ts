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

export const listingTierEnum = pgEnum("listing_tier", [
  "reserve",
  "cash_plus",
  "lite",
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
  createdById: uuid("created_by_id"),
  updatedById: uuid("updated_by_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// 1. TEAM (Internal Users / Agents)
//    Renamed from "profiles" — this table is for
//    internal team members only (agents, admins, etc.)
// ============================================

export const team = pgTable("team", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: text("full_name").notNull(),
  phone: text("phone").unique().notNull(),
  email: text("email").unique(),
  secondaryPhone: text("secondary_phone"),
  role: userRoleEnum("role").default("buyer_agent"),
  territoryId: text("territory_id"),
  totalCoins: integer("total_coins").default(0),
  contactId: uuid("contact_id").references((): any => contacts.id),
  createdById: uuid("created_by_id").references((): any => team.id),
  updatedById: uuid("updated_by_id").references((): any => team.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// ============================================
// 1b. TEAM ROLE HISTORY (Track role changes)
// ============================================

export const teamRoleHistory = pgTable("team_role_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamMemberId: uuid("team_member_id")
    .references(() => team.id)
    .notNull(),
  role: userRoleEnum("role").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  changedById: uuid("changed_by_id").references(() => team.id),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
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
  createdById: uuid("created_by_id").references(() => team.id),
  updatedById: uuid("updated_by_id").references(() => team.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
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
  ownerId: uuid("owner_id").references(() => team.id),
  createdById: uuid("created_by_id").references(() => team.id),
  updatedById: uuid("updated_by_id").references(() => team.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const listings = pgTable("listings", {
  id: uuid("id").primaryKey().defaultRandom(),
  unitId: uuid("unit_id").references(() => units.id),
  listingAgentId: uuid("listing_agent_id").references(() => team.id),
  listingCode: integer("listing_code"),
  jumboId: text("jumbo_id"),
  hid: text("hid"),
  listingSlug: text("listing_slug"),
  configuration: configurationEnum("configuration"),
  flatNumber: text("flat_number"),
  tier: listingTierEnum("tier"),
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
  zoneLeadId: uuid("zone_lead_id").references(() => team.id),
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
  photoshootAssignedToId: uuid("photoshoot_assigned_to_id").references(() => team.id),
  offboardingDatetime: timestamp("offboarding_datetime", { withTimezone: true }),
  offboardingDelistedById: uuid("offboarding_delisted_by_id").references(() => team.id),
  spotlight: boolean("spotlight").default(false),
  priority: priorityEnum("priority"),
  builderUnit: boolean("builder_unit").default(false),
  description: text("description"),
  images: jsonb("images").$type<string[]>().default([]),
  videoUrl: text("video_url"),
  floorPlanUrl: text("floor_plan_url"),
  tour3dUrl: text("tour_3d_url"),
  brochureUrl: text("brochure_url"),
  mediaJson: jsonb("media_json").$type<Record<string, string[]>>(),
  amenitiesJson: jsonb("amenities_json").$type<string[]>().default([]),
  externalIds: jsonb("external_ids").$type<{
    housing_id?: string;
    magicbricks_id?: string;
    "99acres_id"?: string;
  }>(),
  isVerified: boolean("is_verified").default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdById: uuid("created_by_id").references(() => team.id),
  updatedById: uuid("updated_by_id").references(() => team.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// ============================================
// 3. CRM & LEAD MANAGEMENT (Buyer Leads)
//    Identity comes from contacts via contactId.
//    No phone/email/name/secondaryPhone on this table.
// ============================================

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  contactId: uuid("contact_id")
    .references(() => contacts.id)
    .notNull(),
  leadId: text("lead_id"),
  source: text("source"),
  externalId: text("external_id"),
  sourceListingId: text("source_listing_id"),
  dropReason: text("drop_reason"),
  locality: text("locality"),
  zone: text("zone"),
  pipeline: boolean("pipeline").default(false),
  referredBy: text("referred_by"),
  testListingId: text("test_listing_id"),
  status: text("status").default("new"),
  assignedAgentId: uuid("assigned_agent_id").references(() => team.id),
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
  createdById: uuid("created_by_id").references(() => team.id),
  updatedById: uuid("updated_by_id").references(() => team.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// ============================================
// 3b. CRM & LEAD MANAGEMENT (Seller Leads)
//     Identity comes from contacts via contactId.
//     No name/phone/email/secondaryPhone on this table.
// ============================================

export const sellerLeads = pgTable("seller_leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  contactId: uuid("contact_id")
    .references(() => contacts.id)
    .notNull(),
  status: sellerLeadStatusEnum("status").default("new"),
  source: sellerLeadSourceEnum("source").notNull(),
  sourceUrl: text("source_url"),
  sourceListingUrl: text("source_listing_url"),
  dropReason: dropReasonEnum("drop_reason"),
  referredById: uuid("referred_by_id").references(() => team.id),
  buildingId: uuid("building_id").references(() => buildings.id),
  unitId: uuid("unit_id").references(() => units.id),
  assignedToId: uuid("assigned_to_id").references(() => team.id),
  followUpDate: timestamp("follow_up_date", { withTimezone: true }),
  isNri: boolean("is_nri").default(false),
  createdById: uuid("created_by_id").references(() => team.id),
  updatedById: uuid("updated_by_id").references(() => team.id),
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
  agentId: uuid("agent_id").references(() => team.id),
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
  dispatchAgentId: uuid("dispatch_agent_id").references(() => team.id),
  fieldAgentId: uuid("field_agent_id").references(() => team.id),
  tourDate: date("tour_date"),
  optimizedRoute: jsonb("optimized_route").$type<{
    waypoints?: Array<{ lat: number; lng: number; listing_id: string }>;
  }>(),
  status: text("status").default("planned"),
  createdById: uuid("created_by_id").references(() => team.id),
  updatedById: uuid("updated_by_id").references(() => team.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
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
  assignedVaId: uuid("assigned_va_id").references(() => team.id),
  completedById: uuid("completed_by_id").references(() => team.id),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  status: text("status").default("pending"),
  feedbackText: text("feedback_text"),
  feedback: text("feedback"),
  feedbackRating: integer("feedback_rating"),
  bsaBool: boolean("bsa_bool").default(false),
  agentLatitude: real("agent_latitude"),
  agentLongitude: real("agent_longitude"),
  createdById: uuid("created_by_id").references(() => team.id),
  updatedById: uuid("updated_by_id").references(() => team.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// 6. TASK MANAGEMENT
// ============================================

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  creatorId: uuid("creator_id").references(() => team.id),
  assigneeId: uuid("assignee_id").references(() => team.id),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").default("medium"),
  dueAt: timestamp("due_at", { withTimezone: true }),
  relatedLeadId: uuid("related_lead_id").references(() => leads.id),
  sellerLeadId: uuid("seller_lead_id").references(() => sellerLeads.id),
  listingId: uuid("listing_id").references(() => listings.id),
  status: text("status").default("open"),
  updatedById: uuid("updated_by_id").references(() => team.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
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
  agentId: uuid("agent_id").references(() => team.id),
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
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  action: auditActionEnum("action").notNull(),
  changes: jsonb("changes").$type<Record<string, { old: unknown; new: unknown }>>(),
  performedById: uuid("performed_by_id").references(() => team.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// 9. NOTES (Multi-note system)
// ============================================

export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  content: text("content").notNull(),
  createdById: uuid("created_by_id").references(() => team.id),
  updatedById: uuid("updated_by_id").references(() => team.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// ============================================
// 10. MEDIA ITEMS (Detailed media management)
// ============================================

export const mediaItems = pgTable("media_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  mediaType: mediaTypeEnum("media_type").notNull(),
  tag: text("tag"),
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
  uploadedById: uuid("uploaded_by_id").references(() => team.id),
  updatedById: uuid("updated_by_id").references(() => team.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
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
  inspectedById: uuid("inspected_by_id").references(() => team.id),
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
  createdById: uuid("created_by_id").references(() => team.id),
  updatedById: uuid("updated_by_id").references(() => team.id),
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
  cataloguedById: uuid("catalogued_by_id").references(() => team.id),
  cataloguingScore: numeric("cataloguing_score"),
  cauveryChecklist: boolean("cauvery_checklist").default(false),
  thumbnailUrl: text("thumbnail_url"),
  floorPlanUrl: text("floor_plan_url"),
  buildingJsonUrl: text("building_json_url"),
  listingJsonUrl: text("listing_json_url"),
  video30SecUrl: text("video_30sec_url"),
  status: catalogueStatusEnum("status").default("pending"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdById: uuid("created_by_id").references(() => team.id),
  updatedById: uuid("updated_by_id").references(() => team.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// 13. BUYER EVENTS (Buyer interaction events)
// ============================================

export const buyerEvents = pgTable("buyer_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id").references(() => leads.id),
  profileId: uuid("profile_id").references(() => team.id),
  phone: text("phone"),
  leadSource: text("lead_source"),
  sourceListingId: text("source_listing_id"),
  eventType: text("event_type"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdById: uuid("created_by_id").references(() => team.id),
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
  createdById: uuid("created_by_id").references(() => team.id),
  updatedById: uuid("updated_by_id").references(() => team.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// ============================================
// 15. AUTOMATION ENGINE (Triggers & Actions)
// ============================================

export const automationTriggers = pgTable("automation_triggers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  eventType: text("event_type").notNull(), // e.g. lead_created, lead_status_changed, visit_completed
  conditionJson: jsonb("condition_json").$type<Record<string, unknown>>(), // e.g. { "status": "new" }
  isActive: boolean("is_active").default(true),
  createdById: uuid("created_by_id").references(() => team.id),
  updatedById: uuid("updated_by_id").references(() => team.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const automationActions = pgTable("automation_actions", {
  id: uuid("id").primaryKey().defaultRandom(),
  triggerId: uuid("trigger_id")
    .references(() => automationTriggers.id, { onDelete: "cascade" })
    .notNull(),
  actionType: text("action_type").notNull(), // assign_agent, create_task, webhook_call
  payloadTemplate: jsonb("payload_template").$type<Record<string, unknown>>(), // JSON with {{lead.name}} placeholders
  executionOrder: integer("execution_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const automationExecutionLogs = pgTable("automation_execution_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  triggerId: uuid("trigger_id").references(() => automationTriggers.id),
  actionId: uuid("action_id").references(() => automationActions.id),
  eventType: text("event_type").notNull(),
  eventPayload: jsonb("event_payload").$type<Record<string, unknown>>(),
  actionType: text("action_type").notNull(),
  status: text("status").default("pending"), // pending, success, failed
  resultJson: jsonb("result_json").$type<Record<string, unknown>>(),
  errorMessage: text("error_message"),
  executedAt: timestamp("executed_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// 16. NOTIFICATIONS (In-app bell icon)
// ============================================

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => team.id)
    .notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"), // e.g. /buyers/abc-123 or /visits/xyz
  isRead: boolean("is_read").default(false),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  readAt: timestamp("read_at", { withTimezone: true }),
});

// ============================================
// RELATIONS
// ============================================

export const contactsRelations = relations(contacts, ({ many }) => ({
  teamMembers: many(team),
  leads: many(leads),
  sellerLeads: many(sellerLeads),
}));

export const teamRelations = relations(team, ({ many, one }) => ({
  ownedUnits: many(units, { relationName: "unitOwner" }),
  createdListings: many(listings, { relationName: "listingAgent" }),
  assignedLeads: many(leads, { relationName: "assignedAgent" }),
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
  roleHistory: many(teamRoleHistory),
  notifications: many(notifications, { relationName: "userNotifications" }),
  createdTriggers: many(automationTriggers, { relationName: "triggerCreatedBy" }),
  contact: one(contacts, {
    fields: [team.contactId],
    references: [contacts.id],
  }),
  createdBy: one(team, {
    fields: [team.createdById],
    references: [team.id],
    relationName: "createdByTeamMember",
  }),
}));

export const teamRoleHistoryRelations = relations(teamRoleHistory, ({ one }) => ({
  teamMember: one(team, {
    fields: [teamRoleHistory.teamMemberId],
    references: [team.id],
  }),
  changedBy: one(team, {
    fields: [teamRoleHistory.changedById],
    references: [team.id],
    relationName: "roleChangedBy",
  }),
}));

export const buildingsRelations = relations(buildings, ({ many, one }) => ({
  units: many(units),
  sellerLeads: many(sellerLeads),
  createdBy: one(team, {
    fields: [buildings.createdById],
    references: [team.id],
  }),
}));

export const unitsRelations = relations(units, ({ one, many }) => ({
  building: one(buildings, {
    fields: [units.buildingId],
    references: [buildings.id],
  }),
  owner: one(team, {
    fields: [units.ownerId],
    references: [team.id],
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
  listingAgent: one(team, {
    fields: [listings.listingAgentId],
    references: [team.id],
    relationName: "listingAgent",
  }),
  zoneLead: one(team, {
    fields: [listings.zoneLeadId],
    references: [team.id],
    relationName: "zoneLead",
  }),
  photoshootAssignedTo: one(team, {
    fields: [listings.photoshootAssignedToId],
    references: [team.id],
    relationName: "photoshootAssignedTo",
  }),
  offboardingDelistedBy: one(team, {
    fields: [listings.offboardingDelistedById],
    references: [team.id],
    relationName: "offboardingDelistedBy",
  }),
  visits: many(visits),
  homeInspections: many(homeInspections),
  homeCatalogues: many(homeCatalogues),
  offers: many(offers),
  communications: many(communications),
  tasks: many(tasks),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  contact: one(contacts, {
    fields: [leads.contactId],
    references: [contacts.id],
  }),
  assignedAgent: one(team, {
    fields: [leads.assignedAgentId],
    references: [team.id],
    relationName: "assignedAgent",
  }),
  createdBy: one(team, {
    fields: [leads.createdById],
    references: [team.id],
    relationName: "leadCreatedBy",
  }),
  communications: many(communications),
  visits: many(visits),
  tasks: many(tasks),
  buyerEvents: many(buyerEvents),
  offers: many(offers),
}));

export const sellerLeadsRelations = relations(sellerLeads, ({ one, many }) => ({
  contact: one(contacts, {
    fields: [sellerLeads.contactId],
    references: [contacts.id],
  }),
  referredBy: one(team, {
    fields: [sellerLeads.referredById],
    references: [team.id],
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
  assignedTo: one(team, {
    fields: [sellerLeads.assignedToId],
    references: [team.id],
    relationName: "assignedAgent",
  }),
  createdBy: one(team, {
    fields: [sellerLeads.createdById],
    references: [team.id],
    relationName: "createdBy",
  }),
  communications: many(communications),
  tasks: many(tasks),
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
  agent: one(team, {
    fields: [communications.agentId],
    references: [team.id],
  }),
}));

export const visitToursRelations = relations(visitTours, ({ one, many }) => ({
  dispatchAgent: one(team, {
    fields: [visitTours.dispatchAgentId],
    references: [team.id],
    relationName: "dispatchAgent",
  }),
  fieldAgent: one(team, {
    fields: [visitTours.fieldAgentId],
    references: [team.id],
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
  assignedVa: one(team, {
    fields: [visits.assignedVaId],
    references: [team.id],
    relationName: "assignedVa",
  }),
  completedBy: one(team, {
    fields: [visits.completedById],
    references: [team.id],
    relationName: "completedBy",
  }),
  communications: many(communications),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  creator: one(team, {
    fields: [tasks.creatorId],
    references: [team.id],
    relationName: "taskCreator",
  }),
  assignee: one(team, {
    fields: [tasks.assigneeId],
    references: [team.id],
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
  listing: one(listings, {
    fields: [tasks.listingId],
    references: [listings.id],
  }),
}));

export const creditLedgerRelations = relations(creditLedger, ({ one }) => ({
  agent: one(team, {
    fields: [creditLedger.agentId],
    references: [team.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  performedBy: one(team, {
    fields: [auditLogs.performedById],
    references: [team.id],
  }),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  createdBy: one(team, {
    fields: [notes.createdById],
    references: [team.id],
  }),
}));

export const mediaItemsRelations = relations(mediaItems, ({ one }) => ({
  uploadedBy: one(team, {
    fields: [mediaItems.uploadedById],
    references: [team.id],
    relationName: "uploadedBy",
  }),
}));

export const homeInspectionsRelations = relations(homeInspections, ({ one, many }) => ({
  listing: one(listings, {
    fields: [homeInspections.listingId],
    references: [listings.id],
  }),
  inspectedBy: one(team, {
    fields: [homeInspections.inspectedById],
    references: [team.id],
  }),
  catalogues: many(homeCatalogues),
}));

export const homeCataloguesRelations = relations(homeCatalogues, ({ one }) => ({
  listing: one(listings, {
    fields: [homeCatalogues.listingId],
    references: [listings.id],
  }),
  inspection: one(homeInspections, {
    fields: [homeCatalogues.inspectionId],
    references: [homeInspections.id],
  }),
  cataloguedBy: one(team, {
    fields: [homeCatalogues.cataloguedById],
    references: [team.id],
  }),
}));

export const buyerEventsRelations = relations(buyerEvents, ({ one }) => ({
  lead: one(leads, {
    fields: [buyerEvents.leadId],
    references: [leads.id],
  }),
  profile: one(team, {
    fields: [buyerEvents.profileId],
    references: [team.id],
  }),
  createdBy: one(team, {
    fields: [buyerEvents.createdById],
    references: [team.id],
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
  createdBy: one(team, {
    fields: [offers.createdById],
    references: [team.id],
  }),
}));

export const automationTriggersRelations = relations(automationTriggers, ({ many, one }) => ({
  actions: many(automationActions),
  executionLogs: many(automationExecutionLogs),
  createdBy: one(team, {
    fields: [automationTriggers.createdById],
    references: [team.id],
    relationName: "triggerCreatedBy",
  }),
}));

export const automationActionsRelations = relations(automationActions, ({ one, many }) => ({
  trigger: one(automationTriggers, {
    fields: [automationActions.triggerId],
    references: [automationTriggers.id],
  }),
  executionLogs: many(automationExecutionLogs),
}));

export const automationExecutionLogsRelations = relations(automationExecutionLogs, ({ one }) => ({
  trigger: one(automationTriggers, {
    fields: [automationExecutionLogs.triggerId],
    references: [automationTriggers.id],
  }),
  action: one(automationActions, {
    fields: [automationExecutionLogs.actionId],
    references: [automationActions.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(team, {
    fields: [notifications.userId],
    references: [team.id],
    relationName: "userNotifications",
  }),
}));

// ============================================
// TYPE EXPORTS
// ============================================

export type TeamMember = typeof team.$inferSelect;
export type NewTeamMember = typeof team.$inferInsert;

// Backwards-compatible aliases (use TeamMember/NewTeamMember in new code)
export type Profile = TeamMember;
export type NewProfile = NewTeamMember;

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;

export type TeamRoleHistoryEntry = typeof teamRoleHistory.$inferSelect;
export type NewTeamRoleHistoryEntry = typeof teamRoleHistory.$inferInsert;

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

export type AutomationTrigger = typeof automationTriggers.$inferSelect;
export type NewAutomationTrigger = typeof automationTriggers.$inferInsert;

export type AutomationAction = typeof automationActions.$inferSelect;
export type NewAutomationAction = typeof automationActions.$inferInsert;

export type AutomationExecutionLog = typeof automationExecutionLogs.$inferSelect;
export type NewAutomationExecutionLog = typeof automationExecutionLogs.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

// Role type for RBAC
export type UserRole = (typeof userRoleEnum.enumValues)[number];

// Seller Lead Status and Source types
export type SellerLeadStatus = (typeof sellerLeadStatusEnum.enumValues)[number];
export type SellerLeadSource = (typeof sellerLeadSourceEnum.enumValues)[number];
export type AuditAction = (typeof auditActionEnum.enumValues)[number];

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
export type ListingTier = (typeof listingTierEnum.enumValues)[number];
