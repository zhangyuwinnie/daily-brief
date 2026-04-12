import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { syncGeneratedContent } from "../src/lib/briefings/syncGeneratedContent";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");

export function resolveSyncGeneratedContentPaths({
  repoRoot: root = repoRoot,
  env = process.env
}: {
  repoRoot?: string;
  env?: NodeJS.ProcessEnv;
} = {}) {
  return {
    inputDir: env.BRIEFINGS_DIR ?? resolve(root, "briefings"),
    outputDir: env.GENERATED_CONTENT_DIR ?? resolve(root, "public/generated"),
    audioDir: env.GENERATED_AUDIO_DIR ?? resolve(root, "public/generated/audio")
  };
}

export async function runSyncGeneratedContent() {
  const { inputDir, outputDir, audioDir } = resolveSyncGeneratedContentPaths();
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
}

const isDirectRun =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  try {
    await runSyncGeneratedContent();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[sync-generated-content] Failed: ${message}`);
    process.exitCode = 1;
  }
}
