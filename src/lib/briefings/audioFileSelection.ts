import { basename, extname } from "node:path";

const SUPPORTED_AUDIO_EXTENSIONS = new Set([".mp3", ".m4a", ".wav"]);
const AUDIO_DATE_PATTERN = /(\d{4}-\d{2}-\d{2})/;
const ZH_VARIANT_PATTERN = /(?:^|[_\-.])zh(?:[_\-.]|$)/i;
const DUPLICATE_COPY_PATTERN = /\(\d+\)(?=\.[^.]+$)/;

function audioExtensionPreference(filePath: string) {
  switch (extname(filePath).toLowerCase()) {
    case ".mp3":
      return 0;
    case ".m4a":
      return 1;
    case ".wav":
      return 2;
    default:
      return 3;
  }
}

function requestedDateMatchPreference(date: string, filePath: string) {
  const name = basename(filePath).toLowerCase();

  if (name.startsWith(`${date.toLowerCase()}.`)) {
    return 0;
  }

  return extractAudioDate(filePath) === date ? 1 : 2;
}

function languagePreference(filePath: string) {
  return ZH_VARIANT_PATTERN.test(basename(filePath)) ? 1 : 0;
}

function duplicateCopyPreference(filePath: string) {
  return DUPLICATE_COPY_PATTERN.test(basename(filePath)) ? 1 : 0;
}

export function isSupportedAudioFile(filePath: string) {
  return SUPPORTED_AUDIO_EXTENSIONS.has(extname(filePath).toLowerCase());
}

export function extractAudioDate(filePath: string) {
  return basename(filePath).match(AUDIO_DATE_PATTERN)?.[1] ?? null;
}

export function compareAudioFilePathsForDate(date: string, left: string, right: string) {
  const matchPreferenceDelta =
    requestedDateMatchPreference(date, left) - requestedDateMatchPreference(date, right);
  if (matchPreferenceDelta !== 0) {
    return matchPreferenceDelta;
  }

  const languagePreferenceDelta = languagePreference(left) - languagePreference(right);
  if (languagePreferenceDelta !== 0) {
    return languagePreferenceDelta;
  }

  const duplicatePreferenceDelta = duplicateCopyPreference(left) - duplicateCopyPreference(right);
  if (duplicatePreferenceDelta !== 0) {
    return duplicatePreferenceDelta;
  }

  const extensionPreferenceDelta = audioExtensionPreference(left) - audioExtensionPreference(right);
  if (extensionPreferenceDelta !== 0) {
    return extensionPreferenceDelta;
  }

  return left.localeCompare(right);
}

export function findBestAudioFileForDate(date: string, audioFilePaths: string[]) {
  const matches = audioFilePaths.filter((filePath) => requestedDateMatchPreference(date, filePath) < 2);
  matches.sort((left, right) => compareAudioFilePathsForDate(date, left, right));
  return matches[0];
}

export function buildPublishedAudioFileName(date: string, sourceFilePath: string) {
  return `${date}${extname(sourceFilePath).toLowerCase()}`;
}
