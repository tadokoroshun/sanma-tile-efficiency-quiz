import type { HandEvaluation, SanmaEvaluator, TileCount } from "@/lib/types";

type WasmExports = {
  default: () => Promise<unknown>;
  evaluate_sanma_hand: (handJson: string) => string;
};

export async function loadSanmaEvaluator(): Promise<SanmaEvaluator> {
  const wasm = (await import("@/wasm/pkg/sanma_quiz_wasm")) as WasmExports;
  await wasm.default();

  return (hand: TileCount): HandEvaluation => {
    try {
      const result: unknown = JSON.parse(wasm.evaluate_sanma_hand(JSON.stringify(hand)));
      return parseHandEvaluation(result);
    } catch (error: unknown) {
      throw new Error(errorMessage(error));
    }
  };
}

function parseHandEvaluation(value: unknown): HandEvaluation {
  if (!isRecord(value) || !Array.isArray(value.candidates) || !Array.isArray(value.bestDiscards)) {
    throw new Error("WASMから不正な評価結果を受け取りました。");
  }
  if (typeof value.currentShanten !== "number") {
    throw new Error("WASMから不正なシャンテン数を受け取りました。");
  }

  const candidates = value.candidates.map(parseDiscardEvaluation);
  if (!value.bestDiscards.every((discard): discard is string => typeof discard === "string")) {
    throw new Error("WASMから不正な最善打を受け取りました。");
  }

  return {
    currentShanten: value.currentShanten,
    candidates,
    bestDiscards: value.bestDiscards,
  };
}

function parseDiscardEvaluation(value: unknown): HandEvaluation["candidates"][number] {
  if (
    !isRecord(value) ||
    typeof value.discard !== "string" ||
    typeof value.shanten !== "number" ||
    typeof value.totalUkeire !== "number" ||
    !Array.isArray(value.effectiveTiles)
  ) {
    throw new Error("WASMから不正な打牌候補を受け取りました。");
  }

  const effectiveTiles = value.effectiveTiles.map((tile) => {
    if (!isRecord(tile) || typeof tile.tile !== "string" || typeof tile.remaining !== "number") {
      throw new Error("WASMから不正な有効牌を受け取りました。");
    }
    return { tile: tile.tile, remaining: tile.remaining };
  });
  const tenpaiQuality = parseTenpaiQuality(value.tenpaiQuality);

  return {
    discard: value.discard,
    shanten: value.shanten,
    effectiveTiles,
    totalUkeire: value.totalUkeire,
    tenpaiQuality,
  };
}

function parseTenpaiQuality(
  value: unknown,
): HandEvaluation["candidates"][number]["tenpaiQuality"] {
  if (value === null) {
    return null;
  }
  if (
    !isRecord(value) ||
    typeof value.goodShapeUkeire !== "number" ||
    typeof value.badShapeUkeire !== "number" ||
    typeof value.weightedWaitCount !== "number"
  ) {
    throw new Error("WASMから不正なテンパイ形評価を受け取りました。");
  }

  return {
    goodShapeUkeire: value.goodShapeUkeire,
    badShapeUkeire: value.badShapeUkeire,
    weightedWaitCount: value.weightedWaitCount,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "WASMの計算中に不明なエラーが発生しました。";
}
