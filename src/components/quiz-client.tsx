"use client";

import { useCallback, useEffect, useState } from "react";
import { QuizCard } from "@/components/quiz-card";
import { generateQuizQuestion } from "@/lib/quiz";
import type { QuizMode, QuizQuestion, SanmaEvaluator } from "@/lib/types";
import { loadSanmaEvaluator } from "@/lib/wasm";

type Status = "loading" | "ready" | "error";

export function QuizClient() {
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [evaluator, setEvaluator] = useState<SanmaEvaluator | null>(null);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [mode, setMode] = useState<QuizMode>("standard");

  const createQuestion = useCallback((nextEvaluator: SanmaEvaluator, nextMode: QuizMode): void => {
    try {
      setQuestion(generateQuizQuestion(nextEvaluator, nextMode));
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
      onModeChange={(nextMode) => {
        setMode(nextMode);
        createQuestion(evaluator, nextMode);
      }}
      onNextQuestion={() => createQuestion(evaluator, mode)}
      onRefreshQuestion={() => createQuestion(evaluator, mode)}
    />
  );
}
