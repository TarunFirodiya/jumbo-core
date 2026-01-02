/**
 * Communication Service
 * Handles all database operations for communications (calls, WhatsApp, etc.)
 */

import { db } from "@/lib/db";
import { communications, leads, type NewCommunication, type Communication } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Create a new communication
 */
export async function createCommunication(data: NewCommunication): Promise<Communication> {
  const [communication] = await db
    .insert(communications)
    .values(data)
    .returning();

  return communication;
}

/**
 * Log a communication and update lead's lastContactedAt
 */
export async function logCommunication(data: {
  leadId?: string;
  sellerLeadId?: string;
  agentId: string;
  channel: string;
  direction: string;
  content?: string;
  recordingUrl?: string;
  metadata?: Record<string, unknown>;
}): Promise<Communication> {
  const [communication] = await db
    .insert(communications)
    .values({
      leadId: data.leadId ?? null,
      sellerLeadId: data.sellerLeadId ?? null,
      agentId: data.agentId,
      channel: data.channel,
      direction: data.direction,
      content: data.content ?? null,
      recordingUrl: data.recordingUrl ?? null,
      metadata: data.metadata ?? null,
    })
    .returning();

  // Update lastContactedAt on lead if applicable
  if (data.leadId) {
    await db
      .update(leads)
      .set({ lastContactedAt: new Date() })
      .where(eq(leads.id, data.leadId));
  }

  return communication;
}

/**
 * Get communications by lead
 */
export async function getCommunicationsByLead(
  leadId: string,
  limit: number = 50
): Promise<Communication[]> {
  return db.query.communications.findMany({
    where: eq(communications.leadId, leadId),
    with: {
      agent: true,
    },
    orderBy: [desc(communications.createdAt)],
    limit,
  });
}

/**
 * Get communications by seller lead
 */
export async function getCommunicationsBySellerLead(
  sellerLeadId: string,
  limit: number = 50
): Promise<Communication[]> {
  return db.query.communications.findMany({
    where: eq(communications.sellerLeadId, sellerLeadId),
    with: {
      agent: true,
    },
    orderBy: [desc(communications.createdAt)],
    limit,
  });
}

/**
 * Get communications by agent
 */
export async function getCommunicationsByAgent(
  agentId: string,
  limit: number = 50
): Promise<Communication[]> {
  return db.query.communications.findMany({
    where: eq(communications.agentId, agentId),
    with: {
      lead: true,
      sellerLead: true,
    },
    orderBy: [desc(communications.createdAt)],
    limit,
  });
}

