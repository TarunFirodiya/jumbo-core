/**
 * Automation Service
 * Event-driven engine that reacts to CRM events and executes actions.
 *
 * Events: lead_created, lead_status_changed, visit_completed
 * Actions: assign_agent, create_task, webhook_call
 */

import { db } from "@/lib/db";
import {
  automationTriggers,
  automationActions,
  automationExecutionLogs,
  type AutomationTrigger,
  type AutomationAction,
  type AutomationExecutionLog,
} from "@/lib/db/schema";
import { eq, and, isNull, asc } from "drizzle-orm";
import * as taskService from "./task.service";
import * as notificationService from "./notification.service";
import * as leadService from "./lead.service";

// ============================================
// TYPES
// ============================================

/** Payload passed to the dispatch engine */
export interface AutomationEvent {
  eventType: string;
  payload: Record<string, unknown>;
}

/** Result of a single action execution */
export interface ActionResult {
  actionId: string;
  actionType: string;
  status: "success" | "failed";
  result?: Record<string, unknown>;
  error?: string;
}

/** Full dispatch result */
export interface DispatchResult {
  eventType: string;
  triggersMatched: number;
  actionsExecuted: number;
  results: ActionResult[];
}

// ============================================
// TRIGGER MANAGEMENT
// ============================================

/**
 * Create an automation trigger
 */
export async function createTrigger(data: {
  name: string;
  description?: string;
  eventType: string;
  conditionJson?: Record<string, unknown>;
  createdById?: string;
}): Promise<AutomationTrigger> {
  const [trigger] = await db
    .insert(automationTriggers)
    .values({
      name: data.name,
      description: data.description ?? null,
      eventType: data.eventType,
      conditionJson: data.conditionJson ?? null,
      isActive: true,
      createdById: data.createdById ?? null,
    })
    .returning();

  return trigger;
}

/**
 * Add an action to a trigger
 */
export async function addAction(data: {
  triggerId: string;
  actionType: string;
  payloadTemplate?: Record<string, unknown>;
  executionOrder?: number;
}): Promise<AutomationAction> {
  const [action] = await db
    .insert(automationActions)
    .values({
      triggerId: data.triggerId,
      actionType: data.actionType,
      payloadTemplate: data.payloadTemplate ?? null,
      executionOrder: data.executionOrder ?? 0,
      isActive: true,
    })
    .returning();

  return action;
}

/**
 * Get all active triggers for a given event type
 */
export async function getTriggersForEvent(
  eventType: string
): Promise<(AutomationTrigger & { actions: AutomationAction[] })[]> {
  const triggers = await db.query.automationTriggers.findMany({
    where: and(
      eq(automationTriggers.eventType, eventType),
      eq(automationTriggers.isActive, true),
      isNull(automationTriggers.deletedAt)
    ),
    with: {
      actions: {
        where: eq(automationActions.isActive, true),
        orderBy: [asc(automationActions.executionOrder)],
      },
    },
  });

  return triggers;
}

/**
 * Get trigger by ID
 */
export async function getTriggerById(
  id: string
): Promise<(AutomationTrigger & { actions: AutomationAction[] }) | null> {
  const trigger = await db.query.automationTriggers.findFirst({
    where: and(
      eq(automationTriggers.id, id),
      isNull(automationTriggers.deletedAt)
    ),
    with: {
      actions: {
        orderBy: [asc(automationActions.executionOrder)],
      },
    },
  });

  return trigger ?? null;
}

// ============================================
// CONDITION MATCHING
// ============================================

/**
 * Check if event payload matches the trigger's condition_json.
 * Supports flat key-value matching on the payload. All condition keys
 * must match (AND logic). Null/undefined conditions match everything.
 */
export function matchesCondition(
  conditionJson: Record<string, unknown> | null | undefined,
  payload: Record<string, unknown>
): boolean {
  if (!conditionJson || Object.keys(conditionJson).length === 0) {
    return true; // No condition = always matches
  }

  for (const [key, expectedValue] of Object.entries(conditionJson)) {
    const actualValue = getNestedValue(payload, key);

    // Support array "includes" matching: condition value in payload array
    if (Array.isArray(actualValue)) {
      if (!actualValue.includes(expectedValue)) return false;
    } else if (actualValue !== expectedValue) {
      return false;
    }
  }

  return true;
}

/**
 * Get a nested value from an object using dot notation.
 * e.g. getNestedValue({ lead: { status: "new" } }, "lead.status") => "new"
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in (current as Record<string, unknown>)) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

// ============================================
// TEMPLATE RESOLUTION
// ============================================

/**
 * Resolve {{placeholder}} values in a payload template.
 * e.g. { "title": "Qualify {{lead.name}}" } with payload { lead: { name: "John" } }
 *      => { "title": "Qualify John" }
 */
export function resolveTemplate(
  template: Record<string, unknown> | null | undefined,
  payload: Record<string, unknown>
): Record<string, unknown> {
  if (!template) return {};

  const resolved: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(template)) {
    if (typeof value === "string") {
      resolved[key] = value.replace(/\{\{([^}]+)\}\}/g, (_match, path: string) => {
        const resolved = getNestedValue(payload, path.trim());
        return resolved !== undefined ? String(resolved) : `{{${path.trim()}}}`;
      });
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      resolved[key] = resolveTemplate(value as Record<string, unknown>, payload);
    } else {
      resolved[key] = value;
    }
  }

  return resolved;
}

// ============================================
// ACTION HANDLERS
// ============================================

/**
 * Handle assign_agent action.
 * Uses round-robin assignment based on least assigned leads.
 */
async function handleAssignAgent(
  payload: Record<string, unknown>,
  _resolvedTemplate: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const leadId = payload.lead_id as string | undefined;

  if (!leadId) {
    throw new Error("assign_agent requires lead_id in payload");
  }

  const assignedAgentId = await leadService.assignLeadRoundRobin(leadId);

  if (!assignedAgentId) {
    throw new Error("No available agents for round-robin assignment");
  }

  return { assignedAgentId, leadId };
}

/**
 * Handle create_task action.
 * Creates a task and a notification for the assignee.
 */
async function handleCreateTask(
  payload: Record<string, unknown>,
  resolvedTemplate: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const title = (resolvedTemplate.title as string) || "Automated Task";
  const description = resolvedTemplate.description as string | undefined;
  const priority = (resolvedTemplate.priority as string) || "medium";

  // Determine assignee: from template, from lead's assigned agent, or from payload
  let assigneeId = resolvedTemplate.assignee_id as string | undefined;

  if (!assigneeId) {
    // Try to get the assigned agent from the lead
    const leadId = payload.lead_id as string | undefined;
    if (leadId) {
      const lead = await leadService.getLeadById(leadId);
      assigneeId = lead?.assignedAgentId ?? undefined;
    }
  }

  // Determine related entity
  const relatedLeadId = payload.lead_id as string | undefined;
  const sellerLeadId = payload.seller_lead_id as string | undefined;

  // Calculate due date if specified in template
  let dueAt: Date | undefined;
  const dueDays = resolvedTemplate.due_in_days as number | undefined;
  if (dueDays) {
    dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + dueDays);
  }

  const task = await taskService.createTask({
    title,
    description,
    priority,
    assigneeId: assigneeId ?? undefined,
    relatedLeadId: relatedLeadId ?? undefined,
    sellerLeadId: sellerLeadId ?? undefined,
    dueAt,
    creatorId: undefined, // System-created
  });

  // Create notification for the assignee
  if (assigneeId) {
    const link = relatedLeadId
      ? `/buyers/${relatedLeadId}`
      : sellerLeadId
        ? `/sellers/${sellerLeadId}`
        : undefined;

    await notificationService.createNotification({
      userId: assigneeId,
      title: "New Task Assigned",
      message: `You have a new task: ${title}`,
      link,
      metadata: { taskId: task.id, automationGenerated: true },
    });
  }

  return { taskId: task.id, assigneeId, title };
}

/**
 * Handle webhook_call action.
 * POSTs payload to an external URL (e.g. Kapso/Voice AI).
 */
async function handleWebhookCall(
  payload: Record<string, unknown>,
  resolvedTemplate: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const url = resolvedTemplate.url as string;

  if (!url) {
    throw new Error("webhook_call requires 'url' in payload_template");
  }

  const method = (resolvedTemplate.method as string) || "POST";
  const headers = (resolvedTemplate.headers as Record<string, string>) || {
    "Content-Type": "application/json",
  };
  const body = resolvedTemplate.body
    ? resolvedTemplate.body
    : payload;

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(body),
    });

    const responseStatus = response.status;
    let responseBody: unknown;
    try {
      responseBody = await response.json();
    } catch {
      responseBody = await response.text();
    }

    if (!response.ok) {
      throw new Error(`Webhook returned ${responseStatus}: ${JSON.stringify(responseBody)}`);
    }

    return {
      statusCode: responseStatus,
      response: responseBody,
    };
  } catch (error) {
    throw new Error(
      `Webhook call to ${url} failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// ============================================
// ACTION DISPATCHER
// ============================================

/** Registry of action handlers */
const ACTION_HANDLERS: Record<
  string,
  (payload: Record<string, unknown>, template: Record<string, unknown>) => Promise<Record<string, unknown>>
> = {
  assign_agent: handleAssignAgent,
  create_task: handleCreateTask,
  webhook_call: handleWebhookCall,
};

/**
 * Execute a single action and log the result.
 */
async function executeAction(
  trigger: AutomationTrigger,
  action: AutomationAction,
  event: AutomationEvent
): Promise<ActionResult> {
  const handler = ACTION_HANDLERS[action.actionType];

  if (!handler) {
    const error = `Unknown action type: ${action.actionType}`;
    await logExecution(trigger.id, action.id, event, action.actionType, "failed", undefined, error);
    return { actionId: action.id, actionType: action.actionType, status: "failed", error };
  }

  try {
    const resolvedTemplate = resolveTemplate(
      action.payloadTemplate as Record<string, unknown> | null,
      event.payload
    );

    const result = await handler(event.payload, resolvedTemplate);

    await logExecution(trigger.id, action.id, event, action.actionType, "success", result);

    return { actionId: action.id, actionType: action.actionType, status: "success", result };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logExecution(trigger.id, action.id, event, action.actionType, "failed", undefined, errorMessage);
    return { actionId: action.id, actionType: action.actionType, status: "failed", error: errorMessage };
  }
}

/**
 * Log an automation execution
 */
async function logExecution(
  triggerId: string,
  actionId: string,
  event: AutomationEvent,
  actionType: string,
  status: string,
  resultJson?: Record<string, unknown>,
  errorMessage?: string
): Promise<AutomationExecutionLog> {
  const [log] = await db
    .insert(automationExecutionLogs)
    .values({
      triggerId,
      actionId,
      eventType: event.eventType,
      eventPayload: event.payload,
      actionType,
      status,
      resultJson: resultJson ?? null,
      errorMessage: errorMessage ?? null,
    })
    .returning();

  return log;
}

// ============================================
// MAIN DISPATCH
// ============================================

/**
 * Dispatch an event through the automation engine.
 *
 * 1. Find all active triggers matching the event type
 * 2. Filter triggers whose conditions match the payload
 * 3. Execute each trigger's actions in order
 * 4. Log all executions
 *
 * @param event - The event type and its payload
 * @returns Dispatch result with execution details
 */
export async function dispatch(event: AutomationEvent): Promise<DispatchResult> {
  const result: DispatchResult = {
    eventType: event.eventType,
    triggersMatched: 0,
    actionsExecuted: 0,
    results: [],
  };

  // 1. Find matching triggers
  const triggers = await getTriggersForEvent(event.eventType);

  // 2. Filter by condition
  const matchingTriggers = triggers.filter((trigger) =>
    matchesCondition(trigger.conditionJson, event.payload)
  );

  result.triggersMatched = matchingTriggers.length;

  // 3. Execute actions in order for each trigger
  for (const trigger of matchingTriggers) {
    for (const action of trigger.actions) {
      const actionResult = await executeAction(trigger, action, event);
      result.results.push(actionResult);
      result.actionsExecuted++;

      // If assign_agent succeeded, refresh the payload so subsequent
      // actions (like create_task) see the assigned agent
      if (
        actionResult.status === "success" &&
        action.actionType === "assign_agent" &&
        actionResult.result?.assignedAgentId
      ) {
        event.payload.assigned_agent_id = actionResult.result.assignedAgentId;
      }
    }
  }

  return result;
}

// ============================================
// QUERY HELPERS
// ============================================

/**
 * Get execution logs for a trigger
 */
export async function getExecutionLogs(triggerId: string): Promise<AutomationExecutionLog[]> {
  return db.query.automationExecutionLogs.findMany({
    where: eq(automationExecutionLogs.triggerId, triggerId),
    orderBy: (logs, { desc }) => [desc(logs.executedAt)],
    limit: 100,
  });
}

/**
 * Get all triggers with their actions
 */
export async function getAllTriggers(): Promise<
  (AutomationTrigger & { actions: AutomationAction[] })[]
> {
  return db.query.automationTriggers.findMany({
    where: isNull(automationTriggers.deletedAt),
    with: {
      actions: {
        orderBy: [asc(automationActions.executionOrder)],
      },
    },
  });
}

/**
 * Deactivate a trigger (soft)
 */
export async function deactivateTrigger(id: string): Promise<void> {
  await db
    .update(automationTriggers)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(automationTriggers.id, id));
}
