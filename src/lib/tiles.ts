import type { TileCount, TileIndex } from "@/lib/types";

export const TILE_KIND_COUNT = 34;
export const HAND_TILE_COUNT = 14;
export const SANMA_TILE_INDICES: readonly TileIndex[] = [
  0,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  21,
  22,
  23,
  24,
  25,
  26,
  27,
  28,
  29,
  30,
  31,
  32,
  33,
];

export const QUIZ_HAND_TILE_INDICES: readonly TileIndex[] = [
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  21,
  22,
  23,
  24,
  25,
  26,
];

const TILE_LABELS = [
  "1m",
  "2m",
  "3m",
  "4m",
  "5m",
  "6m",
  "7m",
  "8m",
  "9m",
  "1p",
  "2p",
  "3p",
  "4p",
  "5p",
  "6p",
  "7p",
  "8p",
  "9p",
  "1s",
  "2s",
  "3s",
  "4s",
  "5s",
  "6s",
  "7s",
  "8s",
  "9s",
  "東",
  "南",
  "西",
  "北",
  "白",
  "發",
  "中",
] as const;

export function tileLabel(tileIndex: TileIndex): string {
  return TILE_LABELS[tileIndex] ?? "不明な牌";
}

export function isSanmaTile(tileIndex: TileIndex): boolean {
  return SANMA_TILE_INDICES.includes(tileIndex);
}

export function sortHand(hand: readonly TileIndex[]): TileIndex[] {
  return [...hand].sort((left, right) => left - right);
}

export function toTileCounts(hand: readonly TileIndex[]): TileCount {
  const counts = Array<number>(TILE_KIND_COUNT).fill(0);
  for (const tileIndex of hand) {
    if (!isSanmaTile(tileIndex)) {
      throw new Error(`${tileLabel(tileIndex)}は三人麻雀では使用しません。`);
    }
    counts[tileIndex] += 1;
    if (counts[tileIndex] > 4) {
      throw new Error(`${tileLabel(tileIndex)}は4枚までです。`);
    }
  }
  return counts;
}

export function createRandomSanmaHand(random: () => number = Math.random): TileIndex[] {
  const counts = Array<number>(TILE_KIND_COUNT).fill(0);
  const hand: TileIndex[] = [];

  while (hand.length < HAND_TILE_COUNT) {
    const firstTile = chooseTile(
      QUIZ_HAND_TILE_INDICES.filter((tileIndex) => {
        if (counts[tileIndex] >= 4) {
          return false;
        }
        return connectedQuizTiles(tileIndex).some(
          (connectedTile) => counts[connectedTile] + Number(connectedTile === tileIndex) < 4,
        );
      }),
      random,
    );
    const secondTile = chooseTile(
      connectedQuizTiles(firstTile).filter(
        (tileIndex) => counts[tileIndex] + Number(tileIndex === firstTile) < 4,
      ),
      random,
    );

    hand.push(firstTile, secondTile);
    counts[firstTile] += 1;
    counts[secondTile] += 1;
  }
  return sortHand(hand);
}

export function hasCompletelyIsolatedTile(hand: readonly TileIndex[]): boolean {
  return hand.some(
    (tileIndex, position) =>
      !hand.some(
        (otherTile, otherPosition) =>
          position !== otherPosition && connectedQuizTiles(tileIndex).includes(otherTile),
      ),
  );
}

function connectedQuizTiles(tileIndex: TileIndex): TileIndex[] {
  return QUIZ_HAND_TILE_INDICES.filter((candidate) => {
    const sameSuit = (tileIndex <= 17 && candidate <= 17) || (tileIndex >= 18 && candidate >= 18);
    return sameSuit && Math.abs(tileIndex - candidate) <= 2;
  });
}

function chooseTile(tiles: readonly TileIndex[], random: () => number): TileIndex {
  if (tiles.length === 0) {
    throw new Error("つながりのある配牌を生成できませんでした。");
  }
  return tiles[Math.floor(random() * tiles.length)];
}
