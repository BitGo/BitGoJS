# CGD-1483 — SEI testnet simulation + 3-way balance reconciliation

End-to-end testnet simulation for the **78 sei Msg types** identified in the
[CGD-1465 final report](https://github.com/BitGo/indexer/blob/sei-cosmos-whitelist-report/.claude/cosmos-whitelist/sei/final-report.md):
**12 broken**, **16 needs-investigation**, plus sanity samples per module and
**6 edge-case scenarios** (failed tx, MsgExec single/multi-inner, MultiSend
self-loop, IBC timeout, same-address-twice).

Implements **CGD-775 playbook Steps 4, 5, 6** for sei.

## Layout

```
cgd-1483-simulation/
├── lib/
│   ├── sei-client.ts              # broadcast/sign/wait/capture helpers
│   ├── msg-list.ts                # canonical Msg catalog (key → spec)
│   ├── validators.ts              # bonded-validator picker
│   ├── sei-tokenfactory-proto.ts  # hand-rolled Sei tokenfactory encoders
│   └── missing-protos.ts          # MsgCancelUnbonding, gov v1, etc. (not in installed cosmjs-types)
├── 00-create-wallets.ts           # bulk-create N BitGo tsei TSS wallets via BitGo SDK
├── 00-import-wallets.ts           # alternative: import wallets created via BitGo Admin UI
├── reconcile.ts                   # 3-way balance reconciliation runner
├── msg/                           # one script per Msg type — see "Msg coverage" below
└── fixtures/                      # captured tx_response JSON, one per simulated tx (gitignored output)
```

Outputs landed at the end of a full run:

* `wallets.json` — `{ <msgKey>: { walletId, address, label, createdAt } }`
* `tokenfactory-state.json` — denom created by tokenfactory-msgcreatedenom.ts
* `fixtures/<msgKey>.json` — per-tx capture (both `logs[]` and `events[]`, raw body.messages[], auth_info.fee)
* `reconciliation.csv` — one row per (tx, address, denom, height) with verdict

## Pre-reqs

1. The BitGoJS monorepo is installed (`yarn install`).
2. The `bitgo` package is compiled — only required for **00-create-wallets.ts** (the BitGo TSS keygen lives in the SDK). Run from repo root:

   ```bash
   yarn               # one-shot build of all packages (~10 min first time)
   # or
   yarn dev           # watch mode (rebuilds on edit)
   ```

   The actual simulation scripts (`msg/*.ts`, `reconcile.ts`) only use
   `cosmjs` and don't require the BitGo SDK to be built.
3. An attacker mnemonic funded with usei on the sei testnet (atlantic-2).
   Default attacker for CGD-1093/CGD-1483:

   ```
   prosper pledge defense friend energy gorilla height arrest prosper december
   whisper prosper junior rhythm young coconut patient actress creek battle
   coral dismiss cloth cigar
   ```

   Address: `sei1j4duheg4uy7en9vcp0xm7hndccc3euwpx7utx2`
   Faucet: https://www.docs.sei.io/learn/faucet

   For some scripts (authz MsgExec via separate grantee) you'll also want a
   second funded mnemonic — pass via `GRANTEE_MNEMONIC`. The default is
   reuse-attacker, which still exercises the same parser path.

## Quick start

```bash
# From /Users/venkateshv/BitGo/BitGoJS

# 1. Create victim wallets (one per Msg type that needs a victim address)
BITGO_ACCESS_TOKEN=v2x1305a89c0de02e773e785c5ac3cc8a7b7bcd9c6f48e4cbfdb7eda90a5a876616 \
BITGO_ENTERPRISE=6a154138f4ba725fec2fad6fcd1463ab \
BITGO_PASSPHRASE='choose-a-strong-passphrase' \
npx ts-node examples/ts/sei/cgd-1483-simulation/00-create-wallets.ts

# (alternative if SDK isn't built — create N wallets via app.bitgo-test.com
# tsei "New Wallet" then import the addresses as CSV)
WALLETS_CSV=wallets.csv \
npx ts-node examples/ts/sei/cgd-1483-simulation/00-import-wallets.ts

# 2. Run individual msg simulations
ATTACKER_MNEMONIC="prosper pledge defense ..." \
npx ts-node examples/ts/sei/cgd-1483-simulation/msg/bank-msgsend.ts

# Run any other msg the same way — each writes its fixture to fixtures/<key>.json.

# 3. After simulations are done, reconcile balances
INDEXER_BALANCE_URL=http://localhost:8080/balances \
npx ts-node examples/ts/sei/cgd-1483-simulation/reconcile.ts
```

`INDEXER_BALANCE_URL` is optional — if unset, the CSV has empty
`indexerBalance` cells you fill in manually from a direct Mongo query
against the indexer's `balances` collection (see CGD-1483 ticket Step 5
table). Pass the URL when running against a deployed indexer admin API.

## Msg coverage

### ❌ Broken — must simulate (12)

| Msg | Script |
|---|---|
| MsgEVMTransaction (PARSER_ERROR) | `msg/evm-msgevmtransaction.ts` |
| MsgExec inner MsgUndelegate (MISSING_ENTRY) | `msg/authz-msgexec-undelegate.ts` |
| MsgBeginRedelegate (WRONG_EVENT_HANDLING) | `msg/staking-msgbeginredelegate.ts` |
| MsgMint tokenfactory (UNSUPPORTED_TOKEN) | `msg/tokenfactory-msgmint.ts` |
| MsgBurn tokenfactory (UNSUPPORTED_TOKEN) | `msg/tokenfactory-msgburn.ts` |
| MsgExecuteContract CW-20 path | `msg/wasm-msgexecutecontract-cw20.ts` |
| MsgClaim (EVM) | skip — no public path on testnet; rationale in `lib/msg-list.ts` |
| MsgClaimSpecific (EVM) | skip — pointer pre-req unavailable |
| MsgInternalEVMCall | skip — internal-only on Sei v6.5.0 |
| MsgInternalEVMDelegateCall | skip — internal-only |
| MsgRecvPacket (IBC inbound) | `msg/ibc-msgrecvpacket.ts` (escape-valve: historical mainnet) |

### 🔍 Needs investigation (16)

| Msg | Script |
|---|---|
| MsgDelegate | `msg/staking-msgdelegate.ts` |
| MsgCancelUnbondingDelegation | `msg/staking-msgcancelunbondingdelegation.ts` |
| MsgAcknowledgement (error-ack) | observed via `msg/edge-ibc-timeout.ts` paired observation |
| MsgSubmitProposal v1beta1 | `msg/gov-msgsubmitproposal-v1beta1.ts` |
| MsgSubmitProposal v1 | `msg/gov-msgsubmitproposal-v1.ts` |
| MsgFundCommunityPool | `msg/distribution-msgfundcommunitypool.ts` |
| MsgVerifyInvariant | skip-rationale |
| MsgCreateVestingAccount | `msg/vesting-msgcreatevestingaccount.ts` |
| MsgCreatePermanentLockedAccount | `msg/vesting-msgcreatepermanentlockedaccount.ts` |
| MsgCreatePeriodicVestingAccount | `msg/vesting-msgcreateperiodicvestingaccount.ts` |
| MsgFundVestingAccount | covered as part of vesting create flow |
| MsgInstantiateContract | `msg/wasm-msginstantiatecontract.ts` |
| MsgInstantiateContract2 | `msg/wasm-msginstantiatecontract2.ts` |

(MsgBeginRedelegate / MsgMint / MsgBurn duplicate entries are tracked
under their ❌ broken scripts.)

### ✅ Sanity samples per module

`msg/bank-msgsend.ts`, `msg/bank-msgmultisend.ts`,
`msg/staking-msgundelegate.ts`,
`msg/distribution-msgwithdrawdelegatorreward.ts`,
`msg/distribution-msgsetwithdrawaddress.ts`,
`msg/feegrant-msggrantallowance.ts`, `msg/authz-msggrant.ts`,
`msg/ibc-msgtransfer.ts`, `msg/tokenfactory-msgcreatedenom.ts`,
`msg/evm-msgsend.ts` (historical-mainnet).

`MsgVote` is captured opportunistically — needs an active proposal. We
fall back to relying on the report's verify result for it.

### Edge cases (6)

`msg/edge-failed-tx.ts`, `msg/edge-msgexec-single-inner.ts`,
`msg/edge-msgexec-multi-inner.ts`, `msg/edge-msgmultisend-selfloop.ts`,
`msg/edge-ibc-timeout.ts` (paired with `msg/ibc-msgtransfer.ts SCENARIO=timeout`),
`msg/edge-same-address-twice.ts`.

## Recommended run order

Some scripts have natural pre-reqs. Run in this order:

1. `00-create-wallets.ts` (or `00-import-wallets.ts`)
2. `msg/bank-msgsend.ts`, `msg/bank-msgmultisend.ts`,
   `msg/edge-msgmultisend-selfloop.ts`, `msg/edge-same-address-twice.ts`
   (no pre-reqs)
3. `msg/staking-msgdelegate.ts` (establishes a delegation)
4. `msg/staking-msgundelegate.ts`, `msg/staking-msgbeginredelegate.ts`,
   `msg/distribution-msgwithdrawdelegatorreward.ts`,
   `msg/distribution-msgsetwithdrawaddress.ts` (need delegation from #3)
5. `msg/staking-msgcancelunbondingdelegation.ts` (run shortly after
   undelegate while unbonding entry is still active)
6. `msg/authz-msggrant.ts` (sets up grant if you'll use a separate grantee)
7. `msg/authz-msgexec-undelegate.ts`, `msg/edge-msgexec-single-inner.ts`,
   `msg/edge-msgexec-multi-inner.ts`
8. `msg/distribution-msgfundcommunitypool.ts`,
   `msg/gov-msgsubmitproposal-v1beta1.ts`,
   `msg/gov-msgsubmitproposal-v1.ts`
9. `msg/feegrant-msggrantallowance.ts`
10. `msg/vesting-msgcreatevestingaccount.ts`,
    `msg/vesting-msgcreatepermanentlockedaccount.ts`,
    `msg/vesting-msgcreateperiodicvestingaccount.ts`
11. `msg/ibc-msgtransfer.ts` (SCENARIO=live), then again with
    SCENARIO=timeout to seed the timeout fixture
12. `msg/edge-ibc-timeout.ts` — poll for the paired MsgTimeout refund
13. `msg/tokenfactory-msgcreatedenom.ts`,
    `msg/tokenfactory-msgmint.ts`,
    `msg/tokenfactory-msgburn.ts`
14. `msg/wasm-msginstantiatecontract.ts`,
    `msg/wasm-msginstantiatecontract2.ts`,
    `msg/wasm-msgexecutecontract-cw20.ts`
15. `msg/evm-msgevmtransaction.ts`, `msg/evm-msgsend.ts`,
    `msg/ibc-msgrecvpacket.ts` — historical-mainnet captures
16. `msg/edge-failed-tx.ts`
17. `reconcile.ts`

## Per-script env knobs

Every script reads `ATTACKER_MNEMONIC` and resolves the victim from
`wallets.json` keyed by the script's msg key. Common overrides:

| Env var | Effect |
|---|---|
| `VICTIM_ADDRESS=sei1...` | Override the victim picked from wallets.json |
| `AMOUNT=<n>` | Override transfer amount |
| `RPC_ENDPOINT` / `REST_ENDPOINT` | Override sei testnet endpoints (defaults: sei-apis.com) |
| `REST_ENDPOINT_FALLBACK` | Used by reconcile.ts when the primary LCD fails |
| `VALIDATOR=<seivaloper1...>` | Pick a specific validator for staking msgs |
| `GRANTEE_MNEMONIC` | Use a separate authz grantee mnemonic (default: reuse attacker) |
| `SCENARIO=live\|timeout` | For `ibc-msgtransfer.ts` |

## Anti-patterns enforced (from CGD-775 playbook)

* All reconciliation queries hit LCD at **txHeight + 1** with the
  `x-cosmos-block-height` header — never at the tx's own height.
* The verifier is automated end-to-end (`reconcile.ts`); never reconcile by
  hand.
* Mnemonics are kept in env vars — never committed.
* Each msg type gets a dedicated victim wallet — no cross-msg
  contamination.
* MsgExec inner msgs are tested independently (single + multi).
* Wallet-platform balances are NOT consulted — the indexer's `balances`
  collection is the indexer-side source of truth.

## Status — what runs without the BitGo SDK build

| Component | Needs `yarn` build? |
|---|---|
| `lib/*.ts`, `msg/*.ts`, `reconcile.ts` | **No** — pure cosmjs |
| `00-create-wallets.ts` | **Yes** — uses `bitgo` SDK for TSS keygen |
| `00-import-wallets.ts` | **No** — falls back path if you create wallets via Admin UI |

## Linked artifacts

* Parent ticket: [CGD-775](https://linear.app/bitgo/issue/CGD-775)
* This ticket: [CGD-1483](https://linear.app/bitgo/issue/CGD-1483)
* Report (blocker, complete): [CGD-1465](https://linear.app/bitgo/issue/CGD-1465)
* Final report: https://github.com/BitGo/indexer/blob/sei-cosmos-whitelist-report/.claude/cosmos-whitelist/sei/final-report.md
* Playbook: https://linear.app/bitgo/document/cgd-775-cosmos-message-type-whitelisting-per-chain-investigation-0bc47ca25c1d
