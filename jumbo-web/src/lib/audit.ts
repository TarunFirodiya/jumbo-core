import { db } from "@/lib/db";
import { auditLogs, type AuditAction } from "@/lib/db/schema";

/**
 * Computes the changes between an old and new object, returning only fields that differ.
 */
export function computeChanges<T extends Record<string, unknown>>(
  oldData: T | null,
  newData: T
): Record<string, { old: unknown; new: unknown }> | null {
  const changes: Record<string, { old: unknown; new: unknown }> = {};

  if (!oldData) {
    // For create actions, all fields are "new"
    for (const key of Object.keys(newData)) {
      if (newData[key] !== undefined && newData[key] !== null) {
        changes[key] = { old: null, new: newData[key] };
      }
    }
  } else {
    // For update actions, only include changed fields
    for (const key of Object.keys(newData)) {
      const oldValue = oldData[key];
      const newValue = newData[key];

      // Skip if values are the same
      if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
        continue;
      }

      changes[key] = { old: oldValue ?? null, new: newValue ?? null };
    }
  }

  return Object.keys(changes).length > 0 ? changes : null;
}

/**
 * Logs an activity to the audit_logs table.
 */
export async function logActivity({
  entityType,
  entityId,
  action,
  changes,
  performedById,
}: {
  entityType: string;
  entityId: string;
  action: AuditAction;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  performedById?: string | null;
}): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      entityType,
      entityId,
      action,
      changes,
      performedById: performedById ?? null,
    });
  } catch (error) {
    console.error("Failed to log audit activity:", error);
    // Don't throw - audit logging should not break the main operation
  }
}

/**
 * Fetches audit logs for a specific entity.
 */
export async function getAuditLogs({
  entityType,
  entityId,
  limit = 50,
}: {
  entityType: string;
  entityId: string;
  limit?: number;
}) {
  return db.query.auditLogs.findMany({
    where: (logs, { eq, and }) =>
      and(eq(logs.entityType, entityType), eq(logs.entityId, entityId)),
    with: {
      performedBy: true,
    },
    orderBy: (logs, { desc }) => [desc(logs.createdAt)],
    limit,
  });
}

