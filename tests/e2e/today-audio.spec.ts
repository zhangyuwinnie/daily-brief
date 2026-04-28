import { expect, test, type Page } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildAudioProgressKey } from "../../src/components/audio/audioProgressStorage";

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
const pendingAudioEntry = Object.entries(audioIndex).find(([, audio]) => audio.status !== "ready");

const TEST_FIXTURE_PATH = join(import.meta.dirname, "../fixtures/audio/test-clip.mp3");

async function routeAudioFixtureIfNeeded(page: Page, readyAudioUrl: string) {
  // If production audio files are not present (CI/fresh clone), serve the test fixture instead
  const relativeAudioUrl = readyAudioUrl.replace(/^\//, "");
  const productionAudioPath = join(import.meta.dirname, "../../public", relativeAudioUrl);
  if (!existsSync(productionAudioPath)) {
    const fixtureBody = readFileSync(TEST_FIXTURE_PATH);
    await page.route(`**/${readyAudioUrl.split("/").pop()}`, (route) =>
      route.fulfill({ body: fixtureBody, contentType: "audio/mpeg" })
    );
  }
}

test("plays a generated ready deep dive podcast from /today", async ({ page }) => {
  test.skip(!readyAudioEntry, "requires at least one ready audio date in the generated dataset");

  const [readyDate, readyAudio] = readyAudioEntry!;

  await routeAudioFixtureIfNeeded(page, readyAudio.audioUrl!);

  await page.goto(`/today?date=${readyDate}`);

  await expect(page.getByRole("heading", { name: "Signal Distilled" })).toBeVisible();
  await expect(page.getByText("Ready")).toBeVisible();

  const playButton = page.getByRole("button", { name: "Play deep dive podcast" });
  await expect(playButton).toBeEnabled();
  await expect(page.locator("audio")).toHaveAttribute("src", readyAudio.audioUrl!);

  await playButton.click();

  await expect(page.getByRole("button", { name: "Pause deep dive podcast" })).toBeVisible();
  await page.waitForFunction(() => {
    const audioElement = document.querySelector("audio");
    return Boolean(audioElement instanceof HTMLAudioElement && audioElement.currentTime > 0);
  });
});

test("restores saved podcast progress after reload and clears it on ended", async ({ page }) => {
  test.skip(!readyAudioEntry, "requires at least one ready audio date in the generated dataset");

  const [readyDate, readyAudio] = readyAudioEntry!;
  const storageKey = buildAudioProgressKey(readyAudio.id);

  await routeAudioFixtureIfNeeded(page, readyAudio.audioUrl!);
  await page.goto(`/today?date=${readyDate}`);

  const playButton = page.getByRole("button", { name: "Play deep dive podcast" });
  await playButton.click();
  await page.waitForFunction(() => {
    const audioElement = document.querySelector("audio");
    return Boolean(audioElement instanceof HTMLAudioElement && audioElement.currentTime > 0.5);
  });

  await page.getByRole("button", { name: "Pause deep dive podcast" }).click();
  await page.waitForFunction((key) => window.localStorage.getItem(key) !== null, storageKey);

  const savedStateBeforeReload = await page.evaluate((key) => {
    const audioElement = document.querySelector("audio");
    return {
      currentTime: audioElement instanceof HTMLAudioElement ? audioElement.currentTime : 0,
      stored: window.localStorage.getItem(key)
    };
  }, storageKey);

  expect(savedStateBeforeReload.currentTime).toBeGreaterThan(0.5);
  expect(savedStateBeforeReload.stored).not.toBeNull();

  await page.reload();
  await page.waitForFunction(
    ({ minimumExpectedTime }) => {
      const audioElement = document.querySelector("audio");
      return Boolean(
        audioElement instanceof HTMLAudioElement &&
          audioElement.paused &&
          audioElement.currentTime >= minimumExpectedTime
      );
    },
    { minimumExpectedTime: Math.max(savedStateBeforeReload.currentTime - 0.25, 0.25) }
  );

  const restoredState = await page.evaluate(() => {
    const audioElement = document.querySelector("audio");
    return audioElement instanceof HTMLAudioElement
      ? { currentTime: audioElement.currentTime, paused: audioElement.paused }
      : null;
  });

  expect(restoredState).not.toBeNull();
  expect(restoredState!.paused).toBe(true);
  expect(restoredState!.currentTime).toBeGreaterThanOrEqual(Math.max(savedStateBeforeReload.currentTime - 0.25, 0.25));

  await page.evaluate((key) => {
    const audioElement = document.querySelector("audio");
    if (!(audioElement instanceof HTMLAudioElement)) {
      throw new Error("Expected audio element to exist.");
    }

    audioElement.dispatchEvent(new Event("ended"));
    if (window.localStorage.getItem(key) !== null) {
      throw new Error("Expected saved audio progress to be cleared on ended.");
    }
  }, storageKey);
});

test("keeps pending generated audio visibly disabled on a pending generated day", async ({ page }) => {
  test.skip(!pendingAudioEntry, "requires at least one pending audio date in the generated dataset");

  const [pendingDate] = pendingAudioEntry!;
  await page.goto(`/today?date=${pendingDate}`);

  await expect(page.getByText("Generating...")).toBeVisible();
  await expect(page.getByRole("button", { name: "Play deep dive podcast" })).toBeDisabled();
  await expect(page.getByText(`Audio for ${pendingDate} is still generating.`)).toBeVisible();
});
