import { SANMA_TILE_INDICES, createRandomSanmaHand, toTileCounts } from "@/lib/tiles";
import type {
  DiscardEvaluation,
  GenerationMode,
  HandEvaluation,
  QuizQuestion,
  SanmaEvaluator,
} from "@/lib/types";

const MIN_PREFERRED_SHANTEN = 1;
const MAX_PREFERRED_SHANTEN = 3;
const MAX_GENERATION_ATTEMPTS = 160;
const TILE_COPIES = 4;
const TILES_AFTER_DISCARD = 13;
export const UNKNOWN_SANMA_TILES_AFTER_DISCARD =
  SANMA_TILE_INDICES.length * TILE_COPIES - TILES_AFTER_DISCARD;

export function generateQuizQuestion(
  evaluate: SanmaEvaluator,
  mode: GenerationMode = "standard",
): QuizQuestion {
  let fallback: QuizQuestion | undefined;

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const hand = createRandomSanmaHand(mode);
    const evaluation = evaluate(toTileCounts(hand));
    const question = { hand, evaluation };
    if (evaluation.currentShanten >= MIN_PREFERRED_SHANTEN) {
      fallback ??= question;
    }

    if (
      evaluation.currentShanten >= MIN_PREFERRED_SHANTEN &&
      evaluation.currentShanten <= MAX_PREFERRED_SHANTEN
    ) {
      return question;
    }
  }

  if (fallback === undefined) {
    throw new Error("問題を生成できませんでした。");
  }
  return fallback;
}

export function isCorrectDiscard(selectedDiscard: string, evaluation: HandEvaluation): boolean {
  return evaluation.bestDiscards.includes(selectedDiscard);
}

export function nextDrawTenpaiProbability(candidate: DiscardEvaluation): {
  effectiveCount: number;
  unknownCount: number;
  percentage: number;
} {
  const effectiveCount = candidate.shanten === 1 ? candidate.totalUkeire : 0;
  return {
    effectiveCount,
    unknownCount: UNKNOWN_SANMA_TILES_AFTER_DISCARD,
    percentage: (effectiveCount / UNKNOWN_SANMA_TILES_AFTER_DISCARD) * 100,
  };
}
