import { describe, expect, it } from "vitest";
import { generateQuizQuestion } from "@/lib/quiz";
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
});
