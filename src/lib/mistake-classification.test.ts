import { describe, expect, it } from "vitest";
import { classifyMistake } from "@/lib/mistake-classification";
import type { DiscardEvaluation, HandEvaluation } from "@/lib/types";

function candidate(
  discard: string,
  shanten: number,
  totalUkeire: number,
  effectiveTiles: DiscardEvaluation["effectiveTiles"],
  tenpaiQuality: DiscardEvaluation["tenpaiQuality"] = null,
): DiscardEvaluation {
  return { discard, shanten, totalUkeire, effectiveTiles, tenpaiQuality };
}

function evaluation(candidates: DiscardEvaluation[], bestDiscards: string[]): HandEvaluation {
  return { currentShanten: 1, candidates, bestDiscards };
}

describe("mistake classification", () => {
  it("prioritizes a shanten loss over other differences", () => {
    const result = classifyMistake(
      "1p",
      evaluation(
        [candidate("1p", 2, 30, []), candidate("9p", 1, 8, [])],
        ["9p"],
      ),
    );

    expect(result).toEqual(["shanten-loss"]);
  });

  it("classifies ukeire, effective variety, and good-shape losses", () => {
    const result = classifyMistake(
      "1p",
      evaluation(
        [
          candidate(
            "1p",
            1,
            2,
            [{ tile: "2p", remaining: 2 }],
            { goodShapeUkeire: 0, badShapeUkeire: 2, weightedWaitCount: 4 },
          ),
          candidate(
            "9p",
            1,
            8,
            [
              { tile: "2p", remaining: 4 },
              { tile: "5p", remaining: 4 },
            ],
            { goodShapeUkeire: 6, badShapeUkeire: 2, weightedWaitCount: 40 },
          ),
        ],
        ["9p"],
      ),
    );

    expect(result).toEqual([
      "ukeire-loss",
      "effective-variety-loss",
      "good-shape-loss",
    ]);
  });

  it("does not classify any tied best discard", () => {
    const result = classifyMistake(
      "1p",
      evaluation(
        [candidate("1p", 1, 8, []), candidate("9p", 1, 8, [])],
        ["1p", "9p"],
      ),
    );

    expect(result).toEqual([]);
  });
});
