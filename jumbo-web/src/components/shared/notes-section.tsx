"use client"

import { useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import {
  Edit01Icon,
  Delete01Icon,
  Tick01Icon,
  Cancel01Icon,
  PlusSignIcon,
  Note01Icon,
} from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const createNoteSchema = z.object({
  content: z.string().min(1, "Note content is required"),
})

const updateNoteSchema = z.object({
  content: z.string().min(1, "Note content is required"),
})

type CreateNoteForm = z.infer<typeof createNoteSchema>
type UpdateNoteForm = z.infer<typeof updateNoteSchema>

interface Note {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  createdBy: {
    id: string
    fullName: string | null
    email: string
  }
}

interface NotesSectionProps {
  entityType: "seller_lead" | "buyer_lead" | "listing" | "visit" | "building" | "unit" | "inspection" | "catalogue"
  entityId: string
  className?: string
}

export function NotesSection({ entityType, entityId, className }: NotesSectionProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const { toast } = useToast()

  // Fetch notes
  const fetchNotes = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/v1/notes?entityType=${entityType}&entityId=${entityId}`
      )
      if (!response.ok) throw new Error("Failed to fetch notes")
      const data = await response.json()
      setNotes(data.data || [])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load notes",
        variant: "destructive",
      })
    }
  }, [entityType, entityId, toast])

  // Create note form
  const createForm = useForm<CreateNoteForm>({
    resolver: zodResolver(createNoteSchema),
    defaultValues: { content: "" },
  })

  // Update note form
  const updateForm = useForm<UpdateNoteForm>({
    resolver: zodResolver(updateNoteSchema),
    defaultValues: { content: "" },
  })

  // Handle create
  const onCreate = async (data: CreateNoteForm) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/v1/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType,
          entityId,
          content: data.content,
        }),
      })

      if (!response.ok) throw new Error("Failed to create note")

      createForm.reset()
      setIsExpanded(false)
      await fetchNotes()
      toast({ description: "Note added successfully" })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle update
  const onUpdate = async (noteId: string, data: UpdateNoteForm) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/v1/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: data.content }),
      })

      if (!response.ok) throw new Error("Failed to update note")

      setEditingNoteId(null)
      await fetchNotes()
      toast({ description: "Note updated successfully" })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle delete
  const onDelete = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/v1/notes/${noteId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete note")

      await fetchNotes()
      toast({ description: "Note deleted successfully" })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Start editing
  const startEditing = (note: Note) => {
    setEditingNoteId(note.id)
    updateForm.setValue("content", note.content)
  }

  // Get initials from name
  const getInitials = (name: string | null) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className={cn("bg-white rounded-xl border border-neutral-200", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <Note01Icon variant="stroke" className="size-4 text-neutral-500" />
          <h3 className="font-medium text-neutral-900">Notes</h3>
          <span className="text-sm font-normal text-neutral-500">
            ({notes.length})
          </span>
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
          <form onSubmit={createForm.handleSubmit(onCreate)} className="space-y-3">
            <Textarea
              placeholder="Write a note..."
              {...createForm.register("content")}
              className="min-h-[100px] rounded-lg border-neutral-200 focus:border-neutral-400 resize-none"
            />
            {createForm.formState.errors.content && (
              <p className="text-sm text-red-600 font-normal">
                {createForm.formState.errors.content.message}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsExpanded(false)
                  createForm.reset()
                }}
                className="h-8 font-normal"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isLoading}
                className="h-8 bg-neutral-900 text-white hover:bg-neutral-800 rounded-lg font-medium"
              >
                {isLoading ? "Saving..." : "Add note"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Notes List */}
      <div className="divide-y divide-neutral-100">
        {notes.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Note01Icon variant="stroke" className="size-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm font-normal text-neutral-500">
              No notes yet. Add one to get started.
            </p>
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="px-4 py-3">
              {editingNoteId === note.id ? (
                // Edit Mode
                <form
                  onSubmit={updateForm.handleSubmit((data) =>
                    onUpdate(note.id, data)
                  )}
                  className="space-y-3"
                >
                  <Textarea
                    {...updateForm.register("content")}
                    className="min-h-[100px] rounded-lg border-neutral-200 focus:border-neutral-400 resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingNoteId(null)}
                      className="h-8 gap-1.5 font-normal"
                    >
                      <Cancel01Icon variant="stroke" className="size-4" />
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isLoading}
                      className="h-8 gap-1.5 bg-neutral-900 text-white hover:bg-neutral-800 rounded-lg font-medium"
                    >
                      <Tick01Icon variant="stroke" className="size-4" />
                      Save
                    </Button>
                  </div>
                </form>
              ) : (
                // View Mode
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7 rounded-lg">
                        <AvatarFallback className="bg-neutral-100 text-neutral-600 text-xs font-medium rounded-lg">
                          {getInitials(note.createdBy.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-neutral-900">
                          {note.createdBy.fullName || note.createdBy.email}
                        </p>
                        <p className="text-xs font-normal text-neutral-400">
                          {format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(note)}
                        className="h-7 w-7 p-0 text-neutral-400 hover:text-neutral-600"
                      >
                        <Edit01Icon variant="stroke" className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(note.id)}
                        className="h-7 w-7 p-0 text-neutral-400 hover:text-red-600"
                      >
                        <Delete01Icon variant="stroke" className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm font-normal text-neutral-700 whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
