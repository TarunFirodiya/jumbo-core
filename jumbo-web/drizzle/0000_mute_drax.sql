CREATE TYPE "public"."audit_action" AS ENUM('create', 'update', 'delete');--> statement-breakpoint
CREATE TYPE "public"."seller_lead_source" AS ENUM('website', '99acres', 'magicbricks', 'housing', 'nobroker', 'mygate', 'referral');--> statement-breakpoint
CREATE TYPE "public"."seller_lead_status" AS ENUM('new', 'proposal_sent', 'proposal_accepted', 'dropped');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'listing_agent', 'team_lead', 'buyer_agent', 'visit_agent', 'dispatch_agent', 'closing_agent', 'seller_agent');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" "audit_action" NOT NULL,
	"changes" jsonb,
	"performed_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "buildings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"locality" text,
	"city" text,
	"latitude" real,
	"longitude" real,
	"amenities_json" jsonb,
	"water_source" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "communications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid,
	"seller_lead_id" uuid,
	"agent_id" uuid,
	"channel" text,
	"direction" text,
	"content" text,
	"recording_url" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "credit_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid,
	"amount" integer NOT NULL,
	"action_type" text,
	"reference_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "credit_rules" (
	"action_type" text PRIMARY KEY NOT NULL,
	"coin_value" integer NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid,
	"source" text,
	"external_id" text,
	"status" text DEFAULT 'new',
	"assigned_agent_id" uuid,
	"requirement_json" jsonb,
	"last_contacted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unit_id" uuid,
	"listing_agent_id" uuid,
	"status" text DEFAULT 'draft',
	"asking_price" numeric,
	"description" text,
	"images" jsonb DEFAULT '[]'::jsonb,
	"amenities_json" jsonb DEFAULT '[]'::jsonb,
	"external_ids" jsonb,
	"is_verified" boolean DEFAULT false,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"role" "user_role" DEFAULT 'buyer_agent',
	"territory_id" text,
	"total_coins" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	CONSTRAINT "profiles_phone_unique" UNIQUE("phone"),
	CONSTRAINT "profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "seller_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"status" "seller_lead_status" DEFAULT 'new',
	"source" "seller_lead_source" NOT NULL,
	"source_url" text,
	"referred_by_id" uuid,
	"building_id" uuid,
	"unit_id" uuid,
	"assigned_to_id" uuid,
	"follow_up_date" timestamp with time zone,
	"is_nri" boolean DEFAULT false,
	"notes" text,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid,
	"assignee_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"priority" text DEFAULT 'medium',
	"due_at" timestamp with time zone,
	"related_lead_id" uuid,
	"seller_lead_id" uuid,
	"status" text DEFAULT 'open',
	"created_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"building_id" uuid,
	"unit_number" text,
	"bhk" real,
	"floor_number" integer,
	"carpet_area" real,
	"owner_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "visit_tours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dispatch_agent_id" uuid,
	"field_agent_id" uuid,
	"tour_date" date,
	"optimized_route" jsonb,
	"status" text DEFAULT 'planned',
	"created_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tour_id" uuid,
	"lead_id" uuid,
	"listing_id" uuid,
	"scheduled_at" timestamp with time zone,
	"otp_code" text,
	"status" text DEFAULT 'pending',
	"feedback_text" text,
	"feedback_rating" integer,
	"completed_at" timestamp with time zone,
	"agent_latitude" real,
	"agent_longitude" real,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_performed_by_id_profiles_id_fk" FOREIGN KEY ("performed_by_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communications" ADD CONSTRAINT "communications_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communications" ADD CONSTRAINT "communications_seller_lead_id_seller_leads_id_fk" FOREIGN KEY ("seller_lead_id") REFERENCES "public"."seller_leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communications" ADD CONSTRAINT "communications_agent_id_profiles_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_ledger" ADD CONSTRAINT "credit_ledger_agent_id_profiles_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_agent_id_profiles_id_fk" FOREIGN KEY ("assigned_agent_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_listing_agent_id_profiles_id_fk" FOREIGN KEY ("listing_agent_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_leads" ADD CONSTRAINT "seller_leads_referred_by_id_profiles_id_fk" FOREIGN KEY ("referred_by_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_leads" ADD CONSTRAINT "seller_leads_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_leads" ADD CONSTRAINT "seller_leads_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_leads" ADD CONSTRAINT "seller_leads_assigned_to_id_profiles_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_leads" ADD CONSTRAINT "seller_leads_created_by_id_profiles_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_creator_id_profiles_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_profiles_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_related_lead_id_leads_id_fk" FOREIGN KEY ("related_lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_seller_lead_id_seller_leads_id_fk" FOREIGN KEY ("seller_lead_id") REFERENCES "public"."seller_leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_tours" ADD CONSTRAINT "visit_tours_dispatch_agent_id_profiles_id_fk" FOREIGN KEY ("dispatch_agent_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_tours" ADD CONSTRAINT "visit_tours_field_agent_id_profiles_id_fk" FOREIGN KEY ("field_agent_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_tour_id_visit_tours_id_fk" FOREIGN KEY ("tour_id") REFERENCES "public"."visit_tours"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;