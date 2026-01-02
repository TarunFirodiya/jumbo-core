/**
 * Lead Service
 * Handles all database operations for buyer leads
 */

import { db } from "@/lib/db";
import { leads, profiles, notes, type NewLead, type Lead } from "@/lib/db/schema";
import { eq, and, sql, desc, isNull } from "drizzle-orm";
import type { LeadFilters, PaginatedResult } from "./types";
import { NotFoundError } from "./errors";
import * as profileService from "./profile.service";

/**
 * Create a new lead
 */
export async function createLead(data: NewLead): Promise<Lead> {
  const [lead] = await db.insert(leads).values(data).returning();
  return lead;
}

/**
 * Create lead with profile creation if needed
 */
export async function createLeadWithProfile(data: {
  profile: {
    fullName: string;
    phone: string;
    email?: string;
  };
  leadId?: string;
  source?: string;
  status?: "new" | "contacted" | "active_visitor" | "at_risk" | "closed";
  externalId?: string;
  secondaryPhone?: string;
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
}): Promise<Lead> {
  // Check if profile exists by phone
  let profile = await profileService.getProfileByPhone(data.profile.phone);

  // Create profile if not exists
  if (!profile) {
    profile = await profileService.createProfile({
      fullName: data.profile.fullName,
      phone: data.profile.phone,
      email: data.profile.email ?? null,
    });
  }

  // Create lead
  const [lead] = await db
    .insert(leads)
    .values({
      profileId: profile.id,
      leadId: data.leadId ?? null,
      source: data.source ?? null,
      status: data.status ?? "new",
      externalId: data.externalId ?? null,
      secondaryPhone: data.secondaryPhone ?? null,
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
    })
    .returning();

  return lead;
}

/**
 * Get lead by ID
 */
export async function getLeadById(id: string): Promise<Lead | null> {
  return db.query.leads.findFirst({
    where: and(eq(leads.id, id), isNull(leads.deletedAt)),
    with: {
      profile: true,
      assignedAgent: true,
    },
  });
}

/**
 * Get lead by ID with all relations
 */
export async function getLeadByIdWithRelations(id: string) {
  return db.query.leads.findFirst({
    where: and(eq(leads.id, id), isNull(leads.deletedAt)),
    with: {
      profile: true,
      assignedAgent: true,
      communications: {
        orderBy: (comm, { desc }) => [desc(comm.createdAt)],
        limit: 10,
      },
      visits: {
        orderBy: (visit, { desc }) => [desc(visit.createdAt)],
        limit: 10,
      },
      // Notes are queried separately due to polymorphic relationship
      // Use noteService.getNotesByEntity('buyer_lead', id) if needed
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
    conditions.push(eq(leads.status, status));
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
        profile: true,
        assignedAgent: true,
        // Notes are queried separately due to polymorphic relationship
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

  const updateData: Partial<NewLead> = { status };

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
    .set({ assignedAgentId: agentId })
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
  const agents = await profileService.getProfilesByRole("buyer_agent");

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
      .set({ assignedAgentId })
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
    .set(data)
    .where(eq(leads.id, id))
    .returning();

  return updated;
}

/**
 * Update lead with profile data
 */
export async function updateLeadWithProfile(
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
    with: { profile: true },
  });

  if (!lead) {
    throw new NotFoundError("Lead", id);
  }

  // Update lead fields
  const leadUpdates: Partial<NewLead> = {};
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

  if (Object.keys(leadUpdates).length > 0) {
    await db.update(leads).set(leadUpdates).where(eq(leads.id, id));
  }

  // Update profile if provided
  if (lead.profileId && (data.name || data.email || data.mobile)) {
    await profileService.updateProfile(lead.profileId, {
      ...(data.name && { fullName: data.name }),
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
    .set({ lastContactedAt: new Date() })
    .where(eq(leads.id, id));
}

/**
 * Check for duplicate lead by external ID and source
 */
export async function findLeadByExternalId(
  externalId: string,
  source: string
): Promise<Lead | null> {
  return db.query.leads.findFirst({
    where: and(eq(leads.externalId, externalId), eq(leads.source, source)),
    with: {
      profile: true,
      assignedAgent: true,
    },
  });
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

