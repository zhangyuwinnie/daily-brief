const AUDIO_PROGRESS_STORAGE_PREFIX = "brief2build.audio-progress.v1:";
export const AUDIO_PROGRESS_INDEX_KEY = `${AUDIO_PROGRESS_STORAGE_PREFIX}index`;
const AUDIO_PROGRESS_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const AUDIO_PROGRESS_MAX_ENTRIES = 50;

export type AudioProgressRecord = {
  audioId: string;
  briefingDate: string;
  audioUrl?: string;
  currentTimeSec: number;
  durationSec?: number;
  updatedAt: number;
};

type AudioProgressIndexEntry = {
  audioId: string;
  updatedAt: number;
};

export function buildAudioProgressKey(audioId: string) {
  return `${AUDIO_PROGRESS_STORAGE_PREFIX}${audioId}`;
}

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function parseJson<T>(raw: string | null) {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(storage: Storage, key: string, value: unknown) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Best-effort persistence only.
  }
}

function removeItem(storage: Storage, key: string) {
  try {
    storage.removeItem(key);
  } catch {
    // Best-effort persistence only.
  }
}

function readIndex(storage: Storage) {
  const parsed = parseJson<AudioProgressIndexEntry[]>(storage.getItem(AUDIO_PROGRESS_INDEX_KEY));

  if (!Array.isArray(parsed)) {
    return [] satisfies AudioProgressIndexEntry[];
  }

  return parsed.filter(
    (entry): entry is AudioProgressIndexEntry =>
      Boolean(entry) &&
      typeof entry.audioId === "string" &&
      entry.audioId.length > 0 &&
      Number.isFinite(entry.updatedAt)
  );
}

function writeIndex(storage: Storage, index: AudioProgressIndexEntry[]) {
  writeJson(storage, AUDIO_PROGRESS_INDEX_KEY, index);
}

function pruneIndex(storage: Storage, now: number) {
  const staleBefore = now - AUDIO_PROGRESS_TTL_MS;
  const survivingEntries = new Map<string, AudioProgressIndexEntry>();

  for (const entry of readIndex(storage)) {
    if (entry.updatedAt < staleBefore) {
      removeItem(storage, buildAudioProgressKey(entry.audioId));
      continue;
    }

    const existing = survivingEntries.get(entry.audioId);
    if (!existing || existing.updatedAt < entry.updatedAt) {
      survivingEntries.set(entry.audioId, entry);
    }
  }

  const nextIndex = [...survivingEntries.values()]
    .sort((left, right) => right.updatedAt - left.updatedAt)
    .slice(0, AUDIO_PROGRESS_MAX_ENTRIES);

  const retainedAudioIds = new Set(nextIndex.map((entry) => entry.audioId));

  for (const entry of survivingEntries.values()) {
    if (!retainedAudioIds.has(entry.audioId)) {
      removeItem(storage, buildAudioProgressKey(entry.audioId));
    }
  }

  writeIndex(storage, nextIndex);
  return nextIndex;
}

export function readAudioProgress(audioId: string, now = Date.now()) {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  const index = pruneIndex(storage, now);
  if (!index.some((entry) => entry.audioId === audioId)) {
    return null;
  }

  const rawRecord = parseJson<AudioProgressRecord>(storage.getItem(buildAudioProgressKey(audioId)));

  if (
    !rawRecord ||
    rawRecord.audioId !== audioId ||
    typeof rawRecord.briefingDate !== "string" ||
    !Number.isFinite(rawRecord.currentTimeSec) ||
    !Number.isFinite(rawRecord.updatedAt)
  ) {
    clearAudioProgress(audioId);
    return null;
  }

  return rawRecord;
}

export function writeAudioProgress(progress: Omit<AudioProgressRecord, "updatedAt"> & { updatedAt?: number }) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  const updatedAt = progress.updatedAt ?? Date.now();
  const nextRecord: AudioProgressRecord = {
    ...progress,
    updatedAt
  };

  const nextIndex = pruneIndex(storage, updatedAt).filter((entry) => entry.audioId !== progress.audioId);
  nextIndex.unshift({ audioId: progress.audioId, updatedAt });

  writeJson(storage, buildAudioProgressKey(progress.audioId), nextRecord);
  writeIndex(storage, nextIndex.slice(0, AUDIO_PROGRESS_MAX_ENTRIES));
}

export function clearAudioProgress(audioId: string) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  removeItem(storage, buildAudioProgressKey(audioId));
  writeIndex(
    storage,
    readIndex(storage).filter((entry) => entry.audioId !== audioId)
  );
}
