"use client";

import { useState } from "react";
import { MahjongTile } from "@/components/mahjong-tile";
import { classifyMistake, MISTAKE_TYPE_LABELS } from "@/lib/mistake-classification";
import { isCorrectDiscard, nextDrawTenpaiProbability } from "@/lib/quiz";
import { tileLabel } from "@/lib/tiles";
import type { MistakeType } from "@/lib/mistake-classification";
import type { DiscardEvaluation, QuizMode, QuizQuestion, TileIndex } from "@/lib/types";

type AnswerRecordResult = "saved" | "mastered" | null;

type QuizCardProps = {
  mode: QuizMode;
  question: QuizQuestion;
  reviewCount: number;
  onAnswer: (
    discard: string,
    correct: boolean,
    mistakeTypes: readonly MistakeType[],
  ) => AnswerRecordResult;
  onModeChange: (mode: QuizMode) => void;
  onNextQuestion: () => void;
  onRefreshQuestion: () => void;
};

export function QuizCard({
  mode,
  question,
  reviewCount,
  onAnswer,
  onModeChange,
  onNextQuestion,
  onRefreshQuestion,
}: QuizCardProps) {
  const [selectedDiscard, setSelectedDiscard] = useState<string | null>(null);
  const [answeredDiscard, setAnsweredDiscard] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [answerRecordResult, setAnswerRecordResult] = useState<AnswerRecordResult>(null);
  const selectedCandidate = question.evaluation.candidates.find(
    (candidate) => candidate.discard === selectedDiscard,
  );
  const answeredCandidate = question.evaluation.candidates.find(
    (candidate) => candidate.discard === answeredDiscard,
  );
  const bestCandidate = question.evaluation.candidates.find(
    (candidate) => question.evaluation.bestDiscards.includes(candidate.discard),
  );
  const correct = answeredDiscard !== null && isCorrectDiscard(answeredDiscard, question.evaluation);
  const mistakeTypes =
    answeredDiscard === null ? [] : classifyMistake(answeredDiscard, question.evaluation);
  const tenpaiProbability =
    correct && answeredCandidate !== undefined
      ? nextDrawTenpaiProbability(answeredCandidate)
      : undefined;
  const sameShanten =
    answeredCandidate !== undefined &&
    bestCandidate !== undefined &&
    answeredCandidate.shanten === bestCandidate.shanten;
  const evaluationDifference =
    answeredCandidate !== undefined && bestCandidate !== undefined && sameShanten
      ? bestCandidate.totalUkeire - answeredCandidate.totalUkeire
      : answeredCandidate !== undefined && bestCandidate !== undefined
        ? answeredCandidate.shanten - bestCandidate.shanten
        : 0;
  const bestCandidates = question.evaluation.candidates.filter((candidate) =>
    question.evaluation.bestDiscards.includes(candidate.discard),
  );
  const displayedCandidates =
    selectedCandidate === undefined
      ? bestCandidates
      : [
          selectedCandidate,
          ...bestCandidates.filter((candidate) => candidate.discard !== selectedCandidate.discard),
        ];

  function nextQuestion(): void {
    setSelectedDiscard(null);
    setAnsweredDiscard(null);
    setAnswered(false);
    setAnswerRecordResult(null);
    onNextQuestion();
  }

  function refreshQuestion(): void {
    setSelectedDiscard(null);
    setAnsweredDiscard(null);
    setAnswered(false);
    setAnswerRecordResult(null);
    onRefreshQuestion();
  }

  function changeMode(nextMode: QuizMode): void {
    if (nextMode === mode) {
      return;
    }
    setSelectedDiscard(null);
    setAnsweredDiscard(null);
    setAnswered(false);
    setAnswerRecordResult(null);
    onModeChange(nextMode);
  }

  return (
    <section className="quiz-card" aria-live="polite">
      <button
        className="refresh-button"
        type="button"
        title="新しい問題に更新"
        aria-label="問題を更新"
        onClick={refreshQuestion}
      >
        ↻
      </button>
      <div className="mode-selector" aria-label="出題モード">
        <button
          className={mode === "standard" ? "is-selected" : ""}
          type="button"
          aria-pressed={mode === "standard"}
          onClick={() => changeMode("standard")}
        >
          通常
        </button>
        <button
          className={mode === "flush" ? "is-selected" : ""}
          type="button"
          aria-pressed={mode === "flush"}
          onClick={() => changeMode("flush")}
        >
          染め手
        </button>
        <button
          className={mode === "review" ? "is-selected" : ""}
          type="button"
          aria-pressed={mode === "review"}
          disabled={reviewCount === 0}
          onClick={() => changeMode("review")}
        >
          復習（{reviewCount}）
        </button>
      </div>
      <p className="mode-hint">
        {mode === "flush"
          ? "筒子または索子だけの一色手です。"
          : mode === "review"
            ? "間違えた問題を端末内の記録から再出題します。"
            : "筒子・索子から出題します。"}
      </p>
      <p className="shanten-hint">現在のシャンテン数：{question.evaluation.currentShanten}</p>
      <div
        className="hand-row"
        aria-label={`手牌：${question.hand.map((tileIndex) => tileLabel(tileIndex)).join("、")}`}
      >
        {question.hand.map((tileIndex, position) => (
          <span className="hand-tile" key={`${tileIndex}-${position}`}>
            <MahjongTile decorative tileIndex={tileIndex} className="hand-tile-image" />
          </span>
        ))}
      </div>
      <h2>切る牌を選んでください</h2>
      <div className="discard-selector" aria-label="打牌候補">
        {question.evaluation.candidates.map((candidate) => {
          const tileIndex = tileIndexForLabel(candidate.discard);
          return (
            <button
              className={`discard-button ${selectedDiscard === candidate.discard ? "is-selected" : ""}`}
              key={candidate.discard}
              type="button"
              aria-label={`${candidate.discard}を選択`}
              aria-pressed={selectedDiscard === candidate.discard}
              onClick={() => setSelectedDiscard(candidate.discard)}
            >
              {tileIndex === undefined ? (
                candidate.discard
              ) : (
                <MahjongTile decorative tileIndex={tileIndex} className="discard-tile-image" />
              )}
              <span className="sr-only">{candidate.discard}</span>
            </button>
          );
        })}
      </div>

      {!answered ? (
        <button
          className="answer-button"
          type="button"
          disabled={selectedDiscard === null}
          onClick={() => {
            if (selectedDiscard === null) {
              return;
            }
            const isCorrect = isCorrectDiscard(selectedDiscard, question.evaluation);
            const selectedMistakeTypes = classifyMistake(
              selectedDiscard,
              question.evaluation,
            );
            setAnsweredDiscard(selectedDiscard);
            setAnswered(true);
            setAnswerRecordResult(
              onAnswer(selectedDiscard, isCorrect, selectedMistakeTypes),
            );
          }}
        >
          回答する
        </button>
      ) : (
        <div className={`answer-result ${correct ? "is-correct" : "is-incorrect"}`}>
          <p>
            あなたの選択：<TileLabel label={answeredDiscard ?? ""} />
          </p>
          <h3>{correct ? "正解！" : "不正解"}</h3>
          <p>
            最善打：
            {question.evaluation.bestDiscards.map((discard, index) => (
              <span key={discard}>
                {index > 0 ? "、" : null}
                <TileLabel label={discard} />
              </span>
            ))}
          </p>
          <p>
            {sameShanten ? "受け入れ差" : "シャンテン差"}：{evaluationDifference}
            {sameShanten ? "枚" : ""}
          </p>
          {correct || mistakeTypes.length === 0 ? null : (
            <div className="mistake-tags" aria-label="ミス分類">
              <span className="mistake-tags-label">ミス分類</span>
              {mistakeTypes.map((mistakeType) => (
                <span key={mistakeType}>{MISTAKE_TYPE_LABELS[mistakeType]}</span>
              ))}
            </div>
          )}
          {tenpaiProbability !== undefined ? (
            <div className="tenpai-probability">
              <p>
                次の1ツモでテンパイする確率（概算）：
                <strong>{tenpaiProbability.percentage.toFixed(1)}%</strong>
                {answeredCandidate?.shanten === 1
                  ? `（${tenpaiProbability.effectiveCount}/${tenpaiProbability.unknownCount}枚）`
                  : `（${answeredCandidate?.shanten ?? 0}シャンテンのため）`}
              </p>
              <p>山・河・他家を考慮せず、自分の打牌後13枚だけが見えている前提です。</p>
            </div>
          ) : null}
          {answerRecordResult === "saved" ? (
            <p className="review-notice">この問題を復習リストに保存しました。</p>
          ) : null}
          {answerRecordResult === "mastered" ? (
            <p className="review-notice">正解したため、復習リストから外しました。</p>
          ) : null}
          <p className="comparison-hint">
            牌をタップすると、有効牌とテンパイ後の待ち質を比較できます。
          </p>
          {selectedCandidate !== undefined ? (
            <p className="comparison-label">
              比較中：<TileLabel label={selectedCandidate.discard} />切り
            </p>
          ) : null}
          <div className="candidate-list">
            {displayedCandidates.map((candidate) => (
              <CandidateResult
                active={candidate.discard === selectedDiscard}
                candidate={candidate}
                key={candidate.discard}
              />
            ))}
          </div>
          <button className="next-button" type="button" onClick={nextQuestion}>
            次の問題
          </button>
        </div>
      )}
    </section>
  );
}

function CandidateResult({ active, candidate }: { active: boolean; candidate: DiscardEvaluation }) {
  return (
    <article className={`candidate-result ${active ? "is-active" : ""}`}>
      <h4>
        <TileLabel label={candidate.discard} />切り
      </h4>
      <p>シャンテン数：{candidate.shanten}</p>
      <p>
        有効牌：
        {candidate.effectiveTiles.length === 0
          ? "なし"
          : candidate.effectiveTiles.map((tile, index) => (
              <span key={tile.tile}>
                {index > 0 ? "、" : null}
                <TileLabel label={tile.tile} />×{tile.remaining}
              </span>
            ))}
      </p>
      <p>合計：{candidate.totalUkeire}枚</p>
      {candidate.tenpaiQuality === null ? null : (
        <TenpaiQualityResult candidate={candidate} />
      )}
    </article>
  );
}

function TenpaiQualityResult({ candidate }: { candidate: DiscardEvaluation }) {
  const quality = candidate.tenpaiQuality;
  if (quality === null) {
    return null;
  }

  const total = quality.goodShapeUkeire + quality.badShapeUkeire;
  const goodRate = total === 0 ? 0 : (quality.goodShapeUkeire / total) * 100;
  const averageWaitCount = total === 0 ? 0 : quality.weightedWaitCount / total;

  return (
    <div className="wait-quality">
      <p>
        良型テンパイ：<strong>{quality.goodShapeUkeire}枚</strong>／愚形：
        {quality.badShapeUkeire}枚
      </p>
      <p>
        良型率：{goodRate.toFixed(1)}%・テンパイ時平均待ち：{averageWaitCount.toFixed(1)}枚
      </p>
      <p>良型は、最大待ち枚数のテンパイ取りに両面待ちを含む形です。</p>
    </div>
  );
}

function TileLabel({ label }: { label: string }) {
  const tileIndex = tileIndexForLabel(label);
  if (tileIndex === undefined) {
    return <>{label}</>;
  }

  return (
    <span className="result-tile">
      <MahjongTile decorative tileIndex={tileIndex} className="result-tile-image" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

function tileIndexForLabel(label: string): TileIndex | undefined {
  for (let tileIndex = 0; tileIndex < 34; tileIndex += 1) {
    if (tileLabel(tileIndex) === label) {
      return tileIndex;
    }
  }
  return undefined;
}
