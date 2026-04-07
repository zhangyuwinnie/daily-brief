import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { syncGeneratedContent } from "../src/lib/briefings/syncGeneratedContent";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");

const inputDir = process.env.BRIEFINGS_DIR ?? "/Users/yuzhang/.openclaw/workspace/briefings";
const outputDir = process.env.GENERATED_CONTENT_DIR ?? resolve(repoRoot, "public/generated");
const audioDir = process.env.GENERATED_AUDIO_DIR ?? resolve(repoRoot, "public/generated/audio");

try {
  const result = await syncGeneratedContent({
    inputDir,
    outputDir,
    audioDir
  });

  console.log(
    [
      "[sync-generated-content] Completed.",
      `briefings=${result.briefingFileCount}`,
      `dates=${result.availableDates.length}`,
      `audioReady=${result.audioReadyCount}`
    ].join(" ")
  );
  console.log(`[sync-generated-content] Wrote ${result.writtenFiles.length} files to ${outputDir}.`);

  if (result.warningMessages.length > 0) {
    console.warn(`[sync-generated-content] Parser warnings: ${result.warningMessages.length}`);
    result.warningMessages.slice(0, 10).forEach((message) => {
      console.warn(`- ${message}`);
    });
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[sync-generated-content] Failed: ${message}`);
  process.exitCode = 1;
}
