import { test, expect } from "@playwright/test";

/**
 * E2E tests for the Visit Detail Page (/visits/[id])
 *
 * Tests the full visit lifecycle:
 *   Scheduled → Confirmed → Completed  OR  Cancelled
 *
 * Requires an authenticated session and a seeded database
 * with at least one visit. Set VISIT_ID env var or update
 * the test to use a known ID.
 */

const VISIT_ID =
  process.env.VISIT_ID || "00000000-0000-0000-0000-000000000000";
const BASE = `/visits/${VISIT_ID}`;

test.describe("Visit Detail Page", () => {
  // ─── Layout & Header ─────────────────────────────────────────

  test("should display visit header with date/time, ID, and status badge", async ({
    page,
  }) => {
    await page.goto(BASE);
    // Visit ID should be displayed (truncated or full)
    await expect(page.getByTestId("visit-id")).toBeVisible();
    // Status badge should exist
    await expect(page.getByTestId("visit-status-badge")).toBeVisible();
    // Date and time should be displayed
    await expect(page.getByTestId("visit-datetime")).toBeVisible();
  });

  test("should show back navigation to /visits", async ({ page }) => {
    await page.goto(BASE);
    const backLink = page.locator('a[href="/visits"]').first();
    await expect(backLink).toBeVisible();
  });

  // ─── Dynamic Action Buttons ───────────────────────────────────

  test("should show Confirm and Cancel buttons when status is Scheduled", async ({
    page,
  }) => {
    await page.goto(BASE);
    // If the visit is in "scheduled" state, these buttons should appear
    const statusBadge = page.getByTestId("visit-status-badge");
    const statusText = await statusBadge.textContent();

    if (statusText?.toLowerCase().includes("scheduled")) {
      await expect(
        page.getByRole("button", { name: /confirm/i })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /cancel/i })
      ).toBeVisible();
    }
  });

  test("should show Complete and Cancel buttons when status is Confirmed", async ({
    page,
  }) => {
    await page.goto(BASE);
    const statusBadge = page.getByTestId("visit-status-badge");
    const statusText = await statusBadge.textContent();

    if (statusText?.toLowerCase().includes("confirmed")) {
      await expect(
        page.getByRole("button", { name: /complete/i })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /cancel/i })
      ).toBeVisible();
    }
  });

  test("should not show action buttons when status is Completed", async ({
    page,
  }) => {
    await page.goto(BASE);
    const statusBadge = page.getByTestId("visit-status-badge");
    const statusText = await statusBadge.textContent();

    if (statusText?.toLowerCase().includes("completed")) {
      await expect(
        page.getByRole("button", { name: /confirm/i })
      ).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: /complete/i })
      ).toHaveCount(0);
    }
  });

  test("should not show action buttons when status is Cancelled", async ({
    page,
  }) => {
    await page.goto(BASE);
    const statusBadge = page.getByTestId("visit-status-badge");
    const statusText = await statusBadge.textContent();

    if (statusText?.toLowerCase().includes("cancelled")) {
      await expect(
        page.getByRole("button", { name: /confirm/i })
      ).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: /cancel/i })
      ).toHaveCount(0);
    }
  });

  // ─── Cancel Modal ─────────────────────────────────────────────

  test("Cancel button should open cancel modal with reasons dropdown", async ({
    page,
  }) => {
    await page.goto(BASE);
    const cancelButton = page.getByRole("button", { name: /cancel visit/i });
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
      // Dialog should open
      await expect(page.getByRole("dialog")).toBeVisible();
      // Should show cancellation reason label
      await expect(page.getByText(/cancellation reason/i)).toBeVisible();
      // Should show a notes textarea
      await expect(page.getByPlaceholder(/additional notes/i)).toBeVisible();
    }
  });

  test("Cancel modal should have predefined reasons", async ({ page }) => {
    await page.goto(BASE);
    const cancelButton = page.getByRole("button", { name: /cancel visit/i });
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
      await expect(page.getByRole("dialog")).toBeVisible();

      // Open the select dropdown
      const trigger = page.getByRole("dialog").locator('[role="combobox"]');
      if (await trigger.isVisible()) {
        await trigger.click();
        // Check predefined reasons
        await expect(page.getByText("Seller Unavailable")).toBeVisible();
        await expect(page.getByText("Tenant Unavailable")).toBeVisible();
        await expect(page.getByText("Customer No-Show")).toBeVisible();
        await expect(page.getByText("Other")).toBeVisible();
      }
    }
  });

  // ─── Complete Modal ───────────────────────────────────────────

  test("Complete button should open completion modal with OTP input", async ({
    page,
  }) => {
    await page.goto(BASE);
    const completeButton = page.getByRole("button", {
      name: /complete visit/i,
    });
    if (await completeButton.isVisible()) {
      await completeButton.click();
      // Dialog should open
      await expect(page.getByRole("dialog")).toBeVisible();
      // Should show OTP section
      await expect(page.getByText(/otp verification/i)).toBeVisible();
      // Should show OTP input slots
      await expect(page.locator('[data-slot="input-otp"]')).toBeVisible();
    }
  });

  test("Complete modal should show feedback section with star rating", async ({
    page,
  }) => {
    await page.goto(BASE);
    const completeButton = page.getByRole("button", {
      name: /complete visit/i,
    });
    if (await completeButton.isVisible()) {
      await completeButton.click();
      await expect(page.getByRole("dialog")).toBeVisible();
      // Should show feedback section
      await expect(page.getByText(/feedback/i).first()).toBeVisible();
      // Should show star rating (radiogroup role)
      await expect(page.getByRole("radiogroup")).toBeVisible();
    }
  });

  test("Complete modal should show geolocation status", async ({ page }) => {
    await page.goto(BASE);
    const completeButton = page.getByRole("button", {
      name: /complete visit/i,
    });
    if (await completeButton.isVisible()) {
      await completeButton.click();
      await expect(page.getByRole("dialog")).toBeVisible();
      // Should show location section
      await expect(page.getByText(/location/i).first()).toBeVisible();
    }
  });

  // ─── Context Cards ────────────────────────────────────────────

  test("should display Buyer context card with name and phone", async ({
    page,
  }) => {
    await page.goto(BASE);
    await expect(page.getByTestId("buyer-card")).toBeVisible();
    // Should have click-to-call link
    const phoneLink = page.getByTestId("buyer-card").locator('a[href^="tel:"]');
    await expect(phoneLink.or(page.getByTestId("buyer-card").locator("button")).first()).toBeVisible();
  });

  test("should display Listing context card with title", async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByTestId("listing-card")).toBeVisible();
  });

  test("should display Agent context card", async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByTestId("agent-card")).toBeVisible();
  });

  // ─── Tabs ────────────────────────────────────────────────────

  test("should render Timeline and Notes tabs", async ({ page }) => {
    await page.goto(BASE);
    await expect(
      page.getByRole("tab", { name: /timeline/i })
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /notes/i })
    ).toBeVisible();
  });

  test("should switch between tabs", async ({ page }) => {
    await page.goto(BASE);
    // Click Notes tab
    await page.getByRole("tab", { name: /notes/i }).click();
    // The notes content should be visible (textarea for adding notes)
    await expect(page.getByPlaceholder(/add a note/i)).toBeVisible();

    // Click Timeline tab
    await page.getByRole("tab", { name: /timeline/i }).click();
    // Should see timeline content (activity or empty state)
    await expect(
      page.getByText(/recent activity|no activity/i)
    ).toBeVisible();
  });

  // ─── Not-Found ────────────────────────────────────────────────

  test("should show not-found state for invalid visit ID", async ({
    page,
  }) => {
    await page.goto("/visits/invalid-uuid");
    await expect(page.getByText(/visit not found/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /back to visits/i })).toBeVisible();
  });

  // ─── No Kanban on /visits detail ───────────────────────────────

  test("visit detail should NOT have Board/Kanban view", async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByRole("tab", { name: /board|kanban/i })).toHaveCount(
      0
    );
  });
});
