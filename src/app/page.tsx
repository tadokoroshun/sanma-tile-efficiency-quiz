import { QuizClient } from "@/components/quiz-client";

export default function Home() {
  return (
    <main>
      <header className="page-header">
        <p className="eyebrow">SANMA TILE EFFICIENCY</p>
        <h1>三人麻雀 牌効率クイズ</h1>
        <p>最もシャンテン数が小さく、受け入れが広い打牌を選びましょう。</p>
      </header>
      <QuizClient />
    </main>
  );
}
