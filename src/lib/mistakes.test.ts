import { beforeEach, describe, expect, it } from "vitest";
import {
  MAX_SAVED_MISTAKES,
  chooseReviewMistake,
  loadMistakes,
  recordMistake,
  removeMistake,
} from "@/lib/mistakes";

const hand = [9, 9, 10, 10, 11, 11, 12, 12, 18, 18, 19, 19, 20, 20];

describe("mistake storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("stores duplicate hands as one pattern and increments the count", () => {
    recordMistake(
      { hand, mode: "standard", selectedDiscard: "1p" },
      window.localStorage,
      () => "2026-07-17T00:00:00.000Z",
    );
    recordMistake(
      { hand, mode: "standard", selectedDiscard: "2p" },
      window.localStorage,
      () => "2026-07-17T00:01:00.000Z",
    );

    expect(loadMistakes(window.localStorage)).toEqual([
      {
        id: hand.join(","),
        hand,
        mode: "standard",
        mistakeCount: 2,
        lastSelectedDiscard: "2p",
        lastMistakeAt: "2026-07-17T00:01:00.000Z",
      },
    ]);
  });

  it("removes a mastered review hand", () => {
    recordMistake(
      { hand, mode: "flush", selectedDiscard: "1p" },
      window.localStorage,
    );

    expect(removeMistake(hand, window.localStorage)).toEqual([]);
    expect(loadMistakes(window.localStorage)).toEqual([]);
  });

  it("chooses a saved hand for review", () => {
    const mistakes = recordMistake(
      { hand, mode: "standard", selectedDiscard: "1p" },
      window.localStorage,
    );

    expect(chooseReviewMistake(mistakes, () => 0)).toEqual(mistakes[0]);
  });

  it("keeps at most one hundred patterns", () => {
    const baseHand = [9, 9, 9, 9, 10, 10, 10, 10, 11, 11, 11, 11];
    const variableTiles = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26];
    const uniqueHands: number[][] = [];
    for (let left = 0; left < variableTiles.length; left += 1) {
      for (let right = left; right < variableTiles.length; right += 1) {
        uniqueHands.push([...baseHand, variableTiles[left], variableTiles[right]]);
      }
    }

    uniqueHands.slice(0, MAX_SAVED_MISTAKES + 1).forEach((uniqueHand, index) => {
      recordMistake(
        {
          hand: uniqueHand,
          mode: "standard",
          selectedDiscard: "1p",
        },
        window.localStorage,
        () => `2026-07-17T00:${String(index).padStart(2, "0")}:00.000Z`,
      );
    });

    expect(loadMistakes(window.localStorage)).toHaveLength(MAX_SAVED_MISTAKES);
  });
});
