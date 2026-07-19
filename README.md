# 三人麻雀 牌効率クイズ

三人麻雀の14枚手牌から打牌を選び、シャンテン数と受け入れ枚数だけで牌効率を練習する Next.js アプリです。問題の配牌は筒子・索子のみで生成し、完全な孤立牌は出しません。通常モードに加え、筒子または索子だけで構成する染め手モードと、間違えた問題を解き直す復習モードを選べます。鳴き・河・ドラ・点数・巡目などは扱いません。

## 技術構成

- Next.js 16 / TypeScript / App Router
- Rust / WebAssembly / `wasm-bindgen`
- シャンテン計算: [`xiangting` 5.0.6](https://crates.io/crates/xiangting)

Rust 側は `xiangting::calculate_replacement_number`、`xiangting::calculate_necessary_tiles`、`xiangting::calculate_unnecessary_tiles` に `PlayerCount::Three` を指定します。必要牌フラグから各打牌のシャンテン数・有効牌・残り枚数を求め、1シャンテン時は有効牌を引いた後の全テンパイ打牌も比較します。

待ち質の比較では、各有効牌を引いた後に待ち枚数が最大になるテンパイ取りを選び、その形に両面待ちが含まれれば「良型」、含まれなければ「愚形」とします。牌の残り枚数で重み付けした良型・愚形の受け入れ、良型率、テンパイ時の平均待ち枚数を回答後に表示します。

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

ブラウザで `http://localhost:3000` を開きます。WASMのロード後に14枚の手牌が表示され、牌を選んで「回答する」を押すと選択中の打牌と最善打の結果、有効牌、良型・愚形の比較を確認できます。「染め手」を選ぶと、筒子または索子だけの一色手が出題されます。

不正解の手牌はブラウザの `localStorage` に最大100件保存され、「復習」から再出題されます。同じ手牌を複数回間違えた場合は1件にまとめて回数を記録し、復習モードで正解すると記録から外れます。誤答はシャンテン戻し・受け入れ不足・有効牌の種類減少・良型率低下に分類し、分類ごとの回数も端末内へ保存します。正解時は、最善打後の次の1ツモでテンパイする確率も概算表示します。

## GitHub Pages

`main` ブランチへのpushで `.github/workflows/deploy-pages.yml` が実行され、静的エクスポートした `out/` をGitHub Pagesへデプロイします。リポジトリの **Settings → Pages → Build and deployment → Source** で **GitHub Actions** を選択してください。

プロジェクトサイトのURLは `https://<GitHubユーザー名>.github.io/sanma-tile-efficiency-quiz/` です。非公開リポジトリからPagesを使うにはGitHub Pro以上が必要で、個人アカウントのPagesサイトは公開されます。

全ページに `noindex, nofollow, noarchive, nosnippet` を設定し、`robots.txt` でも全クローラーを拒否します。外部ページへ移動した際にこのサイトのURLを送らない `no-referrer` も設定します。これらは検索・共有経由の露出を抑制する設定であり、URLを知っている利用者からページを非公開にするアクセス制限ではありません。

## 検証コマンド

```sh
cargo test --manifest-path wasm/Cargo.toml
npm test
npm run typecheck
npm run build
```

## 制限事項

- 問題生成はランダム試行で1〜3シャンテンを優先します。指定回数で見つからない場合も、テンパイ・和了手を除いたフォールバック手牌を使います。
- 受け入れ枚数は手牌に見えている枚数だけを差し引きます。河・副露・ドラ・赤牌・他家の情報は考慮しません。
- 次巡テンパイ確率は1シャンテン時の受け入れ枚数を、三麻108枚から打牌後の自牌13枚を引いた95枚で割る概算です。山・河・他家の見えている牌は考慮しません。
- 良型判定は通常手の両面待ちを含むかだけで分類します。多面待ちは両面部分を含めば良型ですが、役・打点・フリテン・場況は評価しません。
- 復習記録はブラウザごとの端末内保存です。別端末との同期やブラウザデータ削除後の復元には対応しません。
- 牌はSVG画像で表示します。赤ドラの画像は使わず、通常の5として扱います。

## 牌画像の帰属

数牌の画像は `react-riichi-mahjong-tiles` 2.1.0 のSVGコンポーネントを使用しています。字牌はテキスト表示です。詳細は [ATTRIBUTIONS.md](ATTRIBUTIONS.md) を参照してください。
