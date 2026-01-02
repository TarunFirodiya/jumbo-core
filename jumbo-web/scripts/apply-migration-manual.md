# Manual Migration Application Guide

## The Problem
`npm run db:push` may have failed silently. The migration file exists but wasn't applied to the database.

## Solution: Apply Migration Manually

### Option 1: Using Supabase SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to SQL Editor

2. **Copy the Migration SQL**
   - Open: `drizzle/0001_loose_lily_hollister.sql`
   - Copy the entire contents

3. **Run in SQL Editor**
   - Paste the SQL into Supabase SQL Editor
   - Click "Run" or press Cmd/Ctrl + Enter
   - Wait for completion (may take 1-2 minutes)

4. **Verify**
   - Check that new tables appear: `notes`, `media_items`, `home_inspections`, `home_catalogues`, `buyer_events`, `offers`
   - Check that new columns exist in `listings`, `leads`, `visits`, etc.

### Option 2: Using psql Command Line

```bash
cd /Users/tarun/code_projects/jumbo-crm/jumbo-web

# Make sure DATABASE_URL is set
export $(cat .env.local | xargs)

# Apply migration
psql $DATABASE_URL -f drizzle/0001_loose_lily_hollister.sql
```

### Option 3: Using Drizzle Migrate (If Available)

```bash
npm run db:migrate
```

## Verification Queries

After applying, run these in Supabase SQL Editor to verify:

```sql
-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('notes', 'media_items', 'home_inspections', 'home_catalogues', 'buyer_events', 'offers');

-- Check new columns in listings
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'listings' 
AND column_name IN ('jumbo_id', 'configuration', 'ask_price_lacs', 'photoshoot_scheduled');

-- Check new enums exist
SELECT typname 
FROM pg_type 
WHERE typname IN ('configuration', 'drop_reason', 'media_type', 'inspection_status');
```

## If Migration Fails

If you get errors, common issues:

1. **Enum already exists**: Some enums might already be in the database
   - Solution: Comment out those CREATE TYPE statements and re-run

2. **Column already exists**: Some columns might have been partially added
   - Solution: Check which columns exist, comment out those ALTER TABLE statements

3. **Foreign key constraint fails**: Referenced table/column doesn't exist
   - Solution: Run CREATE TABLE statements first, then ALTER TABLE, then foreign keys

4. **Permission errors**: Database user doesn't have CREATE/ALTER permissions
   - Solution: Check database user permissions

## Rollback (If Needed)

If something goes wrong, you can rollback by:

1. Dropping new tables (if created)
2. Dropping new columns (if added)
3. Dropping new enums (if created)

But **backup first** before attempting rollback!


