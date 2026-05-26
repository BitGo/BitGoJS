#!/usr/bin/env bash
#
# Push all bookmarks in the utxolib-removal PR group.
#
# Topology:
#
#   master
#     ├── PR-A  otto/abstract-utxo-foundation         (14 commits — chain foundation)
#     │     └── PR-C  otto/keychains-drop-utxolib     (stacked on PR-A; type-coupling)
#     │           └── PR-Z  otto/abstract-utxo-terminal (stacked on PR-C; merges last)
#     │
#     ├── PR-B  otto/sdk-coin-generator-drop-utxo     (parallel)
#     ├── PR-D  otto/derive-key-with-seed             (parallel)
#     ├── PR-E  otto/descriptor-psbt-narrowing        (parallel)
#     ├── PR-F  otto/sign-psbt-wasm-inline-bip32      (parallel)
#     └── PR-G  otto/descriptor-types-from-wasm       (parallel)
#
# PR-Z requires PR-A, PR-C, PR-D, PR-E, PR-F, PR-G to all merge first
# (it deletes wasmUtil.ts and moves @bitgo/utxo-lib to devDependencies).

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

BOOKMARKS=(
  otto/abstract-utxo-foundation
  otto/sdk-coin-generator-drop-utxo
  otto/keychains-drop-utxolib
  otto/derive-key-with-seed
  otto/descriptor-psbt-narrowing
  otto/sign-psbt-wasm-inline-bip32
  otto/descriptor-types-from-wasm
  otto/abstract-utxo-terminal
)

DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --dry-run|-n) DRY_RUN=1 ;;
    -h|--help)
      sed -n '2,20p' "$0"
      exit 0
      ;;
    *)
      echo "unknown arg: $arg" >&2
      exit 2
      ;;
  esac
done

push_args=(--allow-new)
for bm in "${BOOKMARKS[@]}"; do
  push_args+=(--bookmark "$bm")
done

if [ "$DRY_RUN" -eq 1 ]; then
  echo "would run: jj git push ${push_args[*]}"
  exit 0
fi

jj git push "${push_args[@]}"

cat <<'EOF'

Pushed. Open PRs in this order:

  1. PR-A  abstract-utxo-foundation        (independent)
  2. PR-B  sdk-coin-generator-drop-utxo    (independent)
  3. PR-D  derive-key-with-seed            (independent)
  4. PR-E  descriptor-psbt-narrowing       (independent)
  5. PR-F  sign-psbt-wasm-inline-bip32     (independent)
  6. PR-G  descriptor-types-from-wasm      (independent)
  7. PR-C  keychains-drop-utxolib          (base: PR-A)
  8. PR-Z  abstract-utxo-terminal          (base: PR-C, merges last after all others)

EOF
