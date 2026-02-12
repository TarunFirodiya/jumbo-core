/**
 * Lead Lifecycle Service
 * Manages buyer lead stage transitions using a time-decay state machine.
 *
 * Track A (Pre-Visit):  NEW_LEAD → QUALIFIED → AT_RISK_LEAD → INACTIVE_LEAD
 * Track B (Post-Visit): ACTIVE_VISITOR → AT_RISK_VISITOR → INACTIVE_VISITOR
 * Track C (Reactivation): AT_RISK_* / INACTIVE_* → REACTIVATED
 *
 * CRITICAL: All time calculations use IST (Asia/Kolkata).
 */

import { db } from "@/lib/db";
import { leads, visits } from "@/lib/db/schema";
import { eq, and, sql, isNull, inArray } from "drizzle-orm";

// ============================================
// TYPES
// ============================================

export type BuyerLeadStage =
  | "NEW_LEAD"
  | "QUALIFIED"
  | "REACTIVATED"
  | "AT_RISK_LEAD"
  | "INACTIVE_LEAD"
  | "ACTIVE_VISITOR"
  | "AT_RISK_VISITOR"
  | "INACTIVE_VISITOR";

export type ActivityType = "INQUIRY" | "LOGIN";

export interface StageInput {
  createdAt: Date;
  preferenceJson: Record<string, unknown> | null;
  lastVisitDate: Date | null;
  visitCount: number;
}

export interface CronResult {
  preVisitDecayed: number;
  postVisitDecayed: number;
  total: number;
}

// ============================================
// IST TIME HELPERS
// ============================================

/** Get current time in IST as a JS Date (offset-adjusted for comparison) */
function nowIST(): Date {
  // Create a formatter to get IST components
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date());
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "0";

  return new Date(
    `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}+05:30`
  );
}

/** Calculate age in days from a date to IST now */
function ageDaysIST(date: Date): number {
  const now = nowIST();
  const diffMs = now.getTime() - new Date(date).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/** Check if preferences JSON is non-empty */
function hasPreferences(pref: Record<string, unknown> | null): boolean {
  if (!pref) return false;
  const str = JSON.stringify(pref);
  return str !== "{}" && str !== "null" && str !== '""';
}

// ============================================
// PURE STAGE CALCULATION
// ============================================

/**
 * Calculate the correct stage for a buyer lead.
 * Pure function — no DB calls, easy to unit test.
 */
export function calculateStage(input: StageInput): BuyerLeadStage {
  const { createdAt, preferenceJson, lastVisitDate, visitCount } = input;
  const ageDays = ageDaysIST(createdAt);

  // Track B: Post-Visit leads (has at least one visit)
  if (visitCount > 0 && lastVisitDate) {
    const daysSinceLastVisit = ageDaysIST(lastVisitDate);

    if (daysSinceLastVisit <= 30) return "ACTIVE_VISITOR";
    if (daysSinceLastVisit <= 90) return "AT_RISK_VISITOR";
    return "INACTIVE_VISITOR";
  }

  // Track A: Pre-Visit leads (no visits)
  if (ageDays <= 7) {
    // Within first 7 days — check for qualification
    if (hasPreferences(preferenceJson)) return "QUALIFIED";
    return "NEW_LEAD";
  }

  if (ageDays <= 30) return "AT_RISK_LEAD";
  return "INACTIVE_LEAD";
}

// ============================================
// SINGLE-LEAD OPERATIONS
// ============================================

/**
 * Set stage for a single lead.
 * Used when a specific event triggers a stage change (e.g., preference save).
 */
export async function setStage(
  leadId: string,
  stage: BuyerLeadStage
): Promise<void> {
  await db
    .update(leads)
    .set({ stage, updatedAt: new Date() })
    .where(eq(leads.id, leadId));
}

/**
 * Track C — Reactivation.
 * If the lead is in an AT_RISK or INACTIVE stage, move to REACTIVATED.
 * Also updates lastActiveAt.
 */
export async function registerActivity(
  leadId: string,
  _type: ActivityType
): Promise<{ reactivated: boolean; newStage: BuyerLeadStage | null }> {
  const reactivatableStages: BuyerLeadStage[] = [
    "AT_RISK_LEAD",
    "INACTIVE_LEAD",
    "AT_RISK_VISITOR",
    "INACTIVE_VISITOR",
  ];

  // Fetch current stage
  const [lead] = await db
    .select({ id: leads.id, stage: leads.stage })
    .from(leads)
    .where(and(eq(leads.id, leadId), isNull(leads.deletedAt)));

  if (!lead) return { reactivated: false, newStage: null };

  const currentStage = lead.stage as BuyerLeadStage | null;
  const now = new Date();

  if (currentStage && reactivatableStages.includes(currentStage)) {
    // Reactivate
    await db
      .update(leads)
      .set({
        stage: "REACTIVATED",
        lastActiveAt: now,
        updatedAt: now,
      })
      .where(eq(leads.id, leadId));

    return { reactivated: true, newStage: "REACTIVATED" };
  }

  // Not reactivatable — just update lastActiveAt
  await db
    .update(leads)
    .set({ lastActiveAt: now, updatedAt: now })
    .where(eq(leads.id, leadId));

  return { reactivated: false, newStage: currentStage };
}

/**
 * On preference save: if lead is NEW_LEAD and age ≤ 7 days, promote to QUALIFIED.
 */
export async function onPreferenceSaved(leadId: string): Promise<void> {
  const [lead] = await db
    .select({
      id: leads.id,
      stage: leads.stage,
      createdAt: leads.createdAt,
      preferenceJson: leads.preferenceJson,
    })
    .from(leads)
    .where(and(eq(leads.id, leadId), isNull(leads.deletedAt)));

  if (!lead || !lead.createdAt) return;

  const ageDays = ageDaysIST(lead.createdAt);

  if (lead.stage === "NEW_LEAD" && ageDays <= 7 && hasPreferences(lead.preferenceJson)) {
    await setStage(leadId, "QUALIFIED");
  }
}

// ============================================
// BULK CRON OPERATIONS (SQL-based for performance)
// ============================================

/**
 * Process all time-decay transitions in bulk.
 * Called by the daily cron job.
 *
 * Uses raw SQL for maximum performance — avoids loading leads into JS.
 */
export async function processTimeDecay(): Promise<CronResult> {
  const [preVisitResult, postVisitResult] = await Promise.all([
    processPreVisitDecay(),
    processPostVisitDecay(),
  ]);

  return {
    preVisitDecayed: preVisitResult,
    postVisitDecayed: postVisitResult,
    total: preVisitResult + postVisitResult,
  };
}

/**
 * Track A: Pre-Visit time-decay.
 * Transitions NEW_LEAD/QUALIFIED/REACTIVATED → AT_RISK_LEAD → INACTIVE_LEAD
 * based on lead age and absence of visits.
 */
async function processPreVisitDecay(): Promise<number> {
  // Single SQL update using CASE for all pre-visit decay transitions
  const result = await db.execute(sql`
    UPDATE leads
    SET
      stage = CASE
        -- Leads older than 30 days with no visits → INACTIVE_LEAD
        WHEN leads.created_at < (NOW() AT TIME ZONE 'Asia/Kolkata' - INTERVAL '30 days')
          THEN 'INACTIVE_LEAD'
        -- Leads older than 7 days with no visits → AT_RISK_LEAD
        WHEN leads.created_at < (NOW() AT TIME ZONE 'Asia/Kolkata' - INTERVAL '7 days')
          THEN 'AT_RISK_LEAD'
        ELSE leads.stage
      END,
      updated_at = NOW()
    WHERE leads.deleted_at IS NULL
      AND leads.stage IN ('NEW_LEAD', 'QUALIFIED', 'REACTIVATED')
      AND NOT EXISTS (
        SELECT 1 FROM visits v WHERE v.lead_id = leads.id
      )
      AND (
        leads.created_at < (NOW() AT TIME ZONE 'Asia/Kolkata' - INTERVAL '7 days')
      )
  `);

  return Number((result as unknown as { rowCount?: number })?.rowCount ?? 0);
}

/**
 * Track B: Post-Visit time-decay.
 * Transitions ACTIVE_VISITOR → AT_RISK_VISITOR → INACTIVE_VISITOR
 * based on time since last visit.
 */
async function processPostVisitDecay(): Promise<number> {
  // Single SQL update using a subquery for last visit date
  const result = await db.execute(sql`
    WITH lead_last_visit AS (
      SELECT
        v.lead_id,
        MAX(v.scheduled_at) AS last_visit_date
      FROM visits v
      GROUP BY v.lead_id
    )
    UPDATE leads
    SET
      stage = CASE
        -- Last visit > 90 days ago → INACTIVE_VISITOR
        WHEN llv.last_visit_date < (NOW() AT TIME ZONE 'Asia/Kolkata' - INTERVAL '90 days')
          THEN 'INACTIVE_VISITOR'
        -- Last visit > 30 days ago → AT_RISK_VISITOR
        WHEN llv.last_visit_date < (NOW() AT TIME ZONE 'Asia/Kolkata' - INTERVAL '30 days')
          THEN 'AT_RISK_VISITOR'
        ELSE leads.stage
      END,
      updated_at = NOW()
    FROM lead_last_visit llv
    WHERE leads.id = llv.lead_id
      AND leads.deleted_at IS NULL
      AND leads.stage IN ('ACTIVE_VISITOR', 'REACTIVATED')
      AND llv.last_visit_date < (NOW() AT TIME ZONE 'Asia/Kolkata' - INTERVAL '30 days')
  `);

  return Number((result as unknown as { rowCount?: number })?.rowCount ?? 0);
}

/**
 * Transition a lead to ACTIVE_VISITOR when a visit is scheduled/completed.
 */
export async function onVisitCreated(leadId: string): Promise<void> {
  const now = new Date();
  await db
    .update(leads)
    .set({
      stage: "ACTIVE_VISITOR",
      lastActiveAt: now,
      updatedAt: now,
    })
    .where(and(eq(leads.id, leadId), isNull(leads.deletedAt)));
}
