CREATE TYPE "public"."catalogue_status" AS ENUM('pending', 'approved', 'rejected', 'needs_revision');--> statement-breakpoint
CREATE TYPE "public"."configuration" AS ENUM('1BHK', '2BHK', '3BHK', '4BHK', '5BHK', 'Studio', 'Villa', 'Penthouse');--> statement-breakpoint
CREATE TYPE "public"."drop_reason" AS ENUM('not_interested', 'price_too_high', 'found_elsewhere', 'invalid_lead', 'duplicate', 'other');--> statement-breakpoint
CREATE TYPE "public"."facing" AS ENUM('north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest');--> statement-breakpoint
CREATE TYPE "public"."furnishing" AS ENUM('furnished', 'semi_furnished', 'unfurnished');--> statement-breakpoint
CREATE TYPE "public"."inspection_status" AS ENUM('pending', 'in_progress', 'completed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."inventory_type" AS ENUM('primary', 'secondary', 'resale');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('image', 'video', 'floor_plan', 'document');--> statement-breakpoint
CREATE TYPE "public"."occupancy" AS ENUM('ready_to_move', 'under_construction', 'new_launch');--> statement-breakpoint
CREATE TYPE "public"."offer_status" AS ENUM('pending', 'accepted', 'rejected', 'countered');--> statement-breakpoint
CREATE TYPE "public"."primary_pain_point" AS ENUM('price', 'location', 'size', 'condition', 'amenities', 'other');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('apartment', 'villa', 'penthouse', 'plot', 'commercial');--> statement-breakpoint
CREATE TYPE "public"."sold_by" AS ENUM('jumbo', 'owner', 'other_agent');--> statement-breakpoint
CREATE TYPE "public"."urgency" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."usp" AS ENUM('corner_unit', 'high_floor', 'parking', 'balcony', 'modern_kitchen', 'spacious', 'natural_light', 'other');--> statement-breakpoint
CREATE TYPE "public"."view" AS ENUM('park', 'road', 'pool', 'garden', 'city', 'lake', 'other');--> statement-breakpoint
CREATE TYPE "public"."visited_with" AS ENUM('alone', 'family', 'friends', 'agent');--> statement-breakpoint
CREATE TABLE "buyer_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid,
	"profile_id" uuid,
	"phone" text,
	"lead_source" text,
	"source_listing_id" text,
	"event_type" text,
	"metadata" jsonb,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "home_catalogues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid,
	"inspection_id" uuid,
	"name" text,
	"inspected_on" timestamp with time zone,
	"catalogued_by_id" uuid,
	"cataloguing_score" numeric,
	"cauvery_checklist" boolean DEFAULT false,
	"thumbnail_url" text,
	"floor_plan_url" text,
	"building_json_url" text,
	"listing_json_url" text,
	"video_30sec_url" text,
	"status" "catalogue_status" DEFAULT 'pending',
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "home_inspections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid,
	"name" text,
	"location" text,
	"inspected_on" timestamp with time zone,
	"inspected_by_id" uuid,
	"inspection_latitude" real,
	"inspection_longitude" real,
	"inspection_score" numeric,
	"attempts" integer DEFAULT 0,
	"notes" text,
	"cauvery_checklist" boolean DEFAULT false,
	"known_issues" jsonb,
	"images_json_url" text,
	"building_json_url" text,
	"video_link" text,
	"thumbnail_url" text,
	"status" "inspection_status" DEFAULT 'pending',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "media_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"media_type" "media_type" NOT NULL,
	"tag" text,
	"cloudinary_url" text NOT NULL,
	"cloudinary_public_id" text,
	"order" integer DEFAULT 0,
	"metadata" jsonb,
	"uploaded_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid,
	"lead_id" uuid,
	"offer_amount" numeric NOT NULL,
	"status" "offer_status" DEFAULT 'pending',
	"terms" jsonb,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "buildings" ADD COLUMN "nearest_landmark" text;--> statement-breakpoint
ALTER TABLE "buildings" ADD COLUMN "possession_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "buildings" ADD COLUMN "total_floors" integer;--> statement-breakpoint
ALTER TABLE "buildings" ADD COLUMN "total_units" integer;--> statement-breakpoint
ALTER TABLE "buildings" ADD COLUMN "acres" numeric;--> statement-breakpoint
ALTER TABLE "buildings" ADD COLUMN "map_link" text;--> statement-breakpoint
ALTER TABLE "buildings" ADD COLUMN "khata" text;--> statement-breakpoint
ALTER TABLE "buildings" ADD COLUMN "rera_number" text;--> statement-breakpoint
ALTER TABLE "buildings" ADD COLUMN "jumbo_price_estimate" numeric;--> statement-breakpoint
ALTER TABLE "buildings" ADD COLUMN "under_construction" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "buildings" ADD COLUMN "is_model_flat_available" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "buildings" ADD COLUMN "google_rating" numeric;--> statement-breakpoint
ALTER TABLE "buildings" ADD COLUMN "gtm_housing_name" text;--> statement-breakpoint
ALTER TABLE "buildings" ADD COLUMN "gtm_housing_id" text;--> statement-breakpoint
ALTER TABLE "buildings" ADD COLUMN "media_json" jsonb;--> statement-breakpoint
ALTER TABLE "buildings" ADD COLUMN "created_by_id" uuid;--> statement-breakpoint
ALTER TABLE "communications" ADD COLUMN "listing_id" uuid;--> statement-breakpoint
ALTER TABLE "communications" ADD COLUMN "visit_id" uuid;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "lead_id" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "secondary_phone" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "source_listing_id" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "drop_reason" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "locality" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "zone" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "pipeline" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "referred_by" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "test_listing_id" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "preference_json" jsonb;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "jumbo_id" text;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "hid" text;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "listing_slug" text;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "configuration" "configuration";--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "flat_number" text;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "ask_price_lacs" numeric;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "price_per_sqft" numeric;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "msp" numeric;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "maintenance" numeric;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "seller_fees_percent" numeric;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "usp_1" "usp";--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "usp_2" "usp";--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "usp_3" "usp";--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "property_type" "property_type";--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "occupancy" "occupancy";--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "furnishing" "furnishing";--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "zone_lead_id" uuid;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "on_hold" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "sold" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "sold_by" "sold_by";--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "inventory_type" "inventory_type";--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "selling_price" numeric;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "booking_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "mou_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "source_price" numeric;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "urgency" "urgency";--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "gtm_jumbo_listing_url" text;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "gtm_website_live_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "gtm_housing_url" text;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "gtm_99acres_url" text;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "gtm_housing_listing_id" text;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "gtm_99acres_listing_id" text;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "gtm_ready" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "gtm_housing_live_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "photoshoot_scheduled" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "photoshoot_completed" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "photoshoot_availability_1" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "photoshoot_availability_2" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "photoshoot_availability_3" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "photoshoot_rtmi" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "photoshoot_assigned_to_id" uuid;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "offboarding_datetime" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "offboarding_delisted_by_id" uuid;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "spotlight" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "priority" "priority";--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "builder_unit" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "media_json" jsonb;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "secondary_phone" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "created_by_id" uuid;--> statement-breakpoint
ALTER TABLE "seller_leads" ADD COLUMN "profile_id" uuid;--> statement-breakpoint
ALTER TABLE "seller_leads" ADD COLUMN "secondary_phone" text;--> statement-breakpoint
ALTER TABLE "seller_leads" ADD COLUMN "source_listing_url" text;--> statement-breakpoint
ALTER TABLE "seller_leads" ADD COLUMN "drop_reason" "drop_reason";--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN "tower" text;--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN "view" "view";--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN "super_builtup_area" numeric;--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN "facing" "facing";--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN "uds" numeric;--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN "parking_count" integer;--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN "bedroom_count" integer;--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN "bathroom_count" integer;--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN "balcony_count" integer;--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN "lpg_connection" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN "keys_phone" text;--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN "keys_with" text;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "visitor_name" text;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "homes_visited" text;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "visit_status" text;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "visit_completed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "visit_canceled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "visit_confirmed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "canceled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "drop_reason" "drop_reason";--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "visited_with" "visited_with";--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "secondary_phone" text;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "otp_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "otp_start_entry" integer;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "otp_start_entry_time" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "completion_latitude" real;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "completion_longitude" real;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "visit_location" text;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "primary_pain_point" "primary_pain_point";--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "buyer_score" numeric;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "reschedule_time" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "reschedule_requested" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "rescheduled_from_visit_id" uuid;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "assigned_va_id" uuid;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "completed_by_id" uuid;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "feedback" text;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "bsa_bool" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "buyer_events" ADD CONSTRAINT "buyer_events_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_events" ADD CONSTRAINT "buyer_events_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_events" ADD CONSTRAINT "buyer_events_created_by_id_profiles_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "home_catalogues" ADD CONSTRAINT "home_catalogues_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "home_catalogues" ADD CONSTRAINT "home_catalogues_inspection_id_home_inspections_id_fk" FOREIGN KEY ("inspection_id") REFERENCES "public"."home_inspections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "home_catalogues" ADD CONSTRAINT "home_catalogues_catalogued_by_id_profiles_id_fk" FOREIGN KEY ("catalogued_by_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "home_inspections" ADD CONSTRAINT "home_inspections_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "home_inspections" ADD CONSTRAINT "home_inspections_inspected_by_id_profiles_id_fk" FOREIGN KEY ("inspected_by_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_items" ADD CONSTRAINT "media_items_uploaded_by_id_profiles_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_created_by_id_profiles_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_created_by_id_profiles_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_created_by_id_profiles_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communications" ADD CONSTRAINT "communications_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communications" ADD CONSTRAINT "communications_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_zone_lead_id_profiles_id_fk" FOREIGN KEY ("zone_lead_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_photoshoot_assigned_to_id_profiles_id_fk" FOREIGN KEY ("photoshoot_assigned_to_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_offboarding_delisted_by_id_profiles_id_fk" FOREIGN KEY ("offboarding_delisted_by_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_created_by_id_profiles_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_leads" ADD CONSTRAINT "seller_leads_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_rescheduled_from_visit_id_visits_id_fk" FOREIGN KEY ("rescheduled_from_visit_id") REFERENCES "public"."visits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_assigned_va_id_profiles_id_fk" FOREIGN KEY ("assigned_va_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_completed_by_id_profiles_id_fk" FOREIGN KEY ("completed_by_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_leads" DROP COLUMN "notes";