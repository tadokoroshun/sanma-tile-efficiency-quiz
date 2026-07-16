import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QuizCard } from "@/components/quiz-card";
import type { QuizQuestion } from "@/lib/types";

function resultText(text: string): HTMLElement {
  return screen.getByText((_, element) => element?.textContent === text);
}

const question: QuizQuestion = {
  hand: [0, 0, 8, 8, 9, 10, 11, 18, 19, 20, 27, 27, 28, 29],
  evaluation: {
    currentShanten: 1,
    bestDiscards: ["1m", "9m"],
    candidates: [
      {
        discard: "1m",
        shanten: 1,
        effectiveTiles: [{ tile: "2p", remaining: 4 }],
        totalUkeire: 4,
      },
      {
        discard: "9m",
        shanten: 1,
        effectiveTiles: [{ tile: "2p", remaining: 4 }],
        totalUkeire: 4,
      },
      {
        discard: "1p",
        shanten: 1,
        effectiveTiles: [{ tile: "2p", remaining: 2 }],
        totalUkeire: 2,
      },
      {
        discard: "3p",
        shanten: 2,
        effectiveTiles: [{ tile: "4p", remaining: 3 }],
        totalUkeire: 3,
      },
    ],
  },
};

describe("QuizCard", () => {
  it("shows the answer result only after answering", () => {
    render(
      <QuizCard
        mode="standard"
        question={question}
        onModeChange={vi.fn()}
        onNextQuestion={vi.fn()}
        onRefreshQuestion={vi.fn()}
      />,
    );

    expect(screen.queryByText("最善打：1m、9m")).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "1mを選択" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "回答する" }));

    expect(screen.getByText("正解！")).toBeInTheDocument();
    expect(resultText("最善打：1m、9m")).toBeInTheDocument();
    expect(screen.getAllByText((_, element) => element?.textContent === "有効牌：2p×4")).toHaveLength(2);
  });

  it("accepts every tied best discard as correct", () => {
    render(
      <QuizCard
        mode="standard"
        question={question}
        onModeChange={vi.fn()}
        onNextQuestion={vi.fn()}
        onRefreshQuestion={vi.fn()}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "9mを選択" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "回答する" }));

    expect(screen.getByText("正解！")).toBeInTheDocument();
    expect(resultText("受け入れ差：0枚")).toBeInTheDocument();
  });

  it("shows the tapped discard's effective tiles after answering", () => {
    render(
      <QuizCard
        mode="standard"
        question={question}
        onModeChange={vi.fn()}
        onNextQuestion={vi.fn()}
        onRefreshQuestion={vi.fn()}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "1mを選択" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "回答する" }));
    fireEvent.click(screen.getByRole("button", { name: "1pを選択" }));

    expect(resultText("あなたの選択：1m")).toBeInTheDocument();
    expect(resultText("比較中：1p切り")).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.textContent === "有効牌：2p×2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1pを選択" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { name: /^1p\s*切り$/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^9m\s*切り$/ })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /^3p\s*切り$/ })).not.toBeInTheDocument();
  });

  it("keeps the refresh button available before answering", () => {
    render(
      <QuizCard
        mode="standard"
        question={question}
        onModeChange={vi.fn()}
        onNextQuestion={vi.fn()}
        onRefreshQuestion={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "問題を更新" })).toBeVisible();
  });

  it("switches to flush mode", () => {
    const onModeChange = vi.fn();
    render(
      <QuizCard
        mode="standard"
        question={question}
        onModeChange={onModeChange}
        onNextQuestion={vi.fn()}
        onRefreshQuestion={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "染め手" }));

    expect(onModeChange).toHaveBeenCalledWith("flush");
  });
});
