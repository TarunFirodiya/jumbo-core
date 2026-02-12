-- 0005: Buyer Lead Lifecycle State Machine
-- Adds buyer_lead_stage enum, stage column, and last_active_at to leads table.

-- 1. Create the buyer_lead_stage enum
DO $$ BEGIN
  CREATE TYPE "public"."buyer_lead_stage" AS ENUM(
    'NEW_LEAD',
    'QUALIFIED',
    'REACTIVATED',
    'AT_RISK_LEAD',
    'INACTIVE_LEAD',
    'ACTIVE_VISITOR',
    'AT_RISK_VISITOR',
    'INACTIVE_VISITOR'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Add stage column (defaults to NEW_LEAD)
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "stage" "buyer_lead_stage" DEFAULT 'NEW_LEAD';

-- 3. Add last_active_at column for tracking reactivation triggers
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "last_active_at" timestamp with time zone;

-- 4. Backfill: set last_active_at = created_at for existing leads that don't have it
UPDATE "leads" SET "last_active_at" = "created_at" WHERE "last_active_at" IS NULL;

-- 5. Create index for cron job performance (stage + created_at for time-decay queries)
CREATE INDEX IF NOT EXISTS "idx_leads_stage" ON "leads" ("stage");
CREATE INDEX IF NOT EXISTS "idx_leads_stage_created" ON "leads" ("stage", "created_at");
CREATE INDEX IF NOT EXISTS "idx_leads_last_active" ON "leads" ("last_active_at");

-- 6. Backfill existing lead stages based on current data
-- Leads with visits → ACTIVE_VISITOR
-- Leads with preferences → QUALIFIED (if age ≤ 7 days)
-- Older leads without visits → AT_RISK_LEAD or INACTIVE_LEAD
WITH lead_visit_status AS (
  SELECT
    l.id,
    l.created_at,
    l.preference_json,
    MAX(v.scheduled_at) AS last_visit_date,
    COUNT(v.id) AS visit_count
  FROM leads l
  LEFT JOIN visits v ON v.lead_id = l.id
  WHERE l.deleted_at IS NULL
  GROUP BY l.id, l.created_at, l.preference_json
)
UPDATE leads
SET stage = CASE
  -- Has visits
  WHEN lvs.visit_count > 0 AND lvs.last_visit_date > (NOW() AT TIME ZONE 'Asia/Kolkata' - INTERVAL '30 days')
    THEN 'ACTIVE_VISITOR'
  WHEN lvs.visit_count > 0 AND lvs.last_visit_date > (NOW() AT TIME ZONE 'Asia/Kolkata' - INTERVAL '90 days')
    THEN 'AT_RISK_VISITOR'
  WHEN lvs.visit_count > 0
    THEN 'INACTIVE_VISITOR'
  -- No visits, has preferences, age ≤ 7 days
  WHEN lvs.visit_count = 0
    AND lvs.preference_json IS NOT NULL
    AND lvs.preference_json::text != '{}'
    AND lvs.preference_json::text != 'null'
    AND lvs.created_at > (NOW() AT TIME ZONE 'Asia/Kolkata' - INTERVAL '7 days')
    THEN 'QUALIFIED'
  -- No visits, age ≤ 7 days
  WHEN lvs.visit_count = 0
    AND lvs.created_at > (NOW() AT TIME ZONE 'Asia/Kolkata' - INTERVAL '7 days')
    THEN 'NEW_LEAD'
  -- No visits, 8-30 days old
  WHEN lvs.visit_count = 0
    AND lvs.created_at > (NOW() AT TIME ZONE 'Asia/Kolkata' - INTERVAL '30 days')
    THEN 'AT_RISK_LEAD'
  -- No visits, > 30 days old
  WHEN lvs.visit_count = 0
    THEN 'INACTIVE_LEAD'
  ELSE 'NEW_LEAD'
END
FROM lead_visit_status lvs
WHERE leads.id = lvs.id;
