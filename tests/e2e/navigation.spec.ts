import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const briefingsIndex = JSON.parse(
  readFileSync(new URL("../../public/generated/briefings-index.json", import.meta.url), "utf8")
) as {
  availableDates: string[];
};
const briefingsByDate = JSON.parse(
  readFileSync(new URL("../../public/generated/briefings-by-date.json", import.meta.url), "utf8")
) as Record<
  string,
  {
    insights: Array<{
      id: string;
      title: string;
      sourceUrl?: string;
    }>;
  }
>;

const switchedDate = briefingsIndex.availableDates[1];
const switchedInsightTitle = briefingsByDate[switchedDate]?.insights[0]?.title;
const permalinkInsight =
  Object.values(briefingsByDate)
    .flatMap((day) => day.insights)
    .find((insight) => insight.sourceUrl) ?? briefingsByDate[briefingsIndex.availableDates[0]]?.insights[0];

test("switches dates from the recent briefs rail and updates the selected day content", async ({
  page
}) => {
  await page.goto("/today");

  await expect(page.getByRole("heading", { name: "Signal Distilled" })).toBeVisible();
  await expect(page.getByText("A private briefing room for agent builders.")).toBeHidden();
  await expect(page.getByText("Operating mode")).toBeHidden();
  await expect(page.getByTestId("today-brief-audio")).toBeVisible();
  await expect(page.getByRole("link", { name: switchedDate })).toBeVisible();

  await page.getByRole("link", { name: switchedDate }).click();

  await expect(page).toHaveURL(new RegExp(`/today\\?date=${switchedDate}$`));
  await expect(page.locator("main").getByText(switchedDate, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(switchedInsightTitle)).toBeVisible();
});

test("switches dates from the selected date button in the hero", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/today");

  await page.getByTestId("selected-date-trigger").click();
  await expect(page.getByRole("listbox", { name: "Available brief dates" })).toBeVisible();
  await page.getByRole("option", { name: switchedDate }).click();

  await expect(page).toHaveURL(new RegExp(`/today\\?date=${switchedDate}$`));
  await expect(page.getByTestId("selected-date-trigger")).toContainText(switchedDate);
  await expect(page.getByText(switchedInsightTitle)).toBeVisible();
  await expect(page.getByRole("listbox", { name: "Available brief dates" })).toBeHidden();
});

test("reloads a real permalink route without losing the selected insight", async ({ page }) => {
  await page.goto(`/insights/${permalinkInsight.id}`);

  await expect(page.getByText(permalinkInsight.title)).toBeVisible();
  await expect(page.getByText("Original Source")).toBeVisible();

  await page.reload();

  await expect(page.getByText(permalinkInsight.title)).toBeVisible();
  await expect(page.getByText("Original Source")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Build Idea" })).toBeHidden();
});
