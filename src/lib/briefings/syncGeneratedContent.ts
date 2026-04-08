import { copyFile, mkdir, readdir, readFile, unlink } from "node:fs/promises";
import { basename, join } from "node:path";
import {
  buildGeneratedArtifacts,
  type BriefingInput,
  validateGeneratedArtifacts,
  writeGeneratedArtifacts
} from "./generatedArtifacts";
import {
  buildPublishedAudioFileName,
  extractAudioDate,
  findBestAudioFileForDate,
  isSupportedAudioFile
} from "./audioFileSelection";

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
const PUBLISHED_AUDIO_FILE_PATTERN = /^\d{4}-\d{2}-\d{2}\.(mp3|m4a|wav)$/i;

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

function collectBriefingDates(briefingInputs: BriefingInput[]) {
  return [
    ...new Set(
      briefingInputs
        .map((input) => extractAudioDate(input.filePath))
        .filter((date): date is string => date !== null)
    )
  ].sort((left, right) => right.localeCompare(left));
}

async function collectSourceAudioFilePaths(inputDir: string) {
  return (await readDirectoryFilePaths(inputDir))
    .filter((filePath) => isSupportedAudioFile(filePath))
    .sort((left, right) => left.localeCompare(right));
}

function isManagedPublishedAudioFile(filePath: string) {
  return PUBLISHED_AUDIO_FILE_PATTERN.test(basename(filePath));
}

async function removeStalePublishedAudioFiles(audioDir: string, publishedAudioFilePaths: string[]) {
  const publishedSet = new Set(publishedAudioFilePaths);
  const existingPublishedAudioPaths = (await readDirectoryFilePaths(audioDir)).filter(isManagedPublishedAudioFile);

  await Promise.all(
    existingPublishedAudioPaths
      .filter((filePath) => !publishedSet.has(filePath))
      .map((filePath) => unlink(filePath))
  );
}

async function publishSourceAudioFiles(dates: string[], sourceAudioFilePaths: string[], audioDir: string) {
  await mkdir(audioDir, { recursive: true });

  const publishedAudioFilePaths: string[] = [];
  for (const date of dates) {
    const sourceFilePath = findBestAudioFileForDate(date, sourceAudioFilePaths);
    if (!sourceFilePath) {
      continue;
    }

    const publishedFilePath = join(audioDir, buildPublishedAudioFileName(date, sourceFilePath));
    await copyFile(sourceFilePath, publishedFilePath);
    publishedAudioFilePaths.push(publishedFilePath);
  }

  await removeStalePublishedAudioFiles(audioDir, publishedAudioFilePaths);

  return publishedAudioFilePaths.sort((left, right) => left.localeCompare(right));
}

export async function syncGeneratedContent(
  options: SyncGeneratedContentOptions
): Promise<SyncGeneratedContentResult> {
  const briefingInputs = await collectBriefingInputs(options.inputDir);

  if (briefingInputs.length === 0) {
    throw new Error(`No briefing markdown files found under ${options.inputDir}.`);
  }

  const briefingDates = collectBriefingDates(briefingInputs);
  const sourceAudioFilePaths = await collectSourceAudioFilePaths(options.inputDir);
  const publishedAudioFilePaths = await publishSourceAudioFiles(
    briefingDates,
    sourceAudioFilePaths,
    options.audioDir
  );
  const artifacts = buildGeneratedArtifacts({
    briefingInputs,
    audioFilePaths: publishedAudioFilePaths
  });

  validateGeneratedArtifacts(artifacts);
  const writtenFiles = [
    ...publishedAudioFilePaths,
    ...(await writeGeneratedArtifacts(artifacts, options.outputDir))
  ];

  return {
    writtenFiles,
    availableDates: artifacts.briefingsIndex.availableDates,
    briefingFileCount: briefingInputs.length,
    audioReadyCount: Object.values(artifacts.audioIndex).filter((audio) => audio.status === "ready").length,
    warningMessages: artifacts.warnings.map((warning) => warning.message)
  };
}
