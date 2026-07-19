import type { DiscardEvaluation, HandEvaluation } from "@/lib/types";

export const MISTAKE_TYPES = [
  "shanten-loss",
  "ukeire-loss",
  "effective-variety-loss",
  "good-shape-loss",
] as const;

export type MistakeType = (typeof MISTAKE_TYPES)[number];

export const MISTAKE_TYPE_LABELS: Record<MistakeType, string> = {
  "shanten-loss": "シャンテン戻し",
  "ukeire-loss": "受け入れ不足",
  "effective-variety-loss": "有効牌の種類減少",
  "good-shape-loss": "良型率低下",
};

export function classifyMistake(
  selectedDiscard: string,
  evaluation: HandEvaluation,
): MistakeType[] {
  if (evaluation.bestDiscards.includes(selectedDiscard)) {
    return [];
  }

  const selected = evaluation.candidates.find(
    (candidate) => candidate.discard === selectedDiscard,
  );
  const best = evaluation.candidates.find((candidate) =>
    evaluation.bestDiscards.includes(candidate.discard),
  );
  if (selected === undefined || best === undefined) {
    return [];
  }

  if (selected.shanten > best.shanten) {
    return ["shanten-loss"];
  }

  const mistakeTypes: MistakeType[] = [];
  if (selected.totalUkeire < best.totalUkeire) {
    mistakeTypes.push("ukeire-loss");
  }
  if (selected.effectiveTiles.length < best.effectiveTiles.length) {
    mistakeTypes.push("effective-variety-loss");
  }

  const selectedGoodRate = goodShapeRate(selected);
  const bestGoodRate = goodShapeRate(best);
  if (
    selectedGoodRate !== undefined &&
    bestGoodRate !== undefined &&
    selectedGoodRate < bestGoodRate
  ) {
    mistakeTypes.push("good-shape-loss");
  }

  return mistakeTypes;
}

function goodShapeRate(candidate: DiscardEvaluation): number | undefined {
  const quality = candidate.tenpaiQuality;
  if (quality === null) {
    return undefined;
  }
  const total = quality.goodShapeUkeire + quality.badShapeUkeire;
  return total === 0 ? 0 : quality.goodShapeUkeire / total;
}
