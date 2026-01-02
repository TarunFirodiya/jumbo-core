/**
 * Note Service
 * Handles all database operations for notes
 */

import { db } from "@/lib/db";
import { notes, type NewNote, type Note } from "@/lib/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { NotFoundError } from "./errors";

/**
 * Create a new note
 */
export async function createNote(data: {
  entityType: string;
  entityId: string;
  content: string;
  createdById: string;
}): Promise<Note> {
  const [note] = await db
    .insert(notes)
    .values({
      entityType: data.entityType,
      entityId: data.entityId,
      content: data.content,
      createdById: data.createdById,
    })
    .returning();

  return note;
}

/**
 * Get note by ID
 */
export async function getNoteById(id: string): Promise<Note | null> {
  const result = await db.query.notes.findFirst({
    where: and(eq(notes.id, id), isNull(notes.deletedAt)),
    with: {
      createdBy: true,
    },
  });
  return result ?? null;
}

/**
 * Get notes by entity
 */
export async function getNotesByEntity(
  entityType: string,
  entityId: string
): Promise<Note[]> {
  return db.query.notes.findMany({
    where: and(
      eq(notes.entityType, entityType),
      eq(notes.entityId, entityId),
      isNull(notes.deletedAt)
    ),
    with: {
      createdBy: true,
    },
    orderBy: [desc(notes.createdAt)],
  });
}

/**
 * Update a note
 */
export async function updateNote(noteId: string, content: string): Promise<Note> {
  const existing = await getNoteById(noteId);
  if (!existing) {
    throw new NotFoundError("Note", noteId);
  }

  const [updated] = await db
    .update(notes)
    .set({ content })
    .where(eq(notes.id, noteId))
    .returning();

  return updated;
}

/**
 * Soft delete a note
 */
export async function deleteNote(noteId: string): Promise<void> {
  const existing = await getNoteById(noteId);
  if (!existing) {
    throw new NotFoundError("Note", noteId);
  }

  await db
    .update(notes)
    .set({ deletedAt: new Date() })
    .where(eq(notes.id, noteId));
}

/**
 * Check if user owns a note
 */
export async function isNoteOwner(noteId: string, userId: string): Promise<boolean> {
  const note = await getNoteById(noteId);
  return note?.createdById === userId;
}

