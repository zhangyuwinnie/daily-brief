import { copyFile, mkdir, readdir, readFile, unlink } from "node:fs/promises";
import { basename, join } from "node:path";
import {
  buildGeneratedArtifacts,
  type GeneratedArtifacts,
  type GeneratedAudioIndex,
  type GeneratedBriefingsByDate,
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

async function publishSourceAudioFiles(
  dates: string[],
  sourceAudioFilePaths: string[],
  audioDir: string,
  preservedHistoricalDates: string[] = []
) {
  await mkdir(audioDir, { recursive: true });
  const currentDateSet = new Set(dates);
  const preservedHistoricalDateSet = new Set(preservedHistoricalDates);
  const existingPublishedAudioPaths = (await readDirectoryFilePaths(audioDir))
    .filter(isManagedPublishedAudioFile)
    .sort((left, right) => left.localeCompare(right));
  const preservedHistoricalAudioPaths = existingPublishedAudioPaths.filter((filePath) => {
    const date = extractAudioDate(filePath);
    return date !== null && !currentDateSet.has(date) && preservedHistoricalDateSet.has(date);
  });

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

  const desiredPublishedAudioPaths = [...preservedHistoricalAudioPaths, ...publishedAudioFilePaths].sort((left, right) =>
    left.localeCompare(right)
  );

  await removeStalePublishedAudioFiles(audioDir, desiredPublishedAudioPaths);

  return desiredPublishedAudioPaths;
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as T;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

async function loadExistingGeneratedArtifacts(outputDir: string): Promise<GeneratedArtifacts | null> {
  const [briefingsIndex, briefingsByDate, audioIndex] = await Promise.all([
    readJsonFile<GeneratedArtifacts["briefingsIndex"]>(join(outputDir, "briefings-index.json")),
    readJsonFile<GeneratedBriefingsByDate>(join(outputDir, "briefings-by-date.json")),
    readJsonFile<GeneratedAudioIndex>(join(outputDir, "audio-index.json"))
  ]);

  if (!briefingsIndex || !briefingsByDate || !audioIndex) {
    return null;
  }

  return {
    briefingsIndex,
    briefingsByDate,
    audioIndex,
    warnings: []
  };
}

function compareDateDesc(left: string, right: string) {
  return right.localeCompare(left);
}

function mergeGeneratedArtifacts(
  existingArtifacts: GeneratedArtifacts | null,
  currentArtifacts: GeneratedArtifacts
): GeneratedArtifacts {
  if (!existingArtifacts) {
    return currentArtifacts;
  }

  const currentDates = new Set(currentArtifacts.briefingsIndex.availableDates);
  const mergedBriefingsByDate: GeneratedBriefingsByDate = {
    ...Object.fromEntries(
      Object.entries(existingArtifacts.briefingsByDate).filter(([date]) => !currentDates.has(date))
    ),
    ...currentArtifacts.briefingsByDate
  };
  const mergedAudioIndex: GeneratedAudioIndex = {
    ...Object.fromEntries(
      Object.entries(existingArtifacts.audioIndex).filter(([date]) => !currentDates.has(date))
    ),
    ...currentArtifacts.audioIndex
  };
  const availableDates = Object.keys(mergedBriefingsByDate).sort(compareDateDesc);

  return {
    briefingsByDate: mergedBriefingsByDate,
    audioIndex: mergedAudioIndex,
    briefingsIndex: {
      availableDates,
      byDate: Object.fromEntries(
        availableDates.map((date) => {
          const day = mergedBriefingsByDate[date];

          return [
            date,
            {
              briefingIds: day.briefings.map((briefing) => briefing.id),
              insightIds: day.insights.map((insight) => insight.id),
              hasAudio: mergedAudioIndex[date]?.status === "ready",
              sourceTypes: day.briefings.map((briefing) => briefing.sourceType)
            }
          ];
        })
      )
    },
    warnings: currentArtifacts.warnings
  };
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
  const existingArtifacts = await loadExistingGeneratedArtifacts(options.outputDir);
  const publishedAudioFilePaths = await publishSourceAudioFiles(
    briefingDates,
    sourceAudioFilePaths,
    options.audioDir,
    existingArtifacts
      ? existingArtifacts.briefingsIndex.availableDates.filter((date) => !briefingDates.includes(date))
      : []
  );
  const currentArtifacts = buildGeneratedArtifacts({
    briefingInputs,
    audioFilePaths: publishedAudioFilePaths
  });
  const artifacts = mergeGeneratedArtifacts(existingArtifacts, currentArtifacts);

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
