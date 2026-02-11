-- Migration: S1.5-001 Automation Engine
-- Creates tables for: automation_triggers, automation_actions, automation_execution_logs, notifications

-- ============================================
-- AUTOMATION TRIGGERS
-- ============================================
CREATE TABLE IF NOT EXISTS "automation_triggers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "event_type" text NOT NULL,
  "condition_json" jsonb,
  "is_active" boolean DEFAULT true,
  "created_by_id" uuid REFERENCES "team"("id"),
  "updated_by_id" uuid REFERENCES "team"("id"),
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint

-- ============================================
-- AUTOMATION ACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS "automation_actions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "trigger_id" uuid NOT NULL REFERENCES "automation_triggers"("id") ON DELETE CASCADE,
  "action_type" text NOT NULL,
  "payload_template" jsonb,
  "execution_order" integer DEFAULT 0,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint

-- ============================================
-- AUTOMATION EXECUTION LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS "automation_execution_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "trigger_id" uuid REFERENCES "automation_triggers"("id"),
  "action_id" uuid REFERENCES "automation_actions"("id"),
  "event_type" text NOT NULL,
  "event_payload" jsonb,
  "action_type" text NOT NULL,
  "status" text DEFAULT 'pending',
  "result_json" jsonb,
  "error_message" text,
  "executed_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint

-- ============================================
-- NOTIFICATIONS (In-app bell icon)
-- ============================================
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "team"("id"),
  "title" text NOT NULL,
  "message" text NOT NULL,
  "link" text,
  "is_read" boolean DEFAULT false,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now(),
  "read_at" timestamp with time zone
);
--> statement-breakpoint

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS "idx_automation_triggers_event_type" ON "automation_triggers" ("event_type") WHERE "is_active" = true AND "deleted_at" IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_automation_actions_trigger_id" ON "automation_actions" ("trigger_id") WHERE "is_active" = true;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_automation_execution_logs_trigger_id" ON "automation_execution_logs" ("trigger_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_user_id" ON "notifications" ("user_id") WHERE "is_read" = false;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_user_id_created_at" ON "notifications" ("user_id", "created_at" DESC);
