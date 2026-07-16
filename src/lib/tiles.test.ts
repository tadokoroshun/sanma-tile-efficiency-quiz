import { describe, expect, it } from "vitest";
import {
  HAND_TILE_COUNT,
  PINZU_TILE_INDICES,
  QUIZ_HAND_TILE_INDICES,
  SANMA_TILE_INDICES,
  SOUZU_TILE_INDICES,
  createRandomSanmaHand,
  hasCompletelyIsolatedTile,
  isSanmaTile,
  sortHand,
  toTileCounts,
} from "@/lib/tiles";

describe("sanma hand generation", () => {
  it("generates exactly fourteen tiles", () => {
    expect(createRandomSanmaHand("standard", () => 0.5)).toHaveLength(HAND_TILE_COUNT);
  });

  it("never generates more than four copies of a tile", () => {
    const counts = toTileCounts(createRandomSanmaHand("standard", () => 0.5));
    expect(counts.every((count) => count <= 4)).toBe(true);
  });

  it("generates only pinzu and souzu for quiz hands", () => {
    const hand = createRandomSanmaHand("standard", () => 0.5);
    expect(hand.every((tileIndex) => QUIZ_HAND_TILE_INDICES.includes(tileIndex))).toBe(true);
    expect(QUIZ_HAND_TILE_INDICES).not.toContain(0);
    expect(QUIZ_HAND_TILE_INDICES).not.toContain(8);
    expect(QUIZ_HAND_TILE_INDICES).not.toContain(27);
    expect(SANMA_TILE_INDICES.every(isSanmaTile)).toBe(true);
  });

  it("generates a flush hand from only one suit", () => {
    const pinzuHand = createRandomSanmaHand("flush", () => 0);
    const souzuHand = createRandomSanmaHand("flush", () => 0.99);

    expect(pinzuHand.every((tileIndex) => PINZU_TILE_INDICES.includes(tileIndex))).toBe(true);
    expect(souzuHand.every((tileIndex) => SOUZU_TILE_INDICES.includes(tileIndex))).toBe(true);
  });

  it("sorts manzu, pinzu, souzu, then honors", () => {
    expect(sortHand([33, 18, 8, 9, 0, 27])).toEqual([0, 8, 9, 18, 27, 33]);
  });

  it("does not generate completely isolated tiles", () => {
    const randomValues = [0.04, 0.18, 0.32, 0.46, 0.61, 0.74, 0.88];
    let position = 0;
    const hand = createRandomSanmaHand("standard", () => {
      const value = randomValues[position % randomValues.length];
      position += 1;
      return value;
    });

    expect(hasCompletelyIsolatedTile(hand)).toBe(false);
  });
});
