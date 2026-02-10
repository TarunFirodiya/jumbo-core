/**
 * Contact Service
 * Handles all database operations for the universal contacts (identity layer).
 * Contacts are the single source of truth for phone/email/name for buyers, sellers, etc.
 */

import { db } from "@/lib/db";
import { contacts, type NewContact, type Contact } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NotFoundError } from "./errors";

/**
 * Create a new contact
 */
export async function createContact(data: NewContact): Promise<Contact> {
  const [contact] = await db.insert(contacts).values(data).returning();
  return contact;
}

/**
 * Get contact by ID
 */
export async function getContactById(id: string): Promise<Contact | null> {
  const result = await db.query.contacts.findFirst({
    where: eq(contacts.id, id),
  });
  return result ?? null;
}

/**
 * Get contact by phone number
 */
export async function getContactByPhone(phone: string): Promise<Contact | null> {
  const result = await db.query.contacts.findFirst({
    where: eq(contacts.phone, phone),
  });
  return result ?? null;
}

/**
 * Find or create contact by phone
 * This is the primary way contacts are created — when a lead or seller lead comes in.
 */
export async function findOrCreateContactByPhone(
  phone: string,
  data: { name?: string; email?: string; metadata?: Record<string, unknown> }
): Promise<Contact> {
  const existing = await getContactByPhone(phone);
  if (existing) {
    // Optionally update name/email if they were previously blank
    const updates: Partial<NewContact> = {};
    if (data.name && !existing.name) updates.name = data.name;
    if (data.email && !existing.email) updates.email = data.email;

    if (Object.keys(updates).length > 0) {
      const [updated] = await db
        .update(contacts)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(contacts.id, existing.id))
        .returning();
      return updated;
    }

    return existing;
  }

  return createContact({
    phone,
    name: data.name,
    email: data.email,
    metadata: data.metadata,
  });
}

/**
 * Update a contact
 */
export async function updateContact(
  id: string,
  data: Partial<NewContact>
): Promise<Contact> {
  const existing = await getContactById(id);
  if (!existing) {
    throw new NotFoundError("Contact", id);
  }

  const [updated] = await db
    .update(contacts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(contacts.id, id))
    .returning();

  return updated;
}
