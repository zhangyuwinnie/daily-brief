import { expect, test } from "@playwright/test";

test("plays a generated ready audio brief from /today", async ({ page }) => {
  await page.goto("/today?date=2026-03-20");

  await expect(page.getByRole("heading", { name: "Today's Brief" })).toBeVisible();
  await expect(page.getByText("Ready")).toBeVisible();

  const playButton = page.getByRole("button", { name: "Play audio brief" });
  await expect(playButton).toBeEnabled();
  await expect(page.locator("audio")).toHaveAttribute("src", /2026-03-20\.wav$/);

  await playButton.click();

  await expect(page.getByRole("button", { name: "Pause audio brief" })).toBeVisible();
  await page.waitForFunction(() => {
    const audioElement = document.querySelector("audio");
    return Boolean(audioElement instanceof HTMLAudioElement && audioElement.currentTime > 0);
  });
});

test("keeps pending generated audio visibly disabled on the default today page", async ({ page }) => {
  await page.goto("/today");

  await expect(page.getByText("Generating...")).toBeVisible();
  await expect(page.getByRole("button", { name: "Play audio brief" })).toBeDisabled();
  await expect(page.getByText(/audio for .* is still generating/i)).toBeVisible();
});
