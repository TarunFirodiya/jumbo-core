import { test, expect } from "@playwright/test";

/**
 * E2E tests for the Seller Lead Detail Page (/sellers/[id])
 *
 * These tests require an authenticated session and a seeded database
 * with at least one seller lead. Set SELLER_LEAD_ID env var or update
 * the test to use a known ID.
 */

const SELLER_LEAD_ID =
  process.env.SELLER_LEAD_ID || "00000000-0000-0000-0000-000000000000";
const BASE = `/sellers/${SELLER_LEAD_ID}`;

test.describe("Seller Lead Detail Page", () => {
  // ─── Layout & Header ─────────────────────────────────────────

  test("should display seller name and status badge", async ({ page }) => {
    await page.goto(BASE);
    // Header should contain the seller name
    await expect(page.locator("h1")).toBeVisible();
    // Status badge should exist
    await expect(page.getByRole("combobox").first()).toBeVisible();
  });

  test("should have Call and WhatsApp action buttons", async ({ page }) => {
    await page.goto(BASE);
    // WhatsApp link (opens wa.me)
    await expect(page.locator('a[href*="wa.me"]')).toBeVisible();
    // Phone link (tel:)
    await expect(page.locator('a[href^="tel:"]')).toBeVisible();
  });

  test("should show back navigation to /sellers", async ({ page }) => {
    await page.goto(BASE);
    const backLink = page.locator('a[href="/sellers"]').first();
    await expect(backLink).toBeVisible();
  });

  // ─── Tabs ────────────────────────────────────────────────────

  test("should render all five tabs", async ({ page }) => {
    await page.goto(BASE);
    const tabs = ["Activity", "Communication", "Tasks", "Listings", "Notes"];
    for (const tab of tabs) {
      await expect(
        page.getByRole("tab", { name: new RegExp(tab, "i") })
      ).toBeVisible();
    }
  });

  test("should switch between tabs", async ({ page }) => {
    await page.goto(BASE);
    // Click Notes tab
    await page.getByRole("tab", { name: /notes/i }).click();
    // The notes content should be visible (textarea for adding notes)
    await expect(page.getByPlaceholder(/add a note/i)).toBeVisible();

    // Click Tasks tab
    await page.getByRole("tab", { name: /tasks/i }).click();
    // Should see the Add Task button
    await expect(page.getByRole("button", { name: /add task/i })).toBeVisible();
  });

  // ─── Notes Tab ───────────────────────────────────────────────

  test("Notes tab should show textarea and Add Note button", async ({
    page,
  }) => {
    await page.goto(BASE);
    await page.getByRole("tab", { name: /notes/i }).click();
    await expect(page.getByPlaceholder(/add a note/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /add note/i })
    ).toBeVisible();
  });

  // ─── Tasks Tab ───────────────────────────────────────────────

  test("Tasks tab should show Add Task button", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("tab", { name: /tasks/i }).click();
    await expect(page.getByRole("button", { name: /add task/i })).toBeVisible();
  });

  test("Add Task dialog should have title, priority, due date, and assignee fields", async ({
    page,
  }) => {
    await page.goto(BASE);
    await page.getByRole("tab", { name: /tasks/i }).click();
    await page.getByRole("button", { name: /add task/i }).click();

    // Dialog should open
    await expect(page.getByRole("dialog")).toBeVisible();
    // Title input
    await expect(page.getByPlaceholder(/task title/i)).toBeVisible();
    // Priority select
    await expect(page.getByText(/priority/i).first()).toBeVisible();
    // Due date picker (DateTimePicker, not native input)
    await expect(page.getByText(/due date/i)).toBeVisible();
    // Assignee select
    await expect(page.getByText(/assignee/i)).toBeVisible();
  });

  // ─── Communication Tab ───────────────────────────────────────

  test("Communication tab should show Log Call and Log WhatsApp buttons", async ({
    page,
  }) => {
    await page.goto(BASE);
    await page.getByRole("tab", { name: /communication/i }).click();
    await expect(
      page.getByRole("button", { name: /log call/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /log whatsapp/i })
    ).toBeVisible();
  });

  // ─── Listings Tab ────────────────────────────────────────────

  test("Listings tab should show Add Listing button", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("tab", { name: /listings/i }).click();
    await expect(
      page.getByRole("link", { name: /add listing/i })
    ).toBeVisible();
  });

  // ─── Activity Tab ────────────────────────────────────────────

  test("Activity tab should show audit log timeline or empty state", async ({
    page,
  }) => {
    await page.goto(BASE);
    // Activity is the default tab
    await expect(
      page.getByText(/recent activity|no activity/i)
    ).toBeVisible();
  });

  // ─── Overview Sidebar ────────────────────────────────────────

  test("Overview should show status, assigned to, and source", async ({
    page,
  }) => {
    await page.goto(BASE);
    await expect(page.getByText(/status/i).first()).toBeVisible();
    await expect(page.getByText(/assigned to/i).first()).toBeVisible();
    await expect(page.getByText(/source/i).first()).toBeVisible();
  });

  // ─── No Kanban on /sellers ────────────────────────────────────

  test("/sellers page should NOT have Board/Kanban tab", async ({ page }) => {
    await page.goto("/sellers");
    await expect(page.getByRole("tab", { name: /board|kanban/i })).toHaveCount(
      0
    );
  });
});
