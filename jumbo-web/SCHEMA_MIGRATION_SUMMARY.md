# Complete Database Schema Migration Summary

## Overview
The TypeScript schema has been updated with **extensive changes** across the entire database. This document lists ALL changes that need to be migrated.

## ⚠️ CRITICAL: Migration Required
The database currently has the **old schema** (from `0000_mute_drax.sql`), but the TypeScript schema has been updated with:
- **15+ new ENUMs**
- **100+ new columns** across existing tables
- **6 new tables**
- **Many new relationships**

## 1. NEW ENUMS (15 total)

These need to be created in the database:

1. `drop_reason` - ('not_interested', 'price_too_high', 'found_elsewhere', 'invalid_lead', 'duplicate', 'other')
2. `configuration` - ('1BHK', '2BHK', '3BHK', '4BHK', '5BHK', 'Studio', 'Villa', 'Penthouse')
3. `view` - ('park', 'road', 'pool', 'garden', 'city', 'lake', 'other')
4. `facing` - ('north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest')
5. `usp` - ('corner_unit', 'high_floor', 'parking', 'balcony', 'vastu_compliant', 'premium_location', 'ready_to_move', 'under_construction')
6. `property_type` - ('apartment', 'villa', 'plot', 'commercial')
7. `occupancy` - ('ready_to_move', 'under_construction', 'new_launch')
8. `furnishing` - ('furnished', 'semi_furnished', 'unfurnished')
9. `sold_by` - ('jumbo', 'owner', 'other')
10. `inventory_type` - ('resale', 'primary', 'both')
11. `urgency` - ('low', 'medium', 'high', 'critical')
12. `priority` - ('low', 'medium', 'high')
13. `visited_with` - ('alone', 'family', 'friends', 'agent')
14. `primary_pain_point` - ('price', 'location', 'size', 'amenities', 'timing', 'other')
15. `media_type` - ('image', 'video', 'floor_plan', 'document')
16. `inspection_status` - ('pending', 'in_progress', 'completed', 'rejected')
17. `catalogue_status` - ('pending', 'approved', 'rejected', 'needs_revision')
18. `offer_status` - ('pending', 'accepted', 'rejected', 'countered')

## 2. EXISTING TABLES - New Columns

### `profiles` table
- `secondary_phone` (text)
- `created_by_id` (uuid, FK to profiles)
- `deleted_at` (already exists)

### `buildings` table
- `nearest_landmark` (text)
- `possession_date` (timestamp)
- `total_floors` (integer)
- `total_units` (integer)
- `acres` (numeric)
- `map_link` (text)
- `khata` (text)
- `rera_number` (text)
- `jumbo_price_estimate` (numeric)
- `under_construction` (boolean)
- `is_model_flat_available` (boolean)
- `google_rating` (numeric)
- `gtm_housing_name` (text)
- `gtm_housing_id` (text)
- `media_json` (jsonb)
- `created_by_id` (uuid, FK to profiles)
- `updated_at` (timestamp)

### `units` table
- `tower` (text)
- `view` (enum: view)
- `super_builtup_area` (real)
- `facing` (enum: facing)
- `uds` (numeric)
- `parking_count` (integer)
- `bedroom_count` (integer)
- `bathroom_count` (integer)
- `balcony_count` (integer)
- `lpg_connection` (boolean)
- `keys_phone` (text)
- `keys_with` (text)
- `created_at` (timestamp) - already exists
- `updated_at` (timestamp)
- `deleted_at` (timestamp) - already exists

### `listings` table (MASSIVE CHANGES - 50+ new columns)
- `jumbo_id` (text)
- `hid` (text)
- `listing_slug` (text)
- `configuration` (enum: configuration)
- `flat_number` (text)
- `ask_price_lacs` (numeric)
- `price_per_sqft` (numeric)
- `msp` (numeric)
- `maintenance` (numeric)
- `seller_fees_percent` (numeric)
- `usp_1` (enum: usp)
- `usp_2` (enum: usp)
- `usp_3` (enum: usp)
- `property_type` (enum: property_type)
- `occupancy` (enum: occupancy)
- `furnishing` (enum: furnishing)
- `zone_lead_id` (uuid, FK to profiles)
- `on_hold` (boolean)
- `sold` (boolean)
- `sold_by` (enum: sold_by)
- `inventory_type` (enum: inventory_type)
- `selling_price` (numeric)
- `booking_date` (timestamp)
- `mou_date` (timestamp)
- `source_price` (numeric)
- `urgency` (enum: urgency)
- `gtm_jumbo_listing_url` (text)
- `gtm_website_live_date` (timestamp)
- `gtm_housing_url` (text)
- `gtm_99acres_url` (text)
- `gtm_housing_listing_id` (text)
- `gtm_99acres_listing_id` (text)
- `gtm_ready` (boolean)
- `gtm_housing_live_date` (timestamp)
- `photoshoot_scheduled` (timestamp)
- `photoshoot_completed` (timestamp)
- `photoshoot_availability_1` (timestamp)
- `photoshoot_availability_2` (timestamp)
- `photoshoot_availability_3` (timestamp)
- `photoshoot_rtmi` (boolean)
- `photoshoot_assigned_to_id` (uuid, FK to profiles)
- `offboarding_datetime` (timestamp)
- `offboarding_delisted_by_id` (uuid, FK to profiles)
- `spotlight` (boolean)
- `priority` (enum: priority)
- `builder_unit` (boolean)
- `media_json` (jsonb)
- `updated_at` (timestamp) - already exists

### `leads` table (MASSIVE CHANGES - 30+ new columns)
- `lead_id` (text) - external lead ID
- `secondary_phone` (text)
- `source_listing_id` (uuid, FK to listings)
- `drop_reason` (enum: drop_reason)
- `locality` (text)
- `zone` (text)
- `pipeline` (boolean)
- `referred_by` (text)
- `test_listing_id` (uuid, FK to listings)
- `preference_json` (jsonb) - expanded preferences
- `contact_lead_id` (text)
- `contact_source_listing` (text)
- `contact_lead_status` (text)
- `contact_drop_reason` (text)
- `location_locality` (text)
- `preference_configuration` (text)
- `admin` (boolean)
- `preference_max_cap` (text)
- `preference_landmark` (text)
- `preference_property_type` (text)
- `preference_floor_preference` (text)
- `preference_khata` (text)
- `preference_main_door_facing` (text)
- `preference_must_haves` (text)
- `preference_buy_reason` (text)
- `contact_zone` (text)
- `internal_pipeline` (text)
- `contact_secondary_number` (text)
- `contact_referred_by` (text)
- `updated_at` (timestamp)

### `seller_leads` table
- `profile_id` (uuid, FK to profiles) - **NEW**
- `secondary_phone` (text)
- `drop_reason` (enum: drop_reason)
- `source_listing_url` (text)
- `updated_at` (timestamp) - already exists
- **REMOVE**: `notes` (text) - moved to notes table

### `visits` table (MASSIVE CHANGES - 30+ new columns)
- `visitor_name` (text)
- `homes_visited` (text)
- `visit_status` (text)
- `visit_completed` (boolean)
- `visit_canceled` (boolean)
- `visit_confirmed` (boolean)
- `confirmed_at` (timestamp)
- `canceled_at` (timestamp)
- `drop_reason` (enum: drop_reason)
- `visited_with` (enum: visited_with)
- `secondary_phone` (text)
- `otp_verified` (boolean)
- `otp_start_entry` (integer)
- `otp_start_entry_time` (timestamp)
- `completion_latitude` (real)
- `completion_longitude` (real)
- `visit_location` (text)
- `primary_pain_point` (enum: primary_pain_point)
- `buyer_score` (numeric)
- `reschedule_time` (timestamp)
- `reschedule_requested` (boolean)
- `rescheduled_from_visit_id` (uuid, FK to visits - self-reference)
- `assigned_va_id` (uuid, FK to profiles)
- `completed_by_id` (uuid, FK to profiles)
- `feedback` (text)
- `bsa_bool` (boolean)
- `status` (text) - already exists, but may need enum update

## 3. NEW TABLES (6 total)

### `notes` table
- `id` (uuid, PK)
- `entity_type` (text) - 'seller_lead', 'lead', 'listing', 'visit', etc.
- `entity_id` (uuid)
- `content` (text)
- `created_by_id` (uuid, FK to profiles)
- `created_at` (timestamp)
- `deleted_at` (timestamp)

### `media_items` table
- `id` (uuid, PK)
- `entity_type` (text) - 'listing', 'building', 'home_inspection', 'home_catalogue'
- `entity_id` (uuid)
- `media_type` (enum: media_type)
- `tag` (text) - 'living_room', 'kitchen', etc.
- `cloudinary_url` (text)
- `cloudinary_public_id` (text)
- `order` (integer)
- `metadata` (jsonb)
- `uploaded_by_id` (uuid, FK to profiles)
- `created_at` (timestamp)
- `deleted_at` (timestamp)

### `home_inspections` table
- `id` (uuid, PK)
- `listing_id` (uuid, FK to listings)
- `name` (text)
- `location` (text)
- `inspected_on` (timestamp)
- `inspected_by_id` (uuid, FK to profiles)
- `inspection_latitude` (real)
- `inspection_longitude` (real)
- `inspection_score` (integer)
- `attempts` (integer)
- `notes` (text)
- `cauvery_checklist` (boolean)
- `known_issues` (text[])
- `images_json_url` (text)
- `building_json_url` (text)
- `video_link` (text)
- `thumbnail_url` (text)
- `status` (enum: inspection_status)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `deleted_at` (timestamp)

### `home_catalogues` table
- `id` (uuid, PK)
- `listing_id` (uuid, FK to listings)
- `inspection_id` (uuid, FK to home_inspections)
- `name` (text)
- `inspected_on` (timestamp)
- `catalogued_by_id` (uuid, FK to profiles)
- `cataloguing_score` (integer)
- `cauvery_checklist` (boolean)
- `thumbnail_url` (text)
- `floor_plan_url` (text)
- `building_json_url` (text)
- `listing_json_url` (text)
- `video_30_sec_url` (text)
- `status` (enum: catalogue_status)
- `approved_at` (timestamp)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `deleted_at` (timestamp)

### `buyer_events` table
- `id` (uuid, PK)
- `lead_id` (uuid, FK to leads)
- `profile_id` (uuid, FK to profiles)
- `phone` (text)
- `lead_source` (text)
- `source_listing_id` (uuid, FK to listings)
- `event_type` (text)
- `metadata` (jsonb)
- `created_by_id` (uuid, FK to profiles)
- `created_at` (timestamp)

### `offers` table
- `id` (uuid, PK)
- `listing_id` (uuid, FK to listings)
- `lead_id` (uuid, FK to leads)
- `offer_amount` (numeric)
- `status` (enum: offer_status)
- `terms` (jsonb)
- `created_by_id` (uuid, FK to profiles)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `deleted_at` (timestamp)

## 4. COLUMNS TO REMOVE

### `seller_leads` table
- **REMOVE**: `notes` (text) - moved to `notes` table

## 5. HOW TO MIGRATE

### Option 1: Use Drizzle Kit (Recommended)

```bash
cd /Users/tarun/code_projects/jumbo-crm/jumbo-web

# Generate migration
npm run db:generate

# When prompted, answer:
# - profile_id in seller_leads: "+ profile_id create column"
# - notes in seller_leads: "~ notes remove column" (or keep it for now and migrate data first)

# Apply migration
npm run db:push
```

### Option 2: Manual SQL Migration

1. Generate the migration file: `npm run db:generate`
2. Review the SQL in `drizzle/0001_*.sql`
3. Execute it in Supabase SQL Editor or your database client

### Option 3: Incremental Migration

If the migration is too large, you can break it down:
1. Create new enums first
2. Add new columns to existing tables
3. Create new tables
4. Migrate data (e.g., notes from seller_leads.notes to notes table)
5. Remove old columns

## 6. DATA MIGRATION NEEDED

After schema migration, you may need to:

1. **Migrate notes**: Move `seller_leads.notes` → `notes` table
2. **Migrate media**: Move `listings.images` → `media_items` table (if needed)
3. **Create units**: If listings don't have units, create them from building data
4. **Link profiles**: Link seller_leads and leads to profiles based on phone/email

## 7. VERIFICATION

After migration, verify:
- All new enums exist
- All new columns exist in tables
- All new tables exist
- Foreign keys are created
- Indexes are created (if any)

```bash
# Check in Drizzle Studio
npm run db:studio

# Or query in Supabase
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'listings';
```

## ⚠️ IMPORTANT NOTES

1. **Backup your database first!**
2. **Test in development environment first**
3. **Some columns have defaults, but existing rows may need values**
4. **The migration will be large - may take several minutes**
5. **Consider running during low-traffic period**


