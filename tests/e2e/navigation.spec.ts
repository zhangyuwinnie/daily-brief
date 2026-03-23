import { expect, test } from "@playwright/test";

test("switches dates from the recent briefs rail and updates the selected day content", async ({
  page
}) => {
  await page.goto("/today");

  await expect(page.getByRole("heading", { name: "Today's Brief" })).toBeVisible();
  await expect(page.getByRole("link", { name: "2026-03-21" })).toBeVisible();

  await page.getByRole("link", { name: "2026-03-21" }).click();

  await expect(page).toHaveURL(/\/today\?date=2026-03-21$/);
  await expect(page.locator("main").getByText("2026-03-21", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("OpenCode – Open source AI coding agent")).toBeVisible();
});

test("reloads a real permalink route without losing the selected insight", async ({ page }) => {
  await page.goto("/insights/rss-2026-03-22-01-using-git-with-coding-agents");

  await expect(page.getByText("Using Git with coding agents")).toBeVisible();
  await expect(page.getByText("Original Source")).toBeVisible();

  await page.reload();

  await expect(page.getByText("Using Git with coding agents")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Build Idea" })).toBeVisible();
});
