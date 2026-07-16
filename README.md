# 三人麻雀 牌効率クイズ

三人麻雀の14枚手牌から打牌を選び、シャンテン数と受け入れ枚数だけで牌効率を練習する Next.js アプリです。問題の配牌は筒子・索子のみで生成し、完全な孤立牌は出しません。鳴き・河・ドラ・点数・巡目などは扱いません。

## 技術構成

- Next.js 16 / TypeScript / App Router
- Rust / WebAssembly / `wasm-bindgen`
- シャンテン計算: [`xiangting` 5.0.6](https://crates.io/crates/xiangting)

Rust 側は `xiangting::calculate_replacement_number` と `xiangting::calculate_necessary_tiles` に `PlayerCount::Three` を指定します。後者が返す置換数（シャンテン数+1）と有効牌フラグから、各打牌のシャンテン数・有効牌・残り枚数を求めます。

三人麻雀で使わない2m〜8mは、手牌生成、入力検証、有効牌表示のすべてで除外します。通常手、七対子、国士無双は `xiangting` の計算結果に含まれます。

## 必要環境

- Node.js 24 LTS 以上
- Rust stable
- `wasm32-unknown-unknown` ターゲット
- `wasm-bindgen-cli` 0.2.126

Node.js が古い場合は先に更新してください。

## セットアップ

```sh
npm install
rustup target add wasm32-unknown-unknown
cargo install wasm-bindgen-cli --version 0.2.126 --locked
npm run wasm:build
```

`npm run wasm:build` は `wasm/Cargo.toml` をリリースビルドし、`src/wasm/pkg/` に JavaScript バインディングと `.wasm` を生成します。この生成物は Git 管理対象外です。

## 起動

```sh
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。WASMのロード後に14枚の手牌が表示され、牌を選んで「回答する」を押すと全候補の結果と最善打を確認できます。

## GitHub Pages

`main` ブランチへのpushで `.github/workflows/deploy-pages.yml` が実行され、静的エクスポートした `out/` をGitHub Pagesへデプロイします。リポジトリの **Settings → Pages → Build and deployment → Source** で **GitHub Actions** を選択してください。

プロジェクトサイトのURLは `https://<GitHubユーザー名>.github.io/sanma-tile-efficiency-quiz/` です。非公開リポジトリからPagesを使うにはGitHub Pro以上が必要で、個人アカウントのPagesサイトは公開されます。

## 検証コマンド

```sh
cargo test --manifest-path wasm/Cargo.toml
npm test
npm run typecheck
npm run build
```

## 制限事項

- 問題生成はランダム試行で0〜3シャンテンを優先します。指定回数で見つからない場合も、和了手を除いたフォールバック手牌を使います。
- 受け入れ枚数は手牌に見えている枚数だけを差し引きます。河・副露・ドラ・赤牌・他家の情報は考慮しません。
- 牌はSVG画像で表示します。赤ドラの画像は使わず、通常の5として扱います。

## 牌画像の帰属

数牌の画像は `react-riichi-mahjong-tiles` 2.1.0 のSVGコンポーネントを使用しています。字牌はテキスト表示です。詳細は [ATTRIBUTIONS.md](ATTRIBUTIONS.md) を参照してください。
