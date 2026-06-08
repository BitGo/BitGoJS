#!/usr/bin/env bash
# CGD-1483 redo orchestrator.
# Required env: ATTACKER_MNEMONIC, BITGO_ACCESS_TOKEN, BITGO_ENTERPRISE, BITGO_PASSPHRASE

set -eu
cd "$(dirname "$0")/../../../.." || exit 1

LOG=/tmp/cgd-1483-redo.log
: > "$LOG"

echo "── 00 create redo wallets ──" | tee -a "$LOG"
npx ts-node --transpile-only examples/ts/sei/cgd-1483-simulation/redo/00-create-redo-wallets.ts 2>&1 | tee -a "$LOG"

echo "── 01 fund redo wallets ──" | tee -a "$LOG"
npx ts-node --transpile-only examples/ts/sei/cgd-1483-simulation/redo/01-fund-redo-wallets.ts 2>&1 | tee -a "$LOG"

echo "── 02 perform actions via BitGo SDK ──" | tee -a "$LOG"
npx ts-node --transpile-only examples/ts/sei/cgd-1483-simulation/redo/02-run-redo-actions.ts 2>&1 | tee -a "$LOG"

echo "── done ──" | tee -a "$LOG"
echo "Now write REDO-REPORT.md."
