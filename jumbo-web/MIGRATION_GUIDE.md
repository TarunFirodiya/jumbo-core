# Database Migration Guide

## Problem
The TypeScript schema has been updated with new columns, but the database tables haven't been migrated yet. This causes queries to fail because Drizzle tries to select columns that don't exist.

## Solution: Generate and Apply Migration

### Step 1: Generate Migration File

Run this command in your terminal (not in the AI agent):

```bash
cd /Users/tarun/code_projects/jumbo-crm/jumbo-web
npm run db:generate
```

When prompted about `profile_id` in `seller_leads`, select:
- **"+ profile_id create column"** (it's a new column)

The migration file will be created in `drizzle/0001_*.sql`

### Step 2: Review the Migration File

Check the generated SQL file to ensure it looks correct:
```bash
cat drizzle/0001_*.sql
```

### Step 3: Apply Migration

You have two options:

#### Option A: Using Drizzle Kit Push (Development)
```bash
npm run db:push
```

#### Option B: Manual SQL Execution (Production)
1. Copy the SQL from the migration file
2. Run it in Supabase SQL Editor or your database client

### Step 4: Verify

After migration, verify in Drizzle Studio:
```bash
npm run db:studio
```

Or check in Supabase dashboard that the new columns exist.

## Temporary Workaround (If Migration Can't Be Done Now)

If you need to run the app immediately, you can temporarily comment out the new fields in `schema.ts` until the migration is applied. However, this is NOT recommended as you'll lose type safety.

## Key New Columns Added

### Listings Table
- `jumbo_id`, `hid`, `listing_slug`
- `configuration`, `flat_number`
- `ask_price_lacs`, `price_per_sqft`, `msp`
- Many other fields (see schema.ts lines 276-350)

### Other Tables
- `seller_leads`: `profile_id`, `secondary_phone`, `drop_reason`, `source_listing_url`
- `leads`: Many new preference and contact fields
- `visits`: Workflow fields (OTP, location, status)
- New tables: `notes`, `media_items`, `home_inspections`, `home_catalogues`, `offers`, `buyer_events`

## Important Notes

1. **Backup First**: Always backup your database before running migrations
2. **Test Environment**: Test migrations in a development environment first
3. **Data Migration**: After schema migration, you may need to migrate existing data
4. **Default Values**: Some new columns have defaults, but existing rows may need values


