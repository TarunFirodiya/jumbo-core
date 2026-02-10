/**
 * Coin Service
 * Handles Jumbo-Coins ledger management and balance updates
 */

import { db } from "@/lib/db";
import {
  creditLedger,
  creditRules,
  profiles,
  type CreditLedgerEntry,
  type CreditRule,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { RuleNotFoundError, NotFoundError } from "./errors";

/**
 * Get credit rule by action type
 */
export async function getCreditRule(actionType: string): Promise<CreditRule | null> {
  const result = await db.query.creditRules.findFirst({
    where: eq(creditRules.actionType, actionType),
  });
  return result ?? null;
}

/**
 * Get coin balance for an agent
 */
export async function getCoinBalance(agentId: string): Promise<number> {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, agentId),
  });

  return profile?.totalCoins ?? 0;
}

/**
 * Get ledger entries for an agent
 */
export async function getLedgerEntries(
  agentId: string,
  limit: number = 50
): Promise<CreditLedgerEntry[]> {
  return db.query.creditLedger.findMany({
    where: eq(creditLedger.agentId, agentId),
    orderBy: [desc(creditLedger.createdAt)],
    limit,
  });
}

/**
 * Award coins to an agent
 * Returns the new balance
 */
export async function awardCoins(
  agentId: string,
  actionType: string,
  referenceId?: string,
  notes?: string
): Promise<{ newBalance: number; coinsAwarded: number }> {
  // Get coin value from rules
  const rule = await getCreditRule(actionType);
  if (!rule) {
    throw new RuleNotFoundError(actionType);
  }

  // Get current profile
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, agentId),
  });

  if (!profile) {
    throw new NotFoundError("Profile", agentId);
  }

  // Create ledger entry
  await db.insert(creditLedger).values({
    agentId,
    amount: rule.coinValue,
    actionType,
    referenceId: referenceId ?? null,
    notes: notes ?? null,
  });

  // Update cached balance in profile
  const newBalance = (profile.totalCoins ?? 0) + rule.coinValue;
  await db
    .update(profiles)
    .set({ totalCoins: newBalance })
    .where(eq(profiles.id, agentId));

  return {
    newBalance,
    coinsAwarded: rule.coinValue,
  };
}

/**
 * Create a credit rule
 */
export async function createCreditRule(
  actionType: string,
  coinValue: number,
  description?: string
): Promise<CreditRule> {
  const [rule] = await db
    .insert(creditRules)
    .values({ actionType, coinValue, description })
    .returning();

  return rule;
}

/**
 * Update a credit rule
 */
export async function updateCreditRule(
  actionType: string,
  coinValue: number,
  description?: string
): Promise<CreditRule> {
  const [rule] = await db
    .update(creditRules)
    .set({ coinValue, description })
    .where(eq(creditRules.actionType, actionType))
    .returning();

  return rule;
}

/**
 * Get all credit rules
 */
export async function getAllCreditRules(): Promise<CreditRule[]> {
  return db.query.creditRules.findMany({});
}

