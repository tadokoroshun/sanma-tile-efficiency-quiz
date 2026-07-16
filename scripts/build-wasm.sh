#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
CARGO_BIN="${CARGO_BIN:-${HOME}/.cargo/bin/cargo}"
WASM_BINDGEN_BIN="${WASM_BINDGEN_BIN:-${HOME}/.cargo/bin/wasm-bindgen}"

"$CARGO_BIN" build --manifest-path "$ROOT_DIR/wasm/Cargo.toml" --release --target wasm32-unknown-unknown
"$WASM_BINDGEN_BIN" \
  --target web \
  --out-dir "$ROOT_DIR/src/wasm/pkg" \
  --out-name sanma_quiz_wasm \
  "$ROOT_DIR/wasm/target/wasm32-unknown-unknown/release/sanma_quiz_wasm.wasm"
