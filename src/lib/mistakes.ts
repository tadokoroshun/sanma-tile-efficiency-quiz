import { HAND_TILE_COUNT, QUIZ_HAND_TILE_INDICES, sortHand } from "@/lib/tiles";
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
  lastMistakeAt: string;
};

type RecordMistakeInput = {
  hand: readonly TileIndex[];
  mode: GenerationMode;
  selectedDiscard: string;
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
    return Array.isArray(parsed) ? parsed.filter(isSavedMistake) : [];
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
  const updated: SavedMistake = {
    id,
    hand,
    mode: input.mode,
    mistakeCount: (previous?.mistakeCount ?? 0) + 1,
    lastSelectedDiscard: input.selectedDiscard,
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

function isSavedMistake(value: unknown): value is SavedMistake {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<SavedMistake>;
  return (
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
    typeof candidate.lastMistakeAt === "string"
  );
}
