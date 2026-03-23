import { expect, test } from "@playwright/test";

test("persists the core loop from Today to Build across a refresh", async ({ page }) => {
  await page.goto("/today");
  await page.evaluate(() => {
    window.localStorage.clear();
  });

  await page.goto("/today?date=2026-03-20");

  await expect(page.getByRole("heading", { name: "Today's Brief" })).toBeVisible();

  await page.getByRole("button", { name: "Add to Build" }).first().click();

  await expect(page.getByRole("heading", { name: "Add to Build Queue" })).toBeVisible();
  await page.getByLabel("Quick Note").fill("Follow up on the repo workflow idea.");
  await page.getByRole("button", { name: "Save to Queue" }).click();

  await expect(page).toHaveURL(/\/build$/);
  await expect(page.getByRole("heading", { name: "Build Queue" })).toBeVisible();
  await expect(page.getByText("Follow up on the repo workflow idea.")).toBeVisible();

  await page.reload();

  await expect(page.getByRole("heading", { name: "Build Queue" })).toBeVisible();
  await expect(page.getByText("Follow up on the repo workflow idea.")).toBeVisible();
});
