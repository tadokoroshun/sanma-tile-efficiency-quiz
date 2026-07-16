import { createRandomSanmaHand, toTileCounts } from "@/lib/tiles";
import type { HandEvaluation, QuizQuestion, SanmaEvaluator } from "@/lib/types";

const MIN_PREFERRED_SHANTEN = 1;
const MAX_PREFERRED_SHANTEN = 3;
const MAX_GENERATION_ATTEMPTS = 160;

export function generateQuizQuestion(evaluate: SanmaEvaluator): QuizQuestion {
  let fallback: QuizQuestion | undefined;

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const hand = createRandomSanmaHand();
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
