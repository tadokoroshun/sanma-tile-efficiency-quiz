export type TileIndex = number;

export type TileCount = number[];

export type GenerationMode = "standard" | "flush";

export type QuizMode = GenerationMode | "review";

export type EffectiveTile = {
  tile: string;
  remaining: number;
};

export type TenpaiQuality = {
  goodShapeUkeire: number;
  badShapeUkeire: number;
  weightedWaitCount: number;
};

export type DiscardEvaluation = {
  discard: string;
  shanten: number;
  effectiveTiles: EffectiveTile[];
  totalUkeire: number;
  tenpaiQuality: TenpaiQuality | null;
};

export type HandEvaluation = {
  currentShanten: number;
  candidates: DiscardEvaluation[];
  bestDiscards: string[];
};

export type SanmaEvaluator = (hand: TileCount) => HandEvaluation;

export type QuizQuestion = {
  hand: TileIndex[];
  evaluation: HandEvaluation;
};
