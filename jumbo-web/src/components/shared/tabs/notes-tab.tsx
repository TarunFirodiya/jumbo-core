"use client";

import * as React from "react";
import {
  Loader2Icon,
  Note01Icon,
  Delete01Icon,
  PlusSignIcon,
} from "@hugeicons/react";
import { format, isToday, isYesterday } from "date-fns";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createNote, deleteNote, getNotesByEntity } from "@/lib/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NotesTabProps {
  entityType: "lead" | "seller_lead" | "visit" | "listing";
  entityId: string;
  className?: string;
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  if (isToday(date)) return `Today at ${format(date, "h:mm a")}`;
  if (isYesterday(date)) return `Yesterday at ${format(date, "h:mm a")}`;
  return format(date, "MMM d, yyyy 'at' h:mm a");
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function NotesTab({ entityType, entityId, className }: NotesTabProps) {
  const [notes, setNotes] = React.useState<any[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = React.useState(true);
  const [noteContent, setNoteContent] = React.useState("");
  const [isCreatingNote, setIsCreatingNote] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

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
        setIsExpanded(false);
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
    if (!confirm("Are you sure you want to delete this note?")) return;
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
    <div className={cn("bg-white rounded-xl border border-neutral-200", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <Note01Icon variant="stroke" className="size-4 text-neutral-500" />
          <h3 className="font-medium text-neutral-900">Notes</h3>
          <span className="text-sm font-normal text-neutral-500">({notes.length})</span>
        </div>
        {!isExpanded && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="h-8 gap-1.5 text-neutral-600 hover:text-neutral-900 font-normal"
          >
            <PlusSignIcon variant="stroke" className="size-4" />
            Add note
          </Button>
        )}
      </div>

      {/* Add Note Form */}
      {isExpanded && (
        <div className="p-4 border-b border-neutral-200">
          <div className="space-y-3">
            <Textarea
              placeholder="Write a note..."
              className="min-h-[100px] rounded-lg border-neutral-200 focus:border-neutral-400 resize-none"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsExpanded(false);
                  setNoteContent("");
                }}
                className="h-8 font-normal"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleCreateNote}
                disabled={isCreatingNote || !noteContent.trim()}
                className="h-8 bg-neutral-900 text-white hover:bg-neutral-800 rounded-lg font-medium"
              >
                {isCreatingNote ? (
                  <><Loader2Icon className="size-4 animate-spin mr-1" /> Saving...</>
                ) : (
                  "Add note"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="divide-y divide-neutral-100">
        {isLoadingNotes ? (
          <div className="flex items-center justify-center py-8 text-neutral-500">
            <Loader2Icon className="size-5 animate-spin mr-2" />
            <span className="font-normal">Loading notes...</span>
          </div>
        ) : notes.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Note01Icon variant="stroke" className="size-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm font-normal text-neutral-500">
              No notes yet. Add one to get started.
            </p>
          </div>
        ) : (
          notes.map((note: any) => (
            <div key={note.id} className="px-4 py-3">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-7 rounded-lg">
                      <AvatarFallback className="bg-neutral-100 text-neutral-600 text-xs font-medium rounded-lg">
                        {getInitials(note.createdBy?.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">
                        {note.createdBy?.fullName || "Unknown"}
                      </p>
                      <p className="text-xs font-normal text-neutral-400">
                        {note.createdAt ? formatTimestamp(new Date(note.createdAt).toISOString()) : ""}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteNote(note.id)}
                    className="h-7 w-7 p-0 text-neutral-400 hover:text-red-600"
                  >
                    <Delete01Icon variant="stroke" className="size-4" />
                  </Button>
                </div>
                <p className="text-sm font-normal text-neutral-700 whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
