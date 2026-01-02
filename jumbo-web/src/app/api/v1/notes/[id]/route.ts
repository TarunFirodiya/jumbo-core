import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";
import { logActivity, computeChanges } from "@/lib/audit";
import { updateNoteSchema } from "@/lib/validations/note";

/**
 * GET /api/v1/notes/[id]
 * Get a single note by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const handler = withAuth<{ data: unknown } | { error: string; message: string }>(
    async (req: NextRequest, { user, profile }) => {
      try {

      const note = await db.query.notes.findFirst({
        where: and(
          eq(notes.id, id),
          sql`${notes.deletedAt} IS NULL`
        ),
        with: {
          createdBy: true,
        },
      });

      if (!note) {
        return NextResponse.json(
          { error: "Not Found", message: "Note not found" },
          { status: 404 }
        );
      }

        return NextResponse.json({ data: note });
      } catch (error) {
        console.error("Error fetching note:", error);
        return NextResponse.json(
          { error: "Internal Server Error", message: "Failed to fetch note" },
          { status: 500 }
        );
      }
    },
    "notes:read"
  );
  return handler(request);
}

/**
 * PUT /api/v1/notes/[id]
 * Update a note
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const handler = withAuth<{ data: unknown; message: string } | { error: string; message: string }>(
    async (req: NextRequest, { user, profile }) => {
      try {

      const existingNote = await db.query.notes.findFirst({
        where: and(
          eq(notes.id, id),
          sql`${notes.deletedAt} IS NULL`
        ),
      });

      if (!existingNote) {
        return NextResponse.json(
          { error: "Not Found", message: "Note not found" },
          { status: 404 }
        );
      }

      // Only allow creator to update
      if (existingNote.createdById !== user.id) {
        return NextResponse.json(
          { error: "Forbidden", message: "You can only update your own notes" },
          { status: 403 }
        );
      }

      const body = await request.json();
      const validatedData = updateNoteSchema.parse(body);

      const [updatedNote] = await db
        .update(notes)
        .set({
          content: validatedData.content,
        })
        .where(eq(notes.id, id))
        .returning();

      await logActivity({
        entityType: "note",
        entityId: id,
        action: "update",
        changes: computeChanges(existingNote, updatedNote),
        performedById: user.id,
      });

        return NextResponse.json({
          data: updatedNote,
          message: "Note updated successfully",
        });
      } catch (error) {
        console.error("Error updating note:", error);
        return NextResponse.json(
          { error: "Internal Server Error", message: "Failed to update note" },
          { status: 500 }
        );
      }
    },
    "notes:update"
  );
  return handler(request);
}

/**
 * DELETE /api/v1/notes/[id]
 * Soft delete a note
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const handler = withAuth<{ message: string } | { error: string; message: string }>(
    async (req: NextRequest, { user, profile }) => {
      try {

      const existingNote = await db.query.notes.findFirst({
        where: and(
          eq(notes.id, id),
          sql`${notes.deletedAt} IS NULL`
        ),
      });

      if (!existingNote) {
        return NextResponse.json(
          { error: "Not Found", message: "Note not found" },
          { status: 404 }
        );
      }

      // Only allow creator to delete
      if (existingNote.createdById !== user.id) {
        return NextResponse.json(
          { error: "Forbidden", message: "You can only delete your own notes" },
          { status: 403 }
        );
      }

      await db
        .update(notes)
        .set({ deletedAt: new Date() })
        .where(eq(notes.id, id));

      await logActivity({
        entityType: "note",
        entityId: id,
        action: "delete",
        changes: null,
        performedById: user.id,
      });

        return NextResponse.json({
          message: "Note deleted successfully",
        });
      } catch (error) {
        console.error("Error deleting note:", error);
        return NextResponse.json(
          { error: "Internal Server Error", message: "Failed to delete note" },
          { status: 500 }
        );
      }
    },
    "notes:delete"
  );
  return handler(request);
}

