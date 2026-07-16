"use client";

import { useState } from "react";
import { MahjongTile } from "@/components/mahjong-tile";
import { isCorrectDiscard } from "@/lib/quiz";
import { tileLabel } from "@/lib/tiles";
import type { DiscardEvaluation, QuizMode, QuizQuestion, TileIndex } from "@/lib/types";

type QuizCardProps = {
  mode: QuizMode;
  question: QuizQuestion;
  onModeChange: (mode: QuizMode) => void;
  onNextQuestion: () => void;
  onRefreshQuestion: () => void;
};

export function QuizCard({
  mode,
  question,
  onModeChange,
  onNextQuestion,
  onRefreshQuestion,
}: QuizCardProps) {
  const [selectedDiscard, setSelectedDiscard] = useState<string | null>(null);
  const [answeredDiscard, setAnsweredDiscard] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
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
  const ukeireDifference =
    answeredCandidate !== undefined && bestCandidate !== undefined
      ? bestCandidate.totalUkeire - answeredCandidate.totalUkeire
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
    onNextQuestion();
  }

  function refreshQuestion(): void {
    setSelectedDiscard(null);
    setAnsweredDiscard(null);
    setAnswered(false);
    onRefreshQuestion();
  }

  function changeMode(nextMode: QuizMode): void {
    if (nextMode === mode) {
      return;
    }
    setSelectedDiscard(null);
    setAnsweredDiscard(null);
    setAnswered(false);
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
      </div>
      <p className="mode-hint">
        {mode === "flush" ? "筒子または索子だけの一色手です。" : "筒子・索子から出題します。"}
      </p>
      <p className="shanten-hint">現在のシャンテン数：{question.evaluation.currentShanten}</p>
      <h2>切る牌を選んでください</h2>
      <div className="tile-grid" aria-label="手牌">
        {question.hand.map((tileIndex, position) => {
          const label = tileLabel(tileIndex);
          return (
            <button
              className={`tile-button ${selectedDiscard === label ? "is-selected" : ""}`}
              key={`${tileIndex}-${position}`}
              type="button"
              aria-label={`${label}を選択`}
              aria-pressed={selectedDiscard === label}
              onClick={() => setSelectedDiscard(label)}
            >
              <MahjongTile decorative tileIndex={tileIndex} className="hand-tile-image" />
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
            setAnsweredDiscard(selectedDiscard);
            setAnswered(true);
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
          <p>受け入れ差：{ukeireDifference}枚</p>
          <p className="comparison-hint">牌をタップすると、その打牌の有効牌を比較できます。</p>
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
    </article>
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
