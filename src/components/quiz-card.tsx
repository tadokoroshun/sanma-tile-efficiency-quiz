"use client";

import { useState } from "react";
import { MahjongTile } from "@/components/mahjong-tile";
import { isCorrectDiscard } from "@/lib/quiz";
import { tileLabel } from "@/lib/tiles";
import type { DiscardEvaluation, QuizQuestion, TileIndex } from "@/lib/types";

type QuizCardProps = {
  question: QuizQuestion;
  onNextQuestion: () => void;
  onRefreshQuestion: () => void;
};

export function QuizCard({ question, onNextQuestion, onRefreshQuestion }: QuizCardProps) {
  const [selectedDiscard, setSelectedDiscard] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const selectedCandidate = question.evaluation.candidates.find(
    (candidate) => candidate.discard === selectedDiscard,
  );
  const bestCandidate = question.evaluation.candidates.find(
    (candidate) => question.evaluation.bestDiscards.includes(candidate.discard),
  );
  const correct = selectedDiscard !== null && isCorrectDiscard(selectedDiscard, question.evaluation);
  const ukeireDifference =
    selectedCandidate !== undefined && bestCandidate !== undefined
      ? bestCandidate.totalUkeire - selectedCandidate.totalUkeire
      : 0;

  function nextQuestion(): void {
    setSelectedDiscard(null);
    setAnswered(false);
    onNextQuestion();
  }

  function refreshQuestion(): void {
    setSelectedDiscard(null);
    setAnswered(false);
    onRefreshQuestion();
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
              disabled={answered}
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
          onClick={() => setAnswered(true)}
        >
          回答する
        </button>
      ) : (
        <div className={`answer-result ${correct ? "is-correct" : "is-incorrect"}`}>
          <p>
            あなたの選択：<TileLabel label={selectedDiscard ?? ""} />
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
          <div className="candidate-list">
            {question.evaluation.candidates.map((candidate) => (
              <CandidateResult candidate={candidate} key={candidate.discard} />
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

function CandidateResult({ candidate }: { candidate: DiscardEvaluation }) {
  return (
    <article className="candidate-result">
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
