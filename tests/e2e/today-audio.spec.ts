import { expect, test } from "@playwright/test";
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
const pendingAudioEntry = Object.entries(audioIndex).find(([, audio]) => audio.status !== "ready");

const TEST_FIXTURE_PATH = join(import.meta.dirname, "../fixtures/audio/test-clip.mp3");

test("plays a generated ready deep dive podcast from /today", async ({ page }) => {
  test.skip(!readyAudioEntry, "requires at least one ready audio date in the generated dataset");

  const [readyDate, readyAudio] = readyAudioEntry!;

  // If production audio files are not present (CI/fresh clone), serve the test fixture instead
  const relativeAudioUrl = readyAudio.audioUrl!.replace(/^\//, "");
  const productionAudioPath = join(import.meta.dirname, "../../public", relativeAudioUrl);
  if (!existsSync(productionAudioPath)) {
    const fixtureBody = readFileSync(TEST_FIXTURE_PATH);
    await page.route(`**/${readyAudio.audioUrl!.split("/").pop()}`, (route) =>
      route.fulfill({ body: fixtureBody, contentType: "audio/mpeg" })
    );
  }

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

test("keeps pending generated audio visibly disabled on a pending generated day", async ({ page }) => {
  test.skip(!pendingAudioEntry, "requires at least one pending audio date in the generated dataset");

  const [pendingDate] = pendingAudioEntry!;
  await page.goto(`/today?date=${pendingDate}`);

  await expect(page.getByText("Generating...")).toBeVisible();
  await expect(page.getByRole("button", { name: "Play deep dive podcast" })).toBeDisabled();
  await expect(page.getByText(`Audio for ${pendingDate} is still generating.`)).toBeVisible();
});
