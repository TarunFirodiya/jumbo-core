/**
 * Lead Service
 * Handles all database operations for buyer leads
 */

import { db } from "@/lib/db";
import { leads, notes, type NewLead, type Lead } from "@/lib/db/schema";
import { eq, and, sql, desc, isNull, ne, gte } from "drizzle-orm";
import type { LeadFilters, PaginatedResult } from "./types";
import { NotFoundError } from "./errors";
import * as contactService from "./contact.service";
import * as teamService from "./team.service";

/**
 * Create a new lead
 */
export async function createLead(data: NewLead): Promise<Lead> {
  const [lead] = await db.insert(leads).values(data).returning();
  return lead;
}

/**
 * Create lead with contact creation if needed.
 * This replaces the old createLeadWithProfile — now creates/finds a Contact
 * instead of a Profile (team member).
 */
export async function createLeadWithContact(data: {
  contact: {
    fullName: string;
    phone: string;
    email?: string;
  };
  leadId?: string;
  source?: string;
  status?: "new" | "contacted" | "active_visitor" | "at_risk" | "closed";
  externalId?: string;
  sourceListingId?: string;
  dropReason?: string;
  locality?: string;
  zone?: string;
  pipeline?: boolean;
  referredBy?: string;
  testListingId?: string;
  requirements?: Record<string, unknown>;
  preferences?: Record<string, unknown>;
  assignedAgentId?: string;
  createdById?: string;
}): Promise<Lead> {
  // Find or create contact by phone
  const contact = await contactService.findOrCreateContactByPhone(
    data.contact.phone,
    {
      name: data.contact.fullName,
      email: data.contact.email,
    }
  );

  // Create lead
  const [lead] = await db
    .insert(leads)
    .values({
      contactId: contact.id,
      leadId: data.leadId ?? null,
      source: data.source ?? null,
      status: data.status ?? "new",
      externalId: data.externalId ?? null,
      sourceListingId: data.sourceListingId ?? null,
      dropReason: data.dropReason ?? null,
      locality: data.locality ?? null,
      zone: data.zone ?? null,
      pipeline: data.pipeline ?? false,
      referredBy: data.referredBy ?? null,
      testListingId: data.testListingId ?? null,
      requirementJson: data.requirements ?? null,
      preferenceJson: data.preferences ?? null,
      assignedAgentId: data.assignedAgentId ?? null,
      createdById: data.createdById ?? null,
    })
    .returning();

  return lead;
}

/**
 * Get lead by ID
 */
export async function getLeadById(id: string): Promise<Lead | null> {
  const result = await db.query.leads.findFirst({
    where: and(eq(leads.id, id), isNull(leads.deletedAt)),
    with: {
      contact: true,
      assignedAgent: true,
    },
  });
  return result ?? null;
}

/**
 * Get lead by ID with all relations
 */
export async function getLeadByIdWithRelations(id: string) {
  return db.query.leads.findFirst({
    where: and(eq(leads.id, id), isNull(leads.deletedAt)),
    with: {
      contact: true,
      assignedAgent: true,
      communications: {
        orderBy: (comm, { desc }) => [desc(comm.createdAt)],
        limit: 10,
      },
      visits: {
        orderBy: (visit, { desc }) => [desc(visit.createdAt)],
        limit: 10,
      },
    },
  });
}

/**
 * Get leads with filters and pagination
 */
export async function getLeads(
  filters: LeadFilters = {}
): Promise<PaginatedResult<Lead>> {
  const { page = 1, limit = 50, status, source, agentId, includeDeleted = false } = filters;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (!includeDeleted) {
    conditions.push(isNull(leads.deletedAt));
  }

  if (status) {
    conditions.push(eq(leads.status, status as any));
  }

  if (source) {
    conditions.push(eq(leads.source, source));
  }

  if (agentId) {
    conditions.push(eq(leads.assignedAgentId, agentId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db.query.leads.findMany({
      where: whereClause,
      with: {
        contact: true,
        assignedAgent: true,
      },
      limit,
      offset,
      orderBy: [desc(leads.createdAt)],
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(whereClause),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Update lead status
 */
export async function updateLeadStatus(id: string, status: string): Promise<Lead> {
  const existing = await getLeadById(id);
  if (!existing) {
    throw new NotFoundError("Lead", id);
  }

  const updateData: Partial<NewLead> = { status, updatedAt: new Date() };

  // Update lastContactedAt if status is "contacted"
  if (status === "contacted") {
    updateData.lastContactedAt = new Date();
  }

  const [updated] = await db
    .update(leads)
    .set(updateData)
    .where(eq(leads.id, id))
    .returning();

  return updated;
}

/**
 * Assign lead to an agent
 */
export async function assignLead(leadId: string, agentId: string): Promise<Lead> {
  const existing = await getLeadById(leadId);
  if (!existing) {
    throw new NotFoundError("Lead", leadId);
  }

  const [updated] = await db
    .update(leads)
    .set({ assignedAgentId: agentId, updatedAt: new Date() })
    .where(eq(leads.id, leadId))
    .returning();

  return updated;
}

/**
 * Round-robin lead assignment
 * Assigns lead to the agent with the least number of leads
 */
export async function assignLeadRoundRobin(leadId: string): Promise<string | null> {
  // Get all active buyer agents
  const agents = await teamService.getTeamMembersByRole("buyer_agent");

  if (agents.length === 0) {
    return null;
  }

  // Get the agent with the least assigned leads
  const agentLeadCounts = await Promise.all(
    agents.map(async (agent) => {
      const count = await db
        .select({ count: sql<number>`count(*)` })
        .from(leads)
        .where(and(eq(leads.assignedAgentId, agent.id), isNull(leads.deletedAt)));
      return {
        agentId: agent.id,
        count: Number(count[0]?.count ?? 0),
      };
    })
  );

  // Sort by count and pick the one with least leads
  agentLeadCounts.sort((a, b) => a.count - b.count);
  const assignedAgentId = agentLeadCounts[0]?.agentId;

  if (assignedAgentId) {
    await db
      .update(leads)
      .set({ assignedAgentId, updatedAt: new Date() })
      .where(eq(leads.id, leadId));
  }

  return assignedAgentId ?? null;
}

/**
 * Update a lead
 */
export async function updateLead(id: string, data: Partial<NewLead>): Promise<Lead> {
  const existing = await getLeadById(id);
  if (!existing) {
    throw new NotFoundError("Lead", id);
  }

  const [updated] = await db
    .update(leads)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(leads.id, id))
    .returning();

  return updated;
}

/**
 * Update lead with contact data
 * Updates both the lead and its associated contact.
 */
export async function updateLeadWithContact(
  id: string,
  data: {
    status?: string;
    budget_min?: number;
    budget_max?: number;
    bhk?: number[];
    localities?: string[];
    name?: string;
    email?: string;
    mobile?: string;
    assignedAgentId?: string;
  }
): Promise<Lead> {
  const lead = await db.query.leads.findFirst({
    where: eq(leads.id, id),
    with: { contact: true },
  });

  if (!lead) {
    throw new NotFoundError("Lead", id);
  }

  // Update lead fields
  const leadUpdates: Partial<NewLead> = { updatedAt: new Date() };
  if (data.status) leadUpdates.status = data.status;
  if (data.assignedAgentId) leadUpdates.assignedAgentId = data.assignedAgentId;

  // Update requirements JSON if any requirement fields changed
  if (
    data.budget_min !== undefined ||
    data.budget_max !== undefined ||
    data.bhk ||
    data.localities
  ) {
    leadUpdates.requirementJson = {
      ...(lead.requirementJson as Record<string, unknown> ?? {}),
      ...(data.budget_min !== undefined && { budget_min: data.budget_min }),
      ...(data.budget_max !== undefined && { budget_max: data.budget_max }),
      ...(data.bhk && { bhk: data.bhk }),
      ...(data.localities && { localities: data.localities }),
    };
  }

  if (Object.keys(leadUpdates).length > 1) { // >1 because updatedAt is always set
    await db.update(leads).set(leadUpdates).where(eq(leads.id, id));
  }

  // Update contact if provided
  if (lead.contactId && (data.name || data.email || data.mobile)) {
    await contactService.updateContact(lead.contactId, {
      ...(data.name && { name: data.name }),
      ...(data.email && { email: data.email }),
      ...(data.mobile && { phone: data.mobile }),
    });
  }

  const updatedLead = await getLeadById(id);
  if (!updatedLead) {
    throw new NotFoundError("Lead", id);
  }

  return updatedLead;
}

/**
 * Soft delete a lead
 */
export async function deleteLead(id: string): Promise<void> {
  const existing = await getLeadById(id);
  if (!existing) {
    throw new NotFoundError("Lead", id);
  }

  await db.update(leads).set({ deletedAt: new Date() }).where(eq(leads.id, id));
}

/**
 * Update last contacted timestamp
 */
export async function updateLastContactedAt(id: string): Promise<void> {
  await db
    .update(leads)
    .set({ lastContactedAt: new Date(), updatedAt: new Date() })
    .where(eq(leads.id, id));
}

/**
 * Check for duplicate lead by external ID and source
 */
export async function findLeadByExternalId(
  externalId: string,
  source: string
): Promise<Lead | null> {
  const result = await db.query.leads.findFirst({
    where: and(eq(leads.externalId, externalId), eq(leads.source, source)),
    with: {
      contact: true,
      assignedAgent: true,
    },
  });
  return result ?? null;
}

/**
 * Get lead count by agent
 */
export async function getLeadCountByAgent(agentId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(leads)
    .where(and(eq(leads.assignedAgentId, agentId), isNull(leads.deletedAt)));

  return Number(result[0]?.count ?? 0);
}

/**
 * Get buyer dashboard stats
 */
export async function getBuyerStats(): Promise<{
  totalBuyers: number;
  activeBuyers: number;
  newThisMonth: number;
}> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [totalResult, activeResult, newResult] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(isNull(leads.deletedAt)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(and(isNull(leads.deletedAt), ne(leads.status, "closed"))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(
        and(
          isNull(leads.deletedAt),
          gte(leads.createdAt, startOfMonth)
        )
      ),
  ]);

  return {
    totalBuyers: Number(totalResult[0]?.count ?? 0),
    activeBuyers: Number(activeResult[0]?.count ?? 0),
    newThisMonth: Number(newResult[0]?.count ?? 0),
  };
}

// ============================================
// BACKWARDS-COMPATIBLE ALIASES
// ============================================

/** @deprecated Use createLeadWithContact */
export const createLeadWithProfile = createLeadWithContact;

/** @deprecated Use updateLeadWithContact */
export const updateLeadWithProfile = updateLeadWithContact;
