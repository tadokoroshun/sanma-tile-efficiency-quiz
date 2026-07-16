import { describe, expect, it } from "vitest";
import {
  UNKNOWN_SANMA_TILES_AFTER_DISCARD,
  generateQuizQuestion,
  nextDrawTenpaiProbability,
} from "@/lib/quiz";
import { PINZU_TILE_INDICES, SOUZU_TILE_INDICES } from "@/lib/tiles";
import type { DiscardEvaluation, HandEvaluation, SanmaEvaluator } from "@/lib/types";

function evaluationWithShanten(currentShanten: number): HandEvaluation {
  return {
    currentShanten,
    candidates: [],
    bestDiscards: [],
  };
}

describe("quiz generation", () => {
  it("skips tenpai hands", () => {
    let calls = 0;
    const evaluate: SanmaEvaluator = () => {
      const currentShanten = calls === 0 ? 0 : 1;
      calls += 1;
      return evaluationWithShanten(currentShanten);
    };

    const question = generateQuizQuestion(evaluate);

    expect(question.evaluation.currentShanten).toBe(1);
    expect(calls).toBe(2);
  });

  it("passes flush mode through to hand generation", () => {
    const question = generateQuizQuestion(() => evaluationWithShanten(1), "flush");
    const onlyPinzu = question.hand.every((tileIndex) => PINZU_TILE_INDICES.includes(tileIndex));
    const onlySouzu = question.hand.every((tileIndex) => SOUZU_TILE_INDICES.includes(tileIndex));

    expect(onlyPinzu || onlySouzu).toBe(true);
  });

  it("estimates the next-draw tenpai probability from ukeire", () => {
    const candidate: DiscardEvaluation = {
      discard: "1p",
      shanten: 1,
      effectiveTiles: [],
      totalUkeire: 12,
    };

    expect(nextDrawTenpaiProbability(candidate)).toEqual({
      effectiveCount: 12,
      unknownCount: UNKNOWN_SANMA_TILES_AFTER_DISCARD,
      percentage: (12 / 95) * 100,
    });
  });

  it("returns zero when one draw cannot reach tenpai", () => {
    const candidate: DiscardEvaluation = {
      discard: "1p",
      shanten: 2,
      effectiveTiles: [],
      totalUkeire: 30,
    };

    expect(nextDrawTenpaiProbability(candidate).percentage).toBe(0);
  });
});
