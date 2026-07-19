"use client";

import { useCallback, useEffect, useState } from "react";
import { QuizCard } from "@/components/quiz-card";
import {
  chooseReviewMistake,
  loadMistakes,
  recordMistake,
  removeMistake,
} from "@/lib/mistakes";
import { generateQuizQuestion } from "@/lib/quiz";
import { toTileCounts } from "@/lib/tiles";
import type {
  GenerationMode,
  QuizMode,
  QuizQuestion,
  SanmaEvaluator,
} from "@/lib/types";
import { loadSanmaEvaluator } from "@/lib/wasm";

type Status = "loading" | "ready" | "error";

export function QuizClient() {
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [evaluator, setEvaluator] = useState<SanmaEvaluator | null>(null);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [mode, setMode] = useState<QuizMode>("standard");
  const [questionMode, setQuestionMode] = useState<GenerationMode>("standard");
  const [reviewCount, setReviewCount] = useState(0);

  const createQuestion = useCallback((nextEvaluator: SanmaEvaluator, nextMode: QuizMode): void => {
    try {
      if (nextMode === "review") {
        const mistakes = loadMistakes();
        setReviewCount(mistakes.length);
        const mistake = chooseReviewMistake(mistakes);
        if (mistake !== undefined) {
          setQuestion({
            hand: mistake.hand,
            evaluation: nextEvaluator(toTileCounts(mistake.hand)),
          });
          setQuestionMode(mistake.mode);
        } else {
          setMode("standard");
          setQuestion(generateQuizQuestion(nextEvaluator, "standard"));
          setQuestionMode("standard");
        }
      } else {
        setQuestion(generateQuizQuestion(nextEvaluator, nextMode));
        setQuestionMode(nextMode);
        setReviewCount(loadMistakes().length);
      }
      setErrorMessage(null);
      setStatus("ready");
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "問題を生成できませんでした。");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    let active = true;
    void loadSanmaEvaluator()
      .then((nextEvaluator) => {
        if (!active) {
          return;
        }
        setEvaluator(() => nextEvaluator);
        setReviewCount(loadMistakes().length);
        createQuestion(nextEvaluator, "standard");
      })
      .catch((error: unknown) => {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : "WASMを読み込めませんでした。");
          setStatus("error");
        }
      });
    return () => {
      active = false;
    };
  }, [createQuestion]);

  if (status === "loading") {
    return <p className="status-message">計算エンジンを読み込んでいます…</p>;
  }

  if (status === "error" || evaluator === null || question === null) {
    return (
      <div className="status-message error-message">
        <p>計算エンジンを読み込めませんでした。</p>
        {errorMessage !== null ? <p>{errorMessage}</p> : null}
        <button type="button" onClick={() => window.location.reload()}>
          再読み込み
        </button>
      </div>
    );
  }

  return (
    <QuizCard
      question={question}
      mode={mode}
      reviewCount={reviewCount}
      onAnswer={(discard, correct, mistakeTypes) => {
        if (!correct) {
          const mistakes = recordMistake({
            hand: question.hand,
            mode: questionMode,
            selectedDiscard: discard,
            mistakeTypes,
          });
          setReviewCount(mistakes.length);
          return "saved";
        }

        if (mode === "review") {
          const mistakes = removeMistake(question.hand);
          setReviewCount(mistakes.length);
          return "mastered";
        }

        return null;
      }}
      onModeChange={(nextMode) => {
        setMode(nextMode);
        createQuestion(evaluator, nextMode);
      }}
      onNextQuestion={() => createQuestion(evaluator, mode)}
      onRefreshQuestion={() => createQuestion(evaluator, mode)}
    />
  );
}
