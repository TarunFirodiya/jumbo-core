/**
 * Team Service
 * Handles all database operations for internal team members (agents, admins, etc.)
 * Renamed from profile.service.ts as part of the Feb 2026 schema migration.
 */

import { db } from "@/lib/db";
import { team, type NewTeamMember, type TeamMember, type UserRole } from "@/lib/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { NotFoundError } from "./errors";

/**
 * Create a new team member
 */
export async function createTeamMember(data: NewTeamMember): Promise<TeamMember> {
  const [member] = await db.insert(team).values(data).returning();
  return member;
}

/**
 * Get team member by ID
 */
export async function getTeamMemberById(id: string): Promise<TeamMember | null> {
  const result = await db.query.team.findFirst({
    where: and(eq(team.id, id), isNull(team.deletedAt)),
  });
  return result ?? null;
}

/**
 * Get team member by phone number
 */
export async function getTeamMemberByPhone(phone: string): Promise<TeamMember | null> {
  const result = await db.query.team.findFirst({
    where: and(eq(team.phone, phone), isNull(team.deletedAt)),
  });
  return result ?? null;
}

/**
 * Get team member by email
 */
export async function getTeamMemberByEmail(email: string): Promise<TeamMember | null> {
  const result = await db.query.team.findFirst({
    where: and(eq(team.email, email), isNull(team.deletedAt)),
  });
  return result ?? null;
}

/**
 * Get team members by role
 */
export async function getTeamMembersByRole(role: UserRole): Promise<TeamMember[]> {
  return db.query.team.findMany({
    where: and(eq(team.role, role), isNull(team.deletedAt)),
    orderBy: [desc(team.createdAt)],
  });
}

/**
 * Update a team member
 */
export async function updateTeamMember(
  id: string,
  data: Partial<NewTeamMember>
): Promise<TeamMember> {
  const existing = await getTeamMemberById(id);
  if (!existing) {
    throw new NotFoundError("TeamMember", id);
  }

  const [updated] = await db
    .update(team)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(team.id, id))
    .returning();

  return updated;
}

/**
 * Soft delete a team member
 */
export async function deleteTeamMember(id: string): Promise<void> {
  const existing = await getTeamMemberById(id);
  if (!existing) {
    throw new NotFoundError("TeamMember", id);
  }

  await db
    .update(team)
    .set({ deletedAt: new Date() })
    .where(eq(team.id, id));
}

/**
 * Update team member coin balance
 */
export async function updateCoinBalance(
  id: string,
  newBalance: number
): Promise<TeamMember> {
  const [updated] = await db
    .update(team)
    .set({ totalCoins: newBalance })
    .where(eq(team.id, id))
    .returning();

  return updated;
}

/**
 * Find or create team member by phone
 */
export async function findOrCreateTeamMemberByPhone(
  phone: string,
  data: Omit<NewTeamMember, "phone">
): Promise<TeamMember> {
  const existing = await getTeamMemberByPhone(phone);
  if (existing) {
    return existing;
  }

  return createTeamMember({ ...data, phone });
}

// ============================================
// BACKWARDS-COMPATIBLE ALIASES
// These will be removed once all call sites are updated.
// ============================================

/** @deprecated Use createTeamMember */
export const createProfile = createTeamMember;
/** @deprecated Use getTeamMemberById */
export const getProfileById = getTeamMemberById;
/** @deprecated Use getTeamMemberByPhone */
export const getProfileByPhone = getTeamMemberByPhone;
/** @deprecated Use getTeamMemberByEmail */
export const getProfileByEmail = getTeamMemberByEmail;
/** @deprecated Use getTeamMembersByRole */
export const getProfilesByRole = getTeamMembersByRole;
/** @deprecated Use updateTeamMember */
export const updateProfile = updateTeamMember;
/** @deprecated Use deleteTeamMember */
export const deleteProfile = deleteTeamMember;
/** @deprecated Use findOrCreateTeamMemberByPhone */
export const findOrCreateProfileByPhone = findOrCreateTeamMemberByPhone;
