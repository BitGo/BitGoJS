#!/usr/bin/env bash
#
# Push all bookmarks in the utxolib-removal PR group.
#
# Topology:
#
#   master
#     └── PR-A    otto/abstract-utxo-foundation    (4 commits — dead code removal)
#           └── PR-nxrt  otto/drop-fetchinputs      (1 commit — fetchInputs deletion + fee guard)
#                 └── PR-A2  otto/abstract-utxo-replacements  (7 commits — mechanical replacements)
#                       └── PR-C  otto/keychains-drop-utxolib
#                             └── PR-Z  otto/abstract-utxo-terminal  (merges last)
#
# PR-B (sdk-coin-generator-drop-utxo), PR-D (derive-key-with-seed),
# PR-E (descriptor-psbt-narrowing), PR-F (sign-psbt-wasm-inline-bip32),
# PR-G (descriptor-types-from-wasm) — all merged.
#
# PR-Z requires PR-A, PR-nxrt, PR-A2, and PR-C to all merge first
# (it deletes wasmUtil.ts and moves @bitgo/utxo-lib to devDependencies).

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

BOOKMARKS=(
  otto/abstract-utxo-foundation
  otto/abstract-utxo-replacements
  otto/drop-fetchinputs
  otto/keychains-drop-utxolib
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

  1. PR-A     abstract-utxo-foundation    (independent)
  2. PR-nxrt  drop-fetchinputs            (base: PR-A)
  3. PR-A2    abstract-utxo-replacements  (base: PR-nxrt)
  4. PR-C     keychains-drop-utxolib      (base: PR-A2)
  5. PR-Z     abstract-utxo-terminal      (base: PR-C, merges last)

EOF
