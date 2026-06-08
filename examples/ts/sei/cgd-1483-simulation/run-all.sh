#!/usr/bin/env bash
# CGD-1483 run-all driver. Executes the msg scripts in dependency order.
# Per-script failures are recorded but don't abort the run — the
# fixture for that script will be missing and reconcile.ts will note
# it in the CSV.
#
# Required env: ATTACKER_MNEMONIC
# Optional   : GRANTEE_MNEMONIC, RPC_ENDPOINT, REST_ENDPOINT

set -u
cd "$(dirname "$0")/../../../.." || exit 1

LOG=/tmp/cgd-1483-run-all.log
: > "$LOG"

if [ -z "${ATTACKER_MNEMONIC:-}" ]; then
  echo "Set ATTACKER_MNEMONIC env var first."
  exit 1
fi

run() {
  local name="$1"; shift
  echo "=================================================================="
  echo "▶ $name"
  echo "=================================================================="
  if npx ts-node --transpile-only "examples/ts/sei/cgd-1483-simulation/msg/${name}.ts" "$@" 2>&1 | tee -a "$LOG"; then
    echo "✓ $name done"
  else
    echo "✗ $name FAILED (continuing)"
  fi
  echo ""
  # Small spacing between txs so the chain has time to advance & sequence
  # numbers don't collide.
  sleep 3
}

# ── 1. Cheap, no-deps msgs ──────────────────────────────────────────────────
run bank-msgsend
run bank-msgmultisend
run edge-msgmultisend-selfloop
run edge-same-address-twice
run edge-failed-tx

# ── 2. Staking dependency chain ─────────────────────────────────────────────
run staking-msgdelegate
run staking-msgundelegate
run staking-msgcancelunbondingdelegation
run distribution-msgwithdrawdelegatorreward
run distribution-msgsetwithdrawaddress
run staking-msgbeginredelegate

# ── 3. authz / feegrant ─────────────────────────────────────────────────────
run authz-msggrant
run feegrant-msggrantallowance
run authz-msgexec-undelegate
run edge-msgexec-single-inner
run edge-msgexec-multi-inner

# ── 4. Vesting ──────────────────────────────────────────────────────────────
run vesting-msgcreatevestingaccount
run vesting-msgcreatepermanentlockedaccount
run vesting-msgcreateperiodicvestingaccount

# ── 5. IBC ──────────────────────────────────────────────────────────────────
run ibc-msgtransfer
SCENARIO=timeout run ibc-msgtransfer
run edge-ibc-timeout

# ── 6. Gov (each costs 10M usei — runs only if balance allows) ──────────────
run distribution-msgfundcommunitypool
run gov-msgsubmitproposal-v1beta1
run gov-msgsubmitproposal-v1

# ── 7. Tokenfactory (create costs 10M usei) ─────────────────────────────────
run tokenfactory-msgcreatedenom
run tokenfactory-msgmint
run tokenfactory-msgburn

# ── 8. Wasm ─────────────────────────────────────────────────────────────────
run wasm-msginstantiatecontract
run wasm-msginstantiatecontract2
run wasm-msgexecutecontract-cw20

# ── 9. Historical-mainnet captures (no broadcast) ───────────────────────────
run evm-msgevmtransaction
run evm-msgsend
run ibc-msgrecvpacket

echo ""
echo "=================================================================="
echo "All scripts attempted. See fixtures/ for outputs."
echo "Log: $LOG"
echo "Run npx ts-node examples/ts/sei/cgd-1483-simulation/reconcile.ts next."
echo "=================================================================="
