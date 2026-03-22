import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import {
  buildGeneratedArtifacts,
  type BriefingInput,
  validateGeneratedArtifacts,
  writeGeneratedArtifacts
} from "./generatedArtifacts";

export type SyncGeneratedContentOptions = {
  inputDir: string;
  outputDir: string;
  audioDir: string;
};

export type SyncGeneratedContentResult = {
  writtenFiles: string[];
  availableDates: string[];
  briefingFileCount: number;
  audioReadyCount: number;
  warningMessages: string[];
};

const MARKDOWN_FILE_PATTERN = /^(?:x_briefing_)?\d{4}-\d{2}-\d{2}\.md$/;

async function readDirectoryFilePaths(directory: string) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    return entries.filter((entry) => entry.isFile()).map((entry) => join(directory, entry.name));
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function collectBriefingInputs(inputDir: string): Promise<BriefingInput[]> {
  const filePaths = (await readDirectoryFilePaths(inputDir))
    .filter((filePath) => MARKDOWN_FILE_PATTERN.test(basename(filePath)))
    .sort((left, right) => left.localeCompare(right));

  return Promise.all(
    filePaths.map(async (filePath) => ({
      filePath,
      text: await readFile(filePath, "utf8")
    }))
  );
}

async function collectAudioFilePaths(audioDir: string) {
  return (await readDirectoryFilePaths(audioDir)).sort((left, right) => left.localeCompare(right));
}

export async function syncGeneratedContent(
  options: SyncGeneratedContentOptions
): Promise<SyncGeneratedContentResult> {
  const briefingInputs = await collectBriefingInputs(options.inputDir);

  if (briefingInputs.length === 0) {
    throw new Error(`No briefing markdown files found under ${options.inputDir}.`);
  }

  const audioFilePaths = await collectAudioFilePaths(options.audioDir);
  const artifacts = buildGeneratedArtifacts({
    briefingInputs,
    audioFilePaths
  });

  validateGeneratedArtifacts(artifacts);
  const writtenFiles = await writeGeneratedArtifacts(artifacts, options.outputDir);

  return {
    writtenFiles,
    availableDates: artifacts.briefingsIndex.availableDates,
    briefingFileCount: briefingInputs.length,
    audioReadyCount: Object.values(artifacts.audioIndex).filter((audio) => audio.status === "ready").length,
    warningMessages: artifacts.warnings.map((warning) => warning.message)
  };
}
