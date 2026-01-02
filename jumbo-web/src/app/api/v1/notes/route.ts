import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { logActivity, computeChanges } from "@/lib/audit";
import { createNoteSchema, queryNotesSchema } from "@/lib/validations/note";
import * as noteService from "@/services/note.service";

/**
 * GET /api/v1/notes
 * List notes by entity type and entity ID
 */
export const GET = withAuth<{ data: unknown[] } | { error: string; message: string }>(
  async (request: NextRequest, { user, profile }) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const query = queryNotesSchema.parse({
        entityType: searchParams.get("entityType"),
        entityId: searchParams.get("entityId"),
      });

      const notesList = await noteService.getNotesByEntity(query.entityType, query.entityId);

      return NextResponse.json({ data: notesList });
    } catch (error) {
      console.error("Error fetching notes:", error);
      return NextResponse.json(
        { error: "Internal Server Error", message: "Failed to fetch notes" },
        { status: 500 }
      );
    }
  },
  "notes:read"
);

/**
 * POST /api/v1/notes
 * Create a new note
 */
export const POST = withAuth<{ data: unknown; message: string } | { error: string; message: string; details?: unknown }>(
  async (request: NextRequest, { user, profile }) => {
    try {
      const body = await request.json();
      const validatedData = createNoteSchema.parse(body);

      const newNote = await noteService.createNote({
        entityType: validatedData.entityType,
        entityId: validatedData.entityId,
        content: validatedData.content,
        createdById: user.id,
      });

      await logActivity({
        entityType: "note",
        entityId: newNote.id,
        action: "create",
        changes: computeChanges(null, newNote),
        performedById: user.id,
      });

      return NextResponse.json(
        {
          data: newNote,
          message: "Note created successfully",
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("Error creating note:", error);
      return NextResponse.json(
        { error: "Internal Server Error", message: "Failed to create note" },
        { status: 500 }
      );
    }
  },
  "notes:create"
);
