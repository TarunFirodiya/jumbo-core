"use client";

import * as React from "react";
import { Loader2, StickyNote, Trash2 } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

import { createNote, deleteNote, getNotesByEntity } from "@/lib/actions";
import { toast } from "sonner";

interface NotesTabProps {
  entityType: "lead" | "seller_lead" | "visit";
  entityId: string;
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  if (isToday(date)) return `Today at ${format(date, "h:mm a")}`;
  if (isYesterday(date)) return `Yesterday at ${format(date, "h:mm a")}`;
  return format(date, "MMM d, yyyy 'at' h:mm a");
}

export function NotesTab({ entityType, entityId }: NotesTabProps) {
  const [notes, setNotes] = React.useState<any[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = React.useState(true);
  const [noteContent, setNoteContent] = React.useState("");
  const [isCreatingNote, setIsCreatingNote] = React.useState(false);

  const fetchNotes = React.useCallback(async () => {
    if (!entityId) return;
    setIsLoadingNotes(true);
    try {
      const result = await getNotesByEntity(entityType, entityId);
      if (result.success && result.data) {
        setNotes(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    } finally {
      setIsLoadingNotes(false);
    }
  }, [entityType, entityId]);

  React.useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  async function handleCreateNote() {
    if (!noteContent.trim()) return;
    setIsCreatingNote(true);
    try {
      const result = await createNote(entityType, entityId, noteContent.trim());
      if (result.success) {
        toast.success("Note added");
        setNoteContent("");
        await fetchNotes();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to add note");
    } finally {
      setIsCreatingNote(false);
    }
  }

  async function handleDeleteNote(noteId: string) {
    try {
      const result = await deleteNote(noteId);
      if (result.success) {
        toast.success("Note deleted");
        await fetchNotes();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to delete note");
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="space-y-3">
            <Textarea
              placeholder="Add a note..."
              className="min-h-[100px]"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
            />
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleCreateNote}
                disabled={isCreatingNote || !noteContent.trim()}
              >
                {isCreatingNote ? (
                  <><Loader2 className="size-4 animate-spin mr-1" /> Adding...</>
                ) : (
                  "Add Note"
                )}
              </Button>
            </div>
          </div>

          {isLoadingNotes ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading notes...
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <StickyNote className="size-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No notes yet</p>
              <p className="text-sm mt-1">Add your first note above.</p>
            </div>
          ) : (
            <div className="space-y-3 pt-4 border-t">
              {notes.map((note: any) => (
                <Card key={note.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">
                            {note.createdBy?.fullName || "Unknown"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {note.createdAt ? formatTimestamp(new Date(note.createdAt).toISOString()) : ""}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
