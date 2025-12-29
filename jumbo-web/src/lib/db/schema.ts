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

// ============================================
// 1. USER & AGENT MANAGEMENT
// ============================================

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: text("full_name").notNull(),
  phone: text("phone").unique().notNull(),
  email: text("email").unique(),
  role: userRoleEnum("role").default("buyer_agent"),
  territoryId: text("territory_id"),
  totalCoins: integer("total_coins").default(0),
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
  latitude: real("latitude"),
  longitude: real("longitude"),
  amenitiesJson: jsonb("amenities_json").$type<Record<string, boolean>>(),
  waterSource: text("water_source"),
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
  ownerId: uuid("owner_id").references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const listings = pgTable("listings", {
  id: uuid("id").primaryKey().defaultRandom(),
  unitId: uuid("unit_id").references(() => units.id),
  listingAgentId: uuid("listing_agent_id").references(() => profiles.id),
  status: text("status").default("draft"),
  askingPrice: numeric("asking_price"),
  description: text("description"),
  images: jsonb("images").$type<string[]>().default([]),
  amenitiesJson: jsonb("amenities_json").$type<string[]>().default([]),
  externalIds: jsonb("external_ids").$type<{
    housing_id?: string;
    magicbricks_id?: string;
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
  source: text("source"),
  externalId: text("external_id"), // ID from Housing.com, MagicBricks, etc.
  status: text("status").default("new"),
  assignedAgentId: uuid("assigned_agent_id").references(() => profiles.id),
  requirementJson: jsonb("requirement_json").$type<{
    bhk?: number[];
    budget_min?: number;
    budget_max?: number;
    localities?: string[];
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
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  status: sellerLeadStatusEnum("status").default("new"),
  source: sellerLeadSourceEnum("source").notNull(),
  sourceUrl: text("source_url"),
  referredById: uuid("referred_by_id").references(() => profiles.id),
  buildingId: uuid("building_id").references(() => buildings.id),
  unitId: uuid("unit_id").references(() => units.id),
  assignedToId: uuid("assigned_to_id").references(() => profiles.id),
  followUpDate: timestamp("follow_up_date", { withTimezone: true }),
  isNri: boolean("is_nri").default(false),
  notes: text("notes"),
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
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  otpCode: text("otp_code"),
  status: text("status").default("pending"),
  feedbackText: text("feedback_text"),
  feedbackRating: integer("feedback_rating"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
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
// RELATIONS
// ============================================

export const profilesRelations = relations(profiles, ({ many }) => ({
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
}));

export const buildingsRelations = relations(buildings, ({ many }) => ({
  units: many(units),
  sellerLeads: many(sellerLeads),
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
  visits: many(visits),
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

export const visitsRelations = relations(visits, ({ one }) => ({
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
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  performedBy: one(profiles, {
    fields: [auditLogs.performedById],
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

