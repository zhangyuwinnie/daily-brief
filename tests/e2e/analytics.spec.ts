import { expect, test, type Page } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const audioIndex = JSON.parse(
  readFileSync(new URL("../../public/generated/audio-index.json", import.meta.url), "utf8")
) as Record<
  string,
  {
    status: string;
    audioUrl?: string;
  }
>;

const readyAudioEntry = Object.entries(audioIndex).find(([, audio]) => audio.status === "ready" && audio.audioUrl);
const TEST_FIXTURE_PATH = join(import.meta.dirname, "../fixtures/audio/test-clip.mp3");

async function collectTrackRequests(page: Page) {
  const trackRequests: Array<Record<string, unknown>> = [];
  await page.route("**/api/track", async (route) => {
    trackRequests.push(JSON.parse(route.request().postData() ?? "{}") as Record<string, unknown>);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true })
    });
  });
  return trackRequests;
}

test("card source-link clicks fire tracking requests", async ({ page }) => {
  const trackRequests = await collectTrackRequests(page);

  await page.goto("/today");

  const firstSourceLink = page.getByTestId("insight-card-source-link").first();
  await expect(firstSourceLink).toBeVisible();
  await firstSourceLink.evaluate((element) => {
    element.addEventListener("click", (event) => event.preventDefault(), { capture: true });
  });
  await firstSourceLink.click();

  await expect.poll(() => trackRequests).toContainEqual(
    expect.objectContaining({ event: "card_click", category: "insight_card" })
  );
});

test("audio play fires a tracking request", async ({ page }) => {
  test.skip(!readyAudioEntry, "requires at least one ready audio date in the generated dataset");

  const trackRequests = await collectTrackRequests(page);
  const [readyDate, readyAudio] = readyAudioEntry!;
  const relativeAudioUrl = readyAudio.audioUrl!.replace(/^\//, "");
  const productionAudioPath = join(import.meta.dirname, "../../public", relativeAudioUrl);

  if (!existsSync(productionAudioPath)) {
    const fixtureBody = readFileSync(TEST_FIXTURE_PATH);
    await page.route(`**/${readyAudio.audioUrl!.split("/").pop()}`, (route) =>
      route.fulfill({ body: fixtureBody, contentType: "audio/mpeg" })
    );
  }

  await page.goto(`/today?date=${readyDate}`);

  const playButton = page.getByRole("button", { name: "Play audio brief" });
  await expect(playButton).toBeEnabled();
  await playButton.click();

  await expect.poll(() => trackRequests).toContainEqual(
    expect.objectContaining({ event: "audio_play", category: "audio" })
  );
});

test("navigation still works when tracking requests are intercepted", async ({ page }) => {
  const trackRequests = await collectTrackRequests(page);

  await page.goto("/today");
  const firstShareButton = page.getByTestId("insight-card-share").first();
  await expect(firstShareButton).toBeVisible();
  await firstShareButton.click();

  await expect(page).toHaveURL(/\/insights\/.+/);
  await expect(page.getByRole("heading", { name: "Build Idea" })).toBeVisible();
  await expect.poll(() => trackRequests).toContainEqual(
    expect.objectContaining({ event: "card_share", category: "insight_card" })
  );
});
