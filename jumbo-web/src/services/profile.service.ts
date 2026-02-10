/**
 * Profile Service
 * Handles all database operations for user profiles
 */

import { db } from "@/lib/db";
import { profiles, type NewProfile, type Profile, type UserRole } from "@/lib/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { NotFoundError } from "./errors";

/**
 * Create a new profile
 */
export async function createProfile(data: NewProfile): Promise<Profile> {
  const [profile] = await db.insert(profiles).values(data).returning();
  return profile;
}

/**
 * Get profile by ID
 */
export async function getProfileById(id: string): Promise<Profile | null> {
  const result = await db.query.profiles.findFirst({
    where: and(eq(profiles.id, id), isNull(profiles.deletedAt)),
  });
  return result ?? null;
}

/**
 * Get profile by phone number
 */
export async function getProfileByPhone(phone: string): Promise<Profile | null> {
  const result = await db.query.profiles.findFirst({
    where: and(eq(profiles.phone, phone), isNull(profiles.deletedAt)),
  });
  return result ?? null;
}

/**
 * Get profile by email
 */
export async function getProfileByEmail(email: string): Promise<Profile | null> {
  const result = await db.query.profiles.findFirst({
    where: and(eq(profiles.email, email), isNull(profiles.deletedAt)),
  });
  return result ?? null;
}

/**
 * Get profiles by role
 */
export async function getProfilesByRole(role: UserRole): Promise<Profile[]> {
  return db.query.profiles.findMany({
    where: and(eq(profiles.role, role), isNull(profiles.deletedAt)),
    orderBy: [desc(profiles.createdAt)],
  });
}

/**
 * Update a profile
 */
export async function updateProfile(
  id: string,
  data: Partial<NewProfile>
): Promise<Profile> {
  const existing = await getProfileById(id);
  if (!existing) {
    throw new NotFoundError("Profile", id);
  }

  const [updated] = await db
    .update(profiles)
    .set(data)
    .where(eq(profiles.id, id))
    .returning();

  return updated;
}

/**
 * Soft delete a profile
 */
export async function deleteProfile(id: string): Promise<void> {
  const existing = await getProfileById(id);
  if (!existing) {
    throw new NotFoundError("Profile", id);
  }

  await db
    .update(profiles)
    .set({ deletedAt: new Date() })
    .where(eq(profiles.id, id));
}

/**
 * Update profile coin balance
 */
export async function updateCoinBalance(
  id: string,
  newBalance: number
): Promise<Profile> {
  const [updated] = await db
    .update(profiles)
    .set({ totalCoins: newBalance })
    .where(eq(profiles.id, id))
    .returning();

  return updated;
}

/**
 * Find or create profile by phone
 */
export async function findOrCreateProfileByPhone(
  phone: string,
  data: Omit<NewProfile, "phone">
): Promise<Profile> {
  const existing = await getProfileByPhone(phone);
  if (existing) {
    return existing;
  }

  return createProfile({ ...data, phone });
}

