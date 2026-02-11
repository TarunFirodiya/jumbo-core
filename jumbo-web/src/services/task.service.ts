/**
 * Task Service
 * Handles database operations for tasks related to buyer leads and seller leads
 */

import { db } from "@/lib/db";
import { tasks, type NewTask, type Task } from "@/lib/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";

/**
 * Get tasks by lead ID
 */
export async function getTasksByLeadId(leadId: string) {
  return db.query.tasks.findMany({
    where: and(eq(tasks.relatedLeadId, leadId), isNull(tasks.deletedAt)),
    with: {
      creator: true,
      assignee: true,
    },
    orderBy: [desc(tasks.createdAt)],
  });
}

/**
 * Get tasks by seller lead ID
 */
export async function getTasksBySellerLeadId(sellerLeadId: string) {
  return db.query.tasks.findMany({
    where: and(eq(tasks.sellerLeadId, sellerLeadId), isNull(tasks.deletedAt)),
    with: {
      creator: true,
      assignee: true,
    },
    orderBy: [desc(tasks.createdAt)],
  });
}

/**
 * Get tasks by listing ID
 */
export async function getTasksByListingId(listingId: string) {
  return db.query.tasks.findMany({
    where: and(eq(tasks.listingId, listingId), isNull(tasks.deletedAt)),
    with: {
      creator: true,
      assignee: true,
    },
    orderBy: [desc(tasks.createdAt)],
  });
}

/**
 * Create a task
 */
export async function createTask(data: {
  title: string;
  description?: string;
  priority?: string;
  dueAt?: Date;
  assigneeId?: string;
  relatedLeadId?: string;
  sellerLeadId?: string;
  listingId?: string;
  creatorId?: string;
}): Promise<Task> {
  const [task] = await db
    .insert(tasks)
    .values({
      title: data.title,
      description: data.description ?? null,
      priority: data.priority ?? "medium",
      dueAt: data.dueAt ?? null,
      assigneeId: data.assigneeId ?? null,
      relatedLeadId: data.relatedLeadId ?? null,
      sellerLeadId: data.sellerLeadId ?? null,
      listingId: data.listingId ?? null,
      creatorId: data.creatorId ?? null,
      status: "open",
    })
    .returning();

  return task;
}

/**
 * Update task status
 */
export async function updateTaskStatus(
  id: string,
  status: string
): Promise<Task> {
  const updates: Partial<NewTask> = {
    status,
    updatedAt: new Date(),
  };

  if (status === "completed") {
    updates.completedAt = new Date();
  }

  const [updated] = await db
    .update(tasks)
    .set(updates)
    .where(eq(tasks.id, id))
    .returning();

  return updated;
}
