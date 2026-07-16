import { describe, expect, it } from "vitest";
import { generateQuizQuestion } from "@/lib/quiz";
import { PINZU_TILE_INDICES, SOUZU_TILE_INDICES } from "@/lib/tiles";
import type { HandEvaluation, SanmaEvaluator } from "@/lib/types";

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
});
