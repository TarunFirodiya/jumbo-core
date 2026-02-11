/**
 * Notification Service
 * Handles in-app notifications (bell icon).
 * Created as part of the Automation Engine (S1.5-001).
 */

import { db } from "@/lib/db";
import {
  notifications,
  type Notification,
  type NewNotification,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Create a notification
 */
export async function createNotification(data: {
  userId: string;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}): Promise<Notification> {
  const [notification] = await db
    .insert(notifications)
    .values({
      userId: data.userId,
      title: data.title,
      message: data.message,
      link: data.link ?? null,
      metadata: data.metadata ?? null,
      isRead: false,
    })
    .returning();

  return notification;
}

/**
 * Get notifications for a user
 */
export async function getNotificationsByUserId(
  userId: string,
  options: { limit?: number; unreadOnly?: boolean } = {}
): Promise<Notification[]> {
  const { limit = 50, unreadOnly = false } = options;

  const conditions = [eq(notifications.userId, userId)];
  if (unreadOnly) {
    conditions.push(eq(notifications.isRead, false));
  }

  return db.query.notifications.findMany({
    where: and(...conditions),
    orderBy: [desc(notifications.createdAt)],
    limit,
  });
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const unread = await db.query.notifications.findMany({
    where: and(
      eq(notifications.userId, userId),
      eq(notifications.isRead, false)
    ),
    columns: { id: true },
  });

  return unread.length;
}

/**
 * Mark a notification as read
 */
export async function markAsRead(id: string): Promise<Notification> {
  const [updated] = await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(eq(notifications.id, id))
    .returning();

  return updated;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      )
    );
}

/**
 * Delete a notification
 */
export async function deleteNotification(id: string): Promise<void> {
  await db.delete(notifications).where(eq(notifications.id, id));
}
