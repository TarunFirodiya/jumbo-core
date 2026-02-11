-- Create listing_tier enum
CREATE TYPE "public"."listing_tier" AS ENUM('reserve', 'cash_plus', 'lite');

-- Create sequence for listing codes
CREATE SEQUENCE IF NOT EXISTS listing_code_seq START 100;

-- Add new columns to listings
ALTER TABLE "listings" ADD COLUMN "listing_code" integer DEFAULT nextval('listing_code_seq');
ALTER TABLE "listings" ADD COLUMN "tier" "listing_tier";
ALTER TABLE "listings" ADD COLUMN "video_url" text;
ALTER TABLE "listings" ADD COLUMN "floor_plan_url" text;
ALTER TABLE "listings" ADD COLUMN "tour_3d_url" text;
ALTER TABLE "listings" ADD COLUMN "brochure_url" text;

-- Add listing_id FK to tasks
ALTER TABLE "tasks" ADD COLUMN "listing_id" uuid;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;

-- Migrate existing status values
UPDATE "listings" SET "status" = 'live' WHERE "status" = 'active';
UPDATE "listings" SET "status" = 'catalogue_pending' WHERE "status" = 'cataloguing_pending';
