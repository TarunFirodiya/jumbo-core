/**
 * Automation Engine — Integration Tests
 * S1.5-001: Event & Action Engine
 *
 * These tests run against the real database (requires DATABASE_URL).
 * They verify the full dispatch pipeline: event → trigger match → action execution.
 */

// NOTE: .env.local is loaded by vitest.config.ts before tests run

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import * as automationService from "@/services/automation.service";
import * as notificationService from "@/services/notification.service";

// ============================================
// TEST SETUP
// ============================================

let client: ReturnType<typeof postgres>;
let testDb: ReturnType<typeof drizzle>;

// Track created IDs for cleanup
const createdTriggerIds: string[] = [];
const createdTeamIds: string[] = [];
const createdContactIds: string[] = [];
const createdLeadIds: string[] = [];
const createdTaskIds: string[] = [];
const createdNotificationIds: string[] = [];

beforeAll(async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL must be set for integration tests");
  }

  client = postgres(connectionString, { prepare: false, max: 5 });
  testDb = drizzle(client, { schema });
});

afterAll(async () => {
  // Cleanup: remove test data in reverse order of dependencies
  try {
    // 1. Clean up execution logs (depends on triggers + actions)
    for (const triggerId of createdTriggerIds) {
      await testDb
        .delete(schema.automationExecutionLogs)
        .where(eq(schema.automationExecutionLogs.triggerId, triggerId));
    }

    // 2. Clean up actions (depends on triggers)
    for (const triggerId of createdTriggerIds) {
      await testDb
        .delete(schema.automationActions)
        .where(eq(schema.automationActions.triggerId, triggerId));
    }

    // 3. Clean up triggers
    for (const triggerId of createdTriggerIds) {
      await testDb
        .delete(schema.automationTriggers)
        .where(eq(schema.automationTriggers.id, triggerId));
    }

    // 4. Clean up all notifications for test users (depends on team)
    for (const teamId of createdTeamIds) {
      await testDb
        .delete(schema.notifications)
        .where(eq(schema.notifications.userId, teamId));
    }
    // Also clean tracked notification IDs
    for (const id of createdNotificationIds) {
      await testDb.delete(schema.notifications).where(eq(schema.notifications.id, id)).catch(() => {});
    }

    // 5. Clean up tasks created by automation (depends on leads + team)
    await testDb
      .delete(schema.tasks)
      .where(sql`${schema.tasks.title} LIKE 'TEST_AUTO_%'`);

    // 6. Clean up leads (depends on contacts + team)
    for (const leadId of createdLeadIds) {
      await testDb.delete(schema.leads).where(eq(schema.leads.id, leadId));
    }

    // 7. Clean up contacts
    for (const contactId of createdContactIds) {
      await testDb.delete(schema.contacts).where(eq(schema.contacts.id, contactId));
    }

    // 8. Clean up team members (last - everything else depends on this)
    for (const teamId of createdTeamIds) {
      await testDb.delete(schema.team).where(eq(schema.team.id, teamId));
    }
  } catch (error) {
    console.error("Cleanup error:", error);
  }

  await client.end();
});

// ============================================
// HELPERS
// ============================================

/** Create test team members for round-robin assignment */
async function createTestAgents(count: number): Promise<schema.TeamMember[]> {
  const agents: schema.TeamMember[] = [];

  for (let i = 0; i < count; i++) {
    const phone = `+91 99999 ${Date.now().toString().slice(-5)}${i}`;
    const [agent] = await testDb
      .insert(schema.team)
      .values({
        fullName: `TEST_AUTO_Agent_${i}`,
        phone,
        email: `test_auto_agent_${Date.now()}_${i}@test.com`,
        role: "buyer_agent",
      })
      .returning();
    agents.push(agent);
    createdTeamIds.push(agent.id);
  }

  return agents;
}

/** Create a test contact */
async function createTestContact(name: string): Promise<schema.Contact> {
  const phone = `+91 88888 ${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 100)}`;
  const [contact] = await testDb
    .insert(schema.contacts)
    .values({ phone, name, type: "customer" })
    .returning();
  createdContactIds.push(contact.id);
  return contact;
}

/** Create a test lead */
async function createTestLead(
  contactId: string,
  agentId?: string
): Promise<schema.Lead> {
  const [lead] = await testDb
    .insert(schema.leads)
    .values({
      contactId,
      status: "new",
      source: "test",
      assignedAgentId: agentId ?? null,
    })
    .returning();
  createdLeadIds.push(lead.id);
  return lead;
}

// ============================================
// UNIT TESTS: Condition Matching
// ============================================

describe("matchesCondition", () => {
  it("should match when condition is null", () => {
    expect(automationService.matchesCondition(null, { status: "new" })).toBe(true);
  });

  it("should match when condition is empty object", () => {
    expect(automationService.matchesCondition({}, { status: "new" })).toBe(true);
  });

  it("should match when all conditions match the payload", () => {
    const condition = { status: "new", source: "housing.com" };
    const payload = { status: "new", source: "housing.com", name: "John" };
    expect(automationService.matchesCondition(condition, payload)).toBe(true);
  });

  it("should not match when a condition does not match", () => {
    const condition = { status: "new", source: "99acres" };
    const payload = { status: "new", source: "housing.com" };
    expect(automationService.matchesCondition(condition, payload)).toBe(false);
  });

  it("should not match when a condition key is missing from payload", () => {
    const condition = { status: "new", source: "housing.com" };
    const payload = { status: "new" };
    expect(automationService.matchesCondition(condition, payload)).toBe(false);
  });

  it("should match nested values using dot notation", () => {
    const condition = { "lead.status": "new" };
    const payload = { lead: { status: "new", name: "Test" } };
    expect(automationService.matchesCondition(condition, payload)).toBe(true);
  });
});

// ============================================
// UNIT TESTS: Template Resolution
// ============================================

describe("resolveTemplate", () => {
  it("should resolve simple placeholders", () => {
    const template = { title: "Qualify {{lead_name}}" };
    const payload = { lead_name: "John Doe" };
    const result = automationService.resolveTemplate(template, payload);
    expect(result.title).toBe("Qualify John Doe");
  });

  it("should resolve nested placeholders", () => {
    const template = { title: "Follow up with {{lead.contact.name}}" };
    const payload = { lead: { contact: { name: "Jane" } } };
    const result = automationService.resolveTemplate(template, payload);
    expect(result.title).toBe("Follow up with Jane");
  });

  it("should leave unresolved placeholders as-is", () => {
    const template = { title: "Task for {{missing_field}}" };
    const payload = { other: "value" };
    const result = automationService.resolveTemplate(template, payload);
    expect(result.title).toBe("Task for {{missing_field}}");
  });

  it("should handle null template", () => {
    const result = automationService.resolveTemplate(null, { name: "John" });
    expect(result).toEqual({});
  });

  it("should pass through non-string values", () => {
    const template = { title: "Test", priority: 5, active: true };
    const payload = {};
    const result = automationService.resolveTemplate(template, payload);
    expect(result.priority).toBe(5);
    expect(result.active).toBe(true);
  });

  it("should resolve nested template objects", () => {
    const template = {
      body: {
        message: "Hello {{name}}",
        nested: { field: "Value for {{id}}" },
      },
    };
    const payload = { name: "World", id: "123" };
    const result = automationService.resolveTemplate(template, payload);
    expect((result.body as Record<string, unknown>).message).toBe("Hello World");
    expect(
      ((result.body as Record<string, unknown>).nested as Record<string, unknown>).field
    ).toBe("Value for 123");
  });
});

// ============================================
// INTEGRATION TESTS: Trigger & Action CRUD
// ============================================

describe("Trigger & Action CRUD", () => {
  it("should create a trigger with actions", async () => {
    const trigger = await automationService.createTrigger({
      name: "TEST_AUTO_Trigger_CRUD",
      eventType: "test_event",
      conditionJson: { status: "new" },
    });

    createdTriggerIds.push(trigger.id);

    expect(trigger.id).toBeDefined();
    expect(trigger.name).toBe("TEST_AUTO_Trigger_CRUD");
    expect(trigger.eventType).toBe("test_event");
    expect(trigger.isActive).toBe(true);

    const action = await automationService.addAction({
      triggerId: trigger.id,
      actionType: "create_task",
      payloadTemplate: { title: "Test Task" },
      executionOrder: 1,
    });

    expect(action.id).toBeDefined();
    expect(action.triggerId).toBe(trigger.id);
    expect(action.actionType).toBe("create_task");
  });

  it("should fetch trigger with ordered actions", async () => {
    const trigger = await automationService.createTrigger({
      name: "TEST_AUTO_Trigger_Ordered",
      eventType: "test_ordered",
    });
    createdTriggerIds.push(trigger.id);

    await automationService.addAction({
      triggerId: trigger.id,
      actionType: "create_task",
      executionOrder: 2,
    });
    await automationService.addAction({
      triggerId: trigger.id,
      actionType: "assign_agent",
      executionOrder: 1,
    });

    const fetched = await automationService.getTriggerById(trigger.id);
    expect(fetched).not.toBeNull();
    expect(fetched!.actions).toHaveLength(2);
    // Should be ordered by executionOrder
    expect(fetched!.actions[0].actionType).toBe("assign_agent");
    expect(fetched!.actions[1].actionType).toBe("create_task");
  });

  it("should deactivate a trigger", async () => {
    const trigger = await automationService.createTrigger({
      name: "TEST_AUTO_Trigger_Deactivate",
      eventType: "test_deactivate",
    });
    createdTriggerIds.push(trigger.id);

    await automationService.deactivateTrigger(trigger.id);

    // Should not appear in active triggers
    const triggers = await automationService.getTriggersForEvent("test_deactivate");
    const found = triggers.find((t) => t.id === trigger.id);
    expect(found).toBeUndefined();
  });
});

// ============================================
// INTEGRATION TESTS: Event Dispatch
// ============================================

describe("dispatch — create_task action", () => {
  it("should create a task when dispatching a matching event", async () => {
    // Setup: create trigger + action
    const trigger = await automationService.createTrigger({
      name: "TEST_AUTO_CreateTask_Dispatch",
      eventType: "test_create_task",
      conditionJson: { status: "new" },
    });
    createdTriggerIds.push(trigger.id);

    await automationService.addAction({
      triggerId: trigger.id,
      actionType: "create_task",
      payloadTemplate: {
        title: "TEST_AUTO_Qualify Lead",
        description: "Auto-generated qualification task",
        priority: "high",
        due_in_days: 2,
      },
      executionOrder: 1,
    });

    // Create test data
    const agents = await createTestAgents(1);
    const contact = await createTestContact("Test Buyer");
    const lead = await createTestLead(contact.id, agents[0].id);

    // Dispatch
    const result = await automationService.dispatch({
      eventType: "test_create_task",
      payload: {
        status: "new",
        lead_id: lead.id,
        lead_name: contact.name,
      },
    });

    expect(result.triggersMatched).toBe(1);
    expect(result.actionsExecuted).toBe(1);
    expect(result.results[0].status).toBe("success");
    expect(result.results[0].result?.title).toBe("TEST_AUTO_Qualify Lead");

    // Verify task was created
    const taskId = result.results[0].result?.taskId as string;
    expect(taskId).toBeDefined();

    // Verify notification was created for the assignee
    const userNotifications = await notificationService.getNotificationsByUserId(agents[0].id, {
      unreadOnly: true,
    });
    const autoNotification = userNotifications.find(
      (n) => n.metadata && (n.metadata as Record<string, unknown>).taskId === taskId
    );
    expect(autoNotification).toBeDefined();
    expect(autoNotification!.title).toBe("New Task Assigned");

    // Track for cleanup
    if (autoNotification) createdNotificationIds.push(autoNotification.id);
  });

  it("should NOT create a task when conditions do not match", async () => {
    const trigger = await automationService.createTrigger({
      name: "TEST_AUTO_NoMatch",
      eventType: "test_no_match",
      conditionJson: { status: "contacted" },
    });
    createdTriggerIds.push(trigger.id);

    await automationService.addAction({
      triggerId: trigger.id,
      actionType: "create_task",
      payloadTemplate: { title: "TEST_AUTO_Should Not Exist" },
    });

    const result = await automationService.dispatch({
      eventType: "test_no_match",
      payload: { status: "new" }, // Does not match "contacted"
    });

    expect(result.triggersMatched).toBe(0);
    expect(result.actionsExecuted).toBe(0);
  });
});

describe("dispatch — assign_agent action", () => {
  it("should assign an agent via round-robin and then create a task", async () => {
    // Create 3 agents for round-robin
    const agents = await createTestAgents(3);
    const contact = await createTestContact("RoundRobin Buyer");
    const lead = await createTestLead(contact.id); // No agent assigned yet

    // Setup trigger: assign_agent (order 1) then create_task (order 2)
    const trigger = await automationService.createTrigger({
      name: "TEST_AUTO_AssignAndTask",
      eventType: "test_assign_and_task",
    });
    createdTriggerIds.push(trigger.id);

    await automationService.addAction({
      triggerId: trigger.id,
      actionType: "assign_agent",
      executionOrder: 1,
    });
    await automationService.addAction({
      triggerId: trigger.id,
      actionType: "create_task",
      payloadTemplate: {
        title: "TEST_AUTO_Qualify lead after assignment",
        priority: "high",
        due_in_days: 1,
      },
      executionOrder: 2,
    });

    // Dispatch
    const result = await automationService.dispatch({
      eventType: "test_assign_and_task",
      payload: { lead_id: lead.id },
    });

    expect(result.triggersMatched).toBe(1);
    expect(result.actionsExecuted).toBe(2);

    // Verify assign_agent succeeded
    const assignResult = result.results.find((r) => r.actionType === "assign_agent");
    expect(assignResult?.status).toBe("success");
    expect(assignResult?.result?.assignedAgentId).toBeDefined();

    // Verify create_task succeeded
    const taskResult = result.results.find((r) => r.actionType === "create_task");
    expect(taskResult?.status).toBe("success");

    // Verify the lead now has an assigned agent
    const { getLeadById } = await import("@/services/lead.service");
    const updatedLead = await getLeadById(lead.id);
    expect(updatedLead?.assignedAgentId).toBeDefined();

    // Verify execution logs exist
    const logs = await automationService.getExecutionLogs(trigger.id);
    expect(logs.length).toBeGreaterThanOrEqual(2);
  });
});

describe("dispatch — webhook_call action", () => {
  it("should fail gracefully when webhook URL is invalid", async () => {
    const trigger = await automationService.createTrigger({
      name: "TEST_AUTO_WebhookFail",
      eventType: "test_webhook_fail",
    });
    createdTriggerIds.push(trigger.id);

    await automationService.addAction({
      triggerId: trigger.id,
      actionType: "webhook_call",
      payloadTemplate: {
        url: "http://localhost:99999/nonexistent",
        body: { event: "test" },
      },
    });

    const result = await automationService.dispatch({
      eventType: "test_webhook_fail",
      payload: {},
    });

    expect(result.actionsExecuted).toBe(1);
    expect(result.results[0].status).toBe("failed");
    expect(result.results[0].error).toBeDefined();
  });

  it("should fail when webhook URL is missing from template", async () => {
    const trigger = await automationService.createTrigger({
      name: "TEST_AUTO_WebhookNoURL",
      eventType: "test_webhook_no_url",
    });
    createdTriggerIds.push(trigger.id);

    await automationService.addAction({
      triggerId: trigger.id,
      actionType: "webhook_call",
      payloadTemplate: { body: { data: "test" } }, // No URL
    });

    const result = await automationService.dispatch({
      eventType: "test_webhook_no_url",
      payload: {},
    });

    expect(result.results[0].status).toBe("failed");
    expect(result.results[0].error).toContain("requires 'url'");
  });
});

// ============================================
// INTEGRATION TESTS: Full E2E Scenarios
// ============================================

describe("Full Scenario: New Lead → Assign Agent → Create Qualify Task", () => {
  it("should execute the complete lead_created workflow", async () => {
    // Create agents
    const agents = await createTestAgents(2);
    const contact = await createTestContact("New Buyer Lead");
    const lead = await createTestLead(contact.id); // unassigned

    // Setup: Rule 1 from requirements
    const trigger = await automationService.createTrigger({
      name: "TEST_AUTO_NewLead_FullFlow",
      eventType: "lead_created",
      conditionJson: { status: "new" },
    });
    createdTriggerIds.push(trigger.id);

    await automationService.addAction({
      triggerId: trigger.id,
      actionType: "assign_agent",
      executionOrder: 1,
    });
    await automationService.addAction({
      triggerId: trigger.id,
      actionType: "create_task",
      payloadTemplate: {
        title: "TEST_AUTO_Qualify new lead: {{lead_name}}",
        description: "Contact the lead within 24 hours and qualify their requirements",
        priority: "high",
        due_in_days: 1,
      },
      executionOrder: 2,
    });

    // Dispatch
    const result = await automationService.dispatch({
      eventType: "lead_created",
      payload: {
        status: "new",
        lead_id: lead.id,
        lead_name: contact.name,
        source: "housing.com",
      },
    });

    // Assertions
    expect(result.triggersMatched).toBe(1);
    expect(result.actionsExecuted).toBe(2);

    // Agent was assigned
    const assignResult = result.results[0];
    expect(assignResult.actionType).toBe("assign_agent");
    expect(assignResult.status).toBe("success");

    // Task was created with resolved template
    const taskResult = result.results[1];
    expect(taskResult.actionType).toBe("create_task");
    expect(taskResult.status).toBe("success");
    expect(taskResult.result?.title).toBe(`TEST_AUTO_Qualify new lead: ${contact.name}`);
  });
});

describe("Full Scenario: Visit Completed → Create Feedback Task", () => {
  it("should execute the visit_completed workflow", async () => {
    const agents = await createTestAgents(1);
    const contact = await createTestContact("Visit Buyer");
    const lead = await createTestLead(contact.id, agents[0].id);

    // Setup: Rule 2 from requirements
    const trigger = await automationService.createTrigger({
      name: "TEST_AUTO_VisitCompleted_Feedback",
      eventType: "visit_completed",
    });
    createdTriggerIds.push(trigger.id);

    await automationService.addAction({
      triggerId: trigger.id,
      actionType: "create_task",
      payloadTemplate: {
        title: "TEST_AUTO_Collect feedback for visit",
        description: "Call the buyer and collect feedback on the property visited",
        priority: "medium",
        due_in_days: 1,
      },
      executionOrder: 1,
    });

    // Dispatch
    const result = await automationService.dispatch({
      eventType: "visit_completed",
      payload: {
        lead_id: lead.id,
        visit_id: "fake-visit-id",
        listing_id: "fake-listing-id",
      },
    });

    expect(result.triggersMatched).toBe(1);
    expect(result.actionsExecuted).toBe(1);
    expect(result.results[0].status).toBe("success");
    expect(result.results[0].result?.title).toBe("TEST_AUTO_Collect feedback for visit");

    // Verify notification was sent to the agent
    const notifications = await notificationService.getNotificationsByUserId(agents[0].id, {
      unreadOnly: true,
    });
    const feedbackNotification = notifications.find((n) =>
      n.message.includes("TEST_AUTO_Collect feedback")
    );
    expect(feedbackNotification).toBeDefined();
    if (feedbackNotification) createdNotificationIds.push(feedbackNotification.id);
  });
});

// ============================================
// INTEGRATION TESTS: Multiple triggers on same event
// ============================================

describe("Multiple triggers on same event", () => {
  it("should execute all matching triggers", async () => {
    const agents = await createTestAgents(1);
    const contact = await createTestContact("Multi Trigger Buyer");
    const lead = await createTestLead(contact.id, agents[0].id);

    // Trigger 1: matches status=new
    const trigger1 = await automationService.createTrigger({
      name: "TEST_AUTO_Multi_1",
      eventType: "test_multi_trigger",
      conditionJson: { status: "new" },
    });
    createdTriggerIds.push(trigger1.id);

    await automationService.addAction({
      triggerId: trigger1.id,
      actionType: "create_task",
      payloadTemplate: { title: "TEST_AUTO_Task from trigger 1" },
    });

    // Trigger 2: matches source=website
    const trigger2 = await automationService.createTrigger({
      name: "TEST_AUTO_Multi_2",
      eventType: "test_multi_trigger",
      conditionJson: { source: "website" },
    });
    createdTriggerIds.push(trigger2.id);

    await automationService.addAction({
      triggerId: trigger2.id,
      actionType: "create_task",
      payloadTemplate: { title: "TEST_AUTO_Task from trigger 2" },
    });

    // Dispatch — matches both triggers
    const result = await automationService.dispatch({
      eventType: "test_multi_trigger",
      payload: {
        status: "new",
        source: "website",
        lead_id: lead.id,
      },
    });

    expect(result.triggersMatched).toBe(2);
    expect(result.actionsExecuted).toBe(2);
    expect(result.results.every((r) => r.status === "success")).toBe(true);
  });
});

// ============================================
// INTEGRATION TESTS: Notification Service
// ============================================

describe("Notification Service", () => {
  it("should create, read, and mark notifications as read", async () => {
    const agents = await createTestAgents(1);
    const userId = agents[0].id;

    // Create
    const notification = await notificationService.createNotification({
      userId,
      title: "Test Notification",
      message: "TEST_AUTO_You have a new task",
      link: "/buyers/test-123",
    });
    createdNotificationIds.push(notification.id);

    expect(notification.isRead).toBe(false);
    expect(notification.title).toBe("Test Notification");

    // Get unread count
    const count = await notificationService.getUnreadCount(userId);
    expect(count).toBeGreaterThanOrEqual(1);

    // Mark as read
    const updated = await notificationService.markAsRead(notification.id);
    expect(updated.isRead).toBe(true);
    expect(updated.readAt).toBeDefined();
  });

  it("should mark all notifications as read", async () => {
    const agents = await createTestAgents(1);
    const userId = agents[0].id;

    // Create 3 notifications
    for (let i = 0; i < 3; i++) {
      const n = await notificationService.createNotification({
        userId,
        title: `Notification ${i}`,
        message: `TEST_AUTO_Message ${i}`,
      });
      createdNotificationIds.push(n.id);
    }

    await notificationService.markAllAsRead(userId);

    const unread = await notificationService.getUnreadCount(userId);
    expect(unread).toBe(0);
  });
});
