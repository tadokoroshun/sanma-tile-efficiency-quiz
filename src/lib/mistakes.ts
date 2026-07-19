import { HAND_TILE_COUNT, QUIZ_HAND_TILE_INDICES, sortHand } from "@/lib/tiles";
import { MISTAKE_TYPES } from "@/lib/mistake-classification";
import type { MistakeType } from "@/lib/mistake-classification";
import type { GenerationMode, TileIndex } from "@/lib/types";

const STORAGE_KEY = "sanma-tile-efficiency-quiz:mistakes:v1";
export const MAX_SAVED_MISTAKES = 100;

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export type SavedMistake = {
  id: string;
  hand: TileIndex[];
  mode: GenerationMode;
  mistakeCount: number;
  lastSelectedDiscard: string;
  lastMistakeTypes: MistakeType[];
  mistakeTypeCounts: Partial<Record<MistakeType, number>>;
  lastMistakeAt: string;
};

type RecordMistakeInput = {
  hand: readonly TileIndex[];
  mode: GenerationMode;
  selectedDiscard: string;
  mistakeTypes: readonly MistakeType[];
};

export function loadMistakes(storage: StorageLike | null = browserStorage()): SavedMistake[] {
  if (storage === null) {
    return [];
  }

  try {
    const stored = storage.getItem(STORAGE_KEY);
    if (stored === null) {
      return [];
    }
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.flatMap((value) => {
          const mistake = parseSavedMistake(value);
          return mistake === null ? [] : [mistake];
        })
      : [];
  } catch {
    return [];
  }
}

export function recordMistake(
  input: RecordMistakeInput,
  storage: StorageLike | null = browserStorage(),
  now: () => string = () => new Date().toISOString(),
): SavedMistake[] {
  if (storage === null) {
    return [];
  }

  const hand = sortHand(input.hand);
  const id = handId(hand);
  const mistakes = loadMistakes(storage);
  const previous = mistakes.find((mistake) => mistake.id === id);
  const mistakeTypeCounts = { ...(previous?.mistakeTypeCounts ?? {}) };
  for (const mistakeType of new Set(input.mistakeTypes)) {
    mistakeTypeCounts[mistakeType] = (mistakeTypeCounts[mistakeType] ?? 0) + 1;
  }
  const updated: SavedMistake = {
    id,
    hand,
    mode: input.mode,
    mistakeCount: (previous?.mistakeCount ?? 0) + 1,
    lastSelectedDiscard: input.selectedDiscard,
    lastMistakeTypes: [...new Set(input.mistakeTypes)],
    mistakeTypeCounts,
    lastMistakeAt: now(),
  };
  const next = [
    updated,
    ...mistakes.filter((mistake) => mistake.id !== id),
  ].slice(0, MAX_SAVED_MISTAKES);
  return saveMistakes(storage, next, mistakes);
}

export function removeMistake(
  hand: readonly TileIndex[],
  storage: StorageLike | null = browserStorage(),
): SavedMistake[] {
  if (storage === null) {
    return [];
  }

  const id = handId(hand);
  const mistakes = loadMistakes(storage);
  const next = mistakes.filter((mistake) => mistake.id !== id);
  return saveMistakes(storage, next, mistakes);
}

export function chooseReviewMistake(
  mistakes: readonly SavedMistake[],
  random: () => number = Math.random,
): SavedMistake | undefined {
  if (mistakes.length === 0) {
    return undefined;
  }
  return mistakes[Math.floor(random() * mistakes.length)];
}

function browserStorage(): StorageLike | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function saveMistakes(
  storage: StorageLike,
  next: SavedMistake[],
  fallback: SavedMistake[],
): SavedMistake[] {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return fallback;
  }
}

function handId(hand: readonly TileIndex[]): string {
  return sortHand(hand).join(",");
}

function parseSavedMistake(value: unknown): SavedMistake | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const valid =
    typeof candidate.id === "string" &&
    Array.isArray(candidate.hand) &&
    candidate.hand.length === HAND_TILE_COUNT &&
    candidate.hand.every(
      (tileIndex) =>
        Number.isInteger(tileIndex) && QUIZ_HAND_TILE_INDICES.includes(tileIndex),
    ) &&
    (candidate.mode === "standard" || candidate.mode === "flush") &&
    typeof candidate.mistakeCount === "number" &&
    Number.isInteger(candidate.mistakeCount) &&
    candidate.mistakeCount > 0 &&
    typeof candidate.lastSelectedDiscard === "string" &&
    typeof candidate.lastMistakeAt === "string";
  if (!valid) {
    return null;
  }

  return {
    id: candidate.id as string,
    hand: candidate.hand as TileIndex[],
    mode: candidate.mode as GenerationMode,
    mistakeCount: candidate.mistakeCount as number,
    lastSelectedDiscard: candidate.lastSelectedDiscard as string,
    lastMistakeTypes: parseMistakeTypes(candidate.lastMistakeTypes),
    mistakeTypeCounts: parseMistakeTypeCounts(candidate.mistakeTypeCounts),
    lastMistakeAt: candidate.lastMistakeAt as string,
  };
}

function parseMistakeTypes(value: unknown): MistakeType[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((item): item is MistakeType => isMistakeType(item)))]
    : [];
}

function parseMistakeTypeCounts(value: unknown): Partial<Record<MistakeType, number>> {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  const stored = value as Record<string, unknown>;
  const counts: Partial<Record<MistakeType, number>> = {};
  for (const mistakeType of MISTAKE_TYPES) {
    const count = stored[mistakeType];
    if (typeof count === "number" && Number.isInteger(count) && count > 0) {
      counts[mistakeType] = count;
    }
  }
  return counts;
}

function isMistakeType(value: unknown): value is MistakeType {
  return typeof value === "string" && MISTAKE_TYPES.some((type) => type === value);
}
