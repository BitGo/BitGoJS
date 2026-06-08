# SEI — Complete Cosmos Message-Type Whitelist & Indexer Audit Report

> **Chain:** Sei (sei / tsei)  
> **Node version:** seid v6.5.0 (pacific-1 mainnet, atlantic-2 testnet)  
> **Tickets:** CGD-775 (parent), CGD-1465 (code-only analysis), CGD-1483 (testnet simulation + reconciliation), CGD-1093 (enforcement audit)  
> **Simulation date:** 2026-05-26  
> **Redo round 1:** 2026-05-28  
> **Redo round 2:** 2026-05-29  
> **Report compiled:** 2026-05-29  
> **Author:** Venkatesh V

---

## 1. Executive Summary

This document is the single authoritative reference for SEI's message-type whitelist work under CGD-775. It synthesizes:

- **CGD-1465** (Done) — code-only static analysis of 78 Sei msg types against the indexer parser, producing the preliminary whitelist and identifying 12 broken types.
- **CGD-1483** (In Progress) — live testnet simulation on atlantic-2 (31 broadcasts), 3-way balance reconciliation against the live tsei indexer and the chain LCD, two rounds of BitGo-wallet redo broadcasts, and reconciliation of all redo txs.
- **CGD-1093** (In Progress) — related SEI tx type enforcement audit (CW-20 silent drop confirmed).

| Metric | Count |
|---|---|
| Total Msg types analyzed (code-only) | **78** |
| ✅ Works with current indexer | **50** |
| ❌ Broken / confirmed parser bug | **12** |
| 🔍 Requires further investigation | **16** |
| Testnet broadcasts attempted | **31** |
| Successful code-0 broadcasts | **23** |
| Historical mainnet captures | **3** |
| Confirmed indexer bugs (empirical) | **6** |
| Confirmed indexer bugs (code-only, not yet empirically testable) | **2** |
| All BitGo wallet `b` balances matching chain LCD | **5 / 5 wallets** ✅ |

**Top-line verdict:** The tsei indexer correctly tracks liquid balances (field `b`) for all wallet types tested. Every parser bug found is about **entry classification or silent omission** — no bug causes a `b`-field mismatch for native `usei` transfers. The balance-accounting errors are in:
1. Tokenfactory `factory/*` denom — whole-tx silent drop (❌ empirically confirmed ×2)
2. CW-20 transfers via `MsgExecuteContract` — silent drop (❌ CGD-1093 confirmed ×1)
3. `MsgEVMTransaction` complementary-arrays — spender overstated (❌ code-only + mainnet tx confirmed)
4. `MsgExec` inner `MsgUndelegate` — missing pending payback (❌ code-only + mainnet tx confirmed)
5. `MsgDelegate` — wrong entry type (Transfer instead of Delegated) + module-account phantom (⚠️ empirical, no balance break)
6. `MsgBeginRedelegate` — no tracking entry at all (❌ information loss, no balance break)
7. `MsgWithdrawDelegatorReward` — reward credit possibly missing (⚠️ ambiguous — may be reward=0 case)

---

## 2. Chain Environment

| Property | Value |
|---|---|
| Chain ID (mainnet) | `pacific-1` |
| Chain ID (testnet) | `atlantic-2` |
| Node version | `seid v6.5.0` |
| Cosmos SDK fork version | `v0.45.x` (Sei-specific fork; NOT v0.46+) |
| CosmWasm version | Pre-wasmd v0.30 fork |
| EVM support | `seiprotocol.seichain.evm.*` — EVM module (type 3 EVM txs, ERC-20/ERC-721 precompiles) |
| Native denom | `usei` (micro-sei) |
| Testnet LCD (primary) | `https://rest-testnet.sei-apis.com` |
| Testnet LCD (fallback) | `https://rest.atlantic-2.seinetwork.io` |
| Mainnet LCD (used for historical captures) | `https://sei-api.polkachu.com` |
| BitGo coin name | `sei` (mainnet), `tsei` (testnet) |
| Indexer type | `CosmosLikeTransaction` (no Sei-specific subclass; `SeiClient.java` overrides fee params only) |
| Guardrail registered | ✅ `CosmosBalanceVerifyStrategy.java:53` |
| Pending-payback task wired | ✅ `Indexer.java:4374-4381` |
| Fee-collector map | ❌ **MISSING** — sei/tsei absent from `CosmosFeeCollector.feeCollectorAddressMap` |
| dex module | ✅ **REMOVED** at upgrade v5.8.0; not present in v6.5.0 |

### Sei v0.45 fork implications (important for whitelist)

Five msg types from the standard cosmos-sdk exist in the codebase but are **not registered** on Sei v6.5.0:

| Msg type | Reason not registered |
|---|---|
| `/cosmos.staking.v1beta1.MsgCancelUnbondingDelegation` | Added in cosmos-sdk v0.46; Sei is on v0.45 fork |
| `/cosmos.vesting.v1beta1.MsgCreatePermanentLockedAccount` | Added in cosmos-sdk v0.46 |
| `/cosmos.vesting.v1beta1.MsgCreatePeriodicVestingAccount` | Added in cosmos-sdk v0.46 |
| `/cosmwasm.wasm.v1.MsgInstantiateContract2` | Added in wasmd v0.30; Sei fork predates it |
| `/cosmos.gov.v1.*` (all variants) | gov v1 ships in cosmos-sdk v0.46+; Sei only registers `gov.v1beta1.*` |

These types broadcast with `code 2: unable to resolve type URL ... tx parse error` and **never land in any block**. They should be removed from the active whitelist — the indexer's behavior for them is academic.

---

## 3. Phase 1: Code-Only Analysis (CGD-1465)

> Source: `BitGo/indexer` branch `sei-cosmos-whitelist-report`, file `.claude/cosmos-whitelist/sei/final-report.md`  
> Generated: 2026-05-25

### 3.1 Summary table

| Bucket | Count |
|---|---|
| ✅ Works with current indexer | 50 |
| ❌ Broken in current indexer | 12 |
| 🔍 Requires further investigation | 16 |
| **Total analyzed** | **78** |

### 3.2 ✅ Msg types that work (50)

All 50 verified by real on-chain tx trace (mainnet unless noted). Safe to whitelist subject to testnet sign-off.

| protoTypeUrl | Module | Evidence tx hash |
|---|---|---|
| `/cosmos.bank.v1beta1.MsgSend` | bank | `7CEB2BF7...` h=209668009 |
| `/cosmos.bank.v1beta1.MsgMultiSend` | bank | `F9CDBC6E...` h=203750639 |
| `/cosmos.staking.v1beta1.MsgUndelegate` | staking | `252A927B...` h=209669794 |
| `/cosmos.staking.v1beta1.MsgCreateValidator` | staking | `8C2D2A7F...` h=206390625 |
| `/cosmos.staking.v1beta1.MsgEditValidator` | staking | n/a (no balance events) |
| `/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward` | distribution | `FDE4E73C...` h=209669610 |
| `/cosmos.distribution.v1beta1.MsgWithdrawValidatorCommission` | distribution | `AA771742...` h=209662173 |
| `/cosmos.distribution.v1beta1.MsgSetWithdrawAddress` | distribution | n/a (no balance impact) |
| `/cosmos.distribution.v1beta1.MsgFundCommunityPool` | distribution | predicted OK (0 LCD results) |
| `/cosmos.gov.v1beta1.MsgSubmitProposal` | gov | predicted OK (0 LCD results) |
| `/cosmos.gov.v1beta1.MsgVote` | gov | n/a (no balance impact) |
| `/cosmos.gov.v1beta1.MsgVoteWeighted` | gov | n/a |
| `/cosmos.gov.v1beta1.MsgDeposit` | gov | `537CFEC6...` h=206492642 |
| `/cosmos.gov.v1.MsgVote` | gov | n/a |
| `/cosmos.gov.v1.MsgVoteWeighted` | gov | n/a |
| `/cosmos.gov.v1.MsgDeposit` | gov | predicted OK |
| `/cosmos.gov.v1.MsgExecLegacyContent` | gov | n/a |
| `/cosmos.authz.v1beta1.MsgGrant` | authz | n/a (no balance impact at grant time) |
| `/cosmos.authz.v1beta1.MsgRevoke` | authz | n/a |
| `/cosmos.feegrant.v1beta1.MsgGrantAllowance` | feegrant | n/a |
| `/cosmos.feegrant.v1beta1.MsgRevokeAllowance` | feegrant | n/a |
| `/cosmos.feegrant.v1beta1.MsgPruneAllowances` | feegrant | n/a |
| `/cosmos.slashing.v1beta1.MsgUnjail` | slashing | n/a |
| `/cosmos.vesting.v1beta1.MsgCreateVestingAccount` | vesting | predicted OK (0 LCD results); testnet-confirmed ✓ |
| `/cosmos.vesting.v1beta1.MsgCreatePermanentLockedAccount` | vesting | NOT REGISTERED on Sei v6.5.0 — demoted |
| `/cosmos.vesting.v1beta1.MsgCreatePeriodicVestingAccount` | vesting | NOT REGISTERED on Sei v6.5.0 — demoted |
| `/cosmos.vesting.v1beta1.MsgFundVestingAccount` | vesting | predicted OK |
| `/ibc.applications.transfer.v1.MsgTransfer` | ibc-transfer | `98299E41...` h=209643860 |
| `/ibc.core.channel.v1.MsgTimeout` | ibc-core | `CEA8A6A3...` h=209644048 |
| `/ibc.core.channel.v1.MsgCreateClient` through `MsgChannelCloseConfirm` (10 msgs) | ibc-core | n/a (handshake / no balance impact) |
| `/cosmos.upgrade.v1beta1.MsgSoftwareUpgrade` | upgrade | n/a |
| `/cosmos.upgrade.v1beta1.MsgCancelUpgrade` | upgrade | n/a |
| `/cosmos.crisis.v1beta1.MsgVerifyInvariant` | crisis | predicted OK |
| `/cosmos.evidence.v1beta1.MsgSubmitEvidence` | evidence | n/a |
| `/cosmos.mint.v1beta1.MsgUpdateParams` | mint | n/a |
| `/seiprotocol.seichain.oracle.MsgAggregateExchangeRateVote` | oracle | n/a |
| `/seiprotocol.seichain.oracle.MsgDelegateFeedConsent` | oracle | n/a |
| `/seiprotocol.seichain.tokenfactory.MsgCreateDenom` | tokenfactory | n/a (no token movement) |
| `/seiprotocol.seichain.tokenfactory.MsgUpdateDenom` | tokenfactory | n/a |
| `/seiprotocol.seichain.tokenfactory.MsgChangeAdmin` | tokenfactory | n/a |
| `/seiprotocol.seichain.tokenfactory.MsgSetDenomMetadata` | tokenfactory | n/a |
| `/cosmwasm.wasm.v1.MsgInstantiateContract` | wasm | predicted OK |
| `/cosmwasm.wasm.v1.MsgInstantiateContract2` | wasm | NOT REGISTERED on Sei v6.5.0 — demoted |
| `/cosmwasm.wasm.v1.MsgStoreCode` | wasm | n/a |
| `/cosmwasm.wasm.v1.MsgMigrateContract` | wasm | n/a |
| `/cosmwasm.wasm.v1.MsgUpdateAdmin` | wasm | n/a |
| `/cosmwasm.wasm.v1.MsgClearAdmin` | wasm | n/a |
| `/cosmwasm.wasm.v1.MsgUpdateParams` | wasm | n/a |
| `/seiprotocol.seichain.evm.MsgAssociate` | evm | n/a |
| `/seiprotocol.seichain.evm.MsgAssociateContractAddress` | evm | n/a |
| `/seiprotocol.seichain.evm.MsgRegisterPointer` | evm | n/a |
| `/seiprotocol.seichain.evm.MsgSend` | evm | `40CACAF0...` h=204636477 |

### 3.3 ❌ Msg types broken in current indexer (12)

| protoTypeUrl | Failure mode | Parser anchor | Evidence tx hash | Net impact |
|---|---|---|---|---|
| `/seiprotocol.seichain.evm.MsgEVMTransaction` | `PARSER_ERROR` — complementary arrays bug | `CosmosLikeTransaction.java:394-412` | `62ABC7EAC4...` h=209671085 | Spender balance **overstated by 10905 usei per EVM tx** (coin_spent in events[] never processed) |
| `/cosmos.authz.v1beta1.MsgExec` (inner MsgUndelegate) | `MISSING_ENTRY` — inner msg not detected | `CosmosLikeTransaction.java:317-329` | `409EAD27D0...` h=209220169 | Delegator loses **100,000,000,000 usei** unlock entry at cooldown; no pending payback stored |
| `/cosmos.staking.v1beta1.MsgBeginRedelegate` | `WRONG_EVENT_HANDLING` — redelegate event not handled | `CosmosLikeTransaction.java:498-527` | `1444F171B6...` h=209440270 | No liquid balance error (no bank events); informational tracking gap only |
| `/seiprotocol.seichain.tokenfactory.MsgMint` | `UNSUPPORTED_TOKEN` — factory/* denom | `CosmosSupportedDenomination.java:46-48` | n/a (predicted; testnet-confirmed ✓) | Mint silently produces no entry; BitGo wallet holding tokenfactory tokens has incorrect balance |
| `/seiprotocol.seichain.tokenfactory.MsgBurn` | `UNSUPPORTED_TOKEN` — same | same | n/a | Same as MsgMint |
| `/cosmwasm.wasm.v1.MsgExecuteContract` | `UNSUPPORTED_TOKEN` — CW-20 not tracked (no bank events); tokenfactory path also broken | `CosmosLikeTransaction.java:758-780` | `1DC38AE1...` h=209643290 (CW-20); testnet `6776EB6A...` confirmed | **CW-20 transfers silently missed**; usei native transfers via BankMsg::Send are OK |
| `/seiprotocol.seichain.evm.MsgClaim` | `PARSER_ERROR` — bank event emission unconfirmed | `CosmosLikeTransaction.java:394-412` | none (0 LCD results) | Unknown — testnet verification required |
| `/seiprotocol.seichain.evm.MsgClaimSpecific` | `PARSER_ERROR` — same risk as MsgClaim | same | none | Unknown |
| `/seiprotocol.seichain.evm.MsgInternalEVMCall` | `WRONG_EVENT_HANDLING` — pure EVM value transfer may not emit bank events | same | none | Unknown — if no bank events: value transfer silently missed |
| `/seiprotocol.seichain.evm.MsgInternalEVMDelegateCall` | `WRONG_EVENT_HANDLING` — same as MsgInternalEVMCall | same | none | Unknown |
| `/ibc.core.channel.v1.MsgRecvPacket` | `MISSING_ENTRY` — fee attributed to relayer not user | `CosmosLikeTransaction.java:281-307` | `96C863A1...` h=207042134 | Receive entry correct; fee debit attributed to relayer — **pre-existing cross-chain bug** |

### 3.4 🔍 Msg types requiring further investigation (16)

| protoTypeUrl | Reason | Suggested path |
|---|---|---|
| `/cosmos.staking.v1beta1.MsgDelegate` | `SUSPECT` — fee-collector map missing for sei; bonded_tokens_pool receive not stripped; delegator spend correct but module account receive lingers | Add sei/tsei to `CosmosFeeCollector.feeCollectorAddressMap` → re-classify ✅ |
| `/cosmos.staking.v1beta1.MsgCancelUnbondingDelegation` | `SUSPECT` — no mainnet sample; **NOT REGISTERED on Sei v6.5.0** — demoted; code gap confirmed: no cancel path in pending-payback task | Demote from whitelist; open cancel-handler ticket for other chains |
| `/ibc.core.channel.v1.MsgAcknowledgement` | `SUSPECT` (error-ack path) — success-ack OK; error-ack predicted but no mainnet sample | Force error-ack testnet test |
| `/cosmos.gov.v1beta1.MsgSubmitProposal` | No mainnet sample; predicted OK; fee-collector gap (gov module deposit not stripped) | Confirmed on testnet (`B96DD20A...`) |
| `/cosmos.gov.v1.MsgSubmitProposal` | Same as v1beta1; **NOT REGISTERED on Sei v6.5.0** | Demote |
| `/cosmos.distribution.v1beta1.MsgFundCommunityPool` | No mainnet sample; confirmed on testnet (`DCFCA051...`) | ✅ Confirmed via testnet |
| `/cosmos.crisis.v1beta1.MsgVerifyInvariant` | No mainnet sample; predicted OK | Low priority |
| `/cosmos.vesting.v1beta1.MsgCreateVestingAccount` | No mainnet sample; confirmed on testnet (`7E2B499C...`) | ✅ Confirmed via testnet — VestingTransfer tagging correct |
| `/cosmos.vesting.v1beta1.MsgCreatePermanentLockedAccount` | **NOT REGISTERED on Sei v6.5.0** — demoted | Demote |
| `/cosmos.vesting.v1beta1.MsgCreatePeriodicVestingAccount` | **NOT REGISTERED on Sei v6.5.0** — demoted | Demote |
| `/cosmos.vesting.v1beta1.MsgFundVestingAccount` | No mainnet sample | Low priority |
| `/cosmwasm.wasm.v1.MsgInstantiateContract` | No mainnet sample; confirmed on testnet (`5CA109F9...` with funds) | ✅ Confirmed; UNSUPPORTED_TOKEN risk for tokenfactory denoms only |
| `/cosmwasm.wasm.v1.MsgInstantiateContract2` | **NOT REGISTERED on Sei v6.5.0** — demoted | Demote |
| `/cosmos.staking.v1beta1.MsgBeginRedelegate` | `WRONG_EVENT_HANDLING` — no liquid balance error; informational tracking only | Confirmed on testnet — no Redelegated entry emitted |
| `/seiprotocol.seichain.tokenfactory.MsgMint` | Needs product decision: are factory/* tokens in scope? | Route to zero-value + alert pending product decision |
| `/seiprotocol.seichain.tokenfactory.MsgBurn` | Same as MsgMint | Same |

### 3.5 Chain-level gaps (from code-only analysis)

#### Gap 1: `CosmosSupportedDenomination` — only `usei` registered

**File:** `client/CosmosSupportedDenomination.java:46-48`

```java
SUPPORTED_DENOMINATION.put(
    Config.CoinSymbol.sei, new TokenDenomination(Collections.singleton("usei")));
```

Any tx with a `factory/<addr>/<subdenom>` or `ibc/<hash>` denom causes the whole tx to be silently dropped via `UNSUPPORTED_TOKEN` path at `CosmosLikeTransaction.java:758-780`. **Empirically confirmed** by simulation §3.6 and redo round 2 §3.10.

#### Gap 2: `CosmosFeeCollector` — sei/tsei ABSENT

**File:** `parser/cosmos/CosmosFeeCollector.java` — no sei or tsei entry.

`removeFeeCollectorEntries` at `CosmosLikeTransaction.java:108-129` is a complete no-op for sei. Every delegation, undelegation, and governance tx records spurious entries for module accounts. **Empirically confirmed** — indexer has accumulated **222,378,532,267,706 usei** phantom in `bonded_tokens_pool` and **36,425,141,490,160 usei** in `not_bonded_tokens_pool`.

Module accounts missing from the map (confirmed by simulation):

| Module | Address | Surfaced by |
|---|---|---|
| fee_collector (standard) | `sei17xpfvakm2amg962yls6f84z3kell8c5lqspv6q` | chain config |
| EVM module (qqqq-padding) | `sei1v4mx6hmrda5kucnpwdjsqqqqqqqqqqqqlve8dv` | MsgEVMTransaction tx |
| bonded_tokens_pool | `sei1fl48vsnmsdzcv85q5d2q4z5ajdha8yu3chcelk` | MsgDelegate tx |
| not_bonded_tokens_pool | `sei1tygms3xhhs3yv487phx3dw4a95jn7t7lvhygfz` | MsgUndelegate tx |
| gov | `sei10d07y265gmmuvt4z0w9aw880jnsr700jhwznsj` | MsgSubmitProposal v1beta1 |
| distribution | `sei1jv65s3grqf6v6jl3dp4t6c9t9rk99cd82n4207` | MsgFundCommunityPool |
| tokenfactory | `sei19ejy8n9qsectrf4semdp9cpknflld0j6svvmtq` | MsgMint txs |

#### Gap 3: `MsgExec` non-recursion (parser-wide)

`parseIsUnstakeTx` at `CosmosLikeTransaction.java:317-329` and `findVestingMessageIndices` at `:336-346` both check `tx.body.messages[]` top-level only. Confirmed bug for inner MsgUndelegate: **mainnet tx `409EAD27D0DC0CFF...`** and testnet tx **`180DCFBABB1ADD99...`** both emitted `unbond` events from inside MsgExec — the indexer simply ignores them.

#### Gap 4: `MsgEVMTransaction` complementary arrays bug

`setTransactionEntries` at `CosmosLikeTransaction.java:394-412` processes EITHER `logs[]` OR `events[]` depending on which is non-empty. For EVM txs, both are populated but with complementary data — `logs[]` has EVM traces, `events[]` has the bank `coin_spent`. When `logs[]` is non-empty, `events[]` is skipped → `coin_spent` never processed → **spender balance overstated by the EVM transfer amount per tx**.

#### Gap 5: feegrant fee-payer attribution (pre-existing, cross-chain)

`createdFeeEntry` at `CosmosLikeTransaction.java:281-307` attributes the fee to `tx.body.messages[0]` signer. Under feegrant, actual fee debit is from the granter's account. **Pre-existing bug across all Cosmos chains.**

---

## 4. Phase 2: Testnet Simulation (CGD-1483)

> Date: 2026-05-26  
> Environment: atlantic-2, seid v6.5.0  
> Source: `SIMULATION-REPORT.md`

### 4.1 Environment

| | |
|---|---|
| Attacker address | `sei1j4duheg4uy7en9vcp0xm7hndccc3euwpx7utx2` |
| Attacker funding (start) | 19,380,040 usei (19.38 SEI) |
| Net spend | ~1,029,100 usei (~1.03 SEI) + 10 SEI tokenfactory creation fee |
| Enterprise | `6a154138f4ba725fec2fad6fcd1463ab` |
| CW-20 contract (reused from CGD-1093) | `sei1zwugu0vce6fq7ccfg9u5j8tcf6cs2u5u7ydu9eknyt45puj8kt3qkwznf6` (cw20_base v1.1.2, symbol BGTEST) |
| Victim wallets created | 14 BitGo TSS `tsei` wallets |

### 4.2 Simulation outcomes overview

| Outcome | Count |
|---|---|
| Successful code-0 broadcasts | **23** |
| DeliverTx failures (code ≠ 0) landed in block | **2** (both IBC, client expired) |
| Msg types NOT registered on Sei v6.5.0 (parse-error at broadcast) | **5** |
| Silently dropped at Sei mempool (never landed) | **3** |
| Historical mainnet captures | **3** |
| Fixture files written | **34** |

### 4.3 Successful broadcasts (23) — all tx hashes

| # | Msg type | Tx hash | Height |
|---|---|---|---|
| 1 | `MsgSend` | `018766A3BA6C248E...` | 250056941 |
| 2 | `MsgMultiSend` (fan-out) | `6BABE89A950346F6...` | 250056973 |
| 3 | `edge-msgmultisend-selfloop` | `0548480C07389173...` | 250057021 |
| 4 | `edge-same-address-twice` | `FA1DBDCE0CBBF012...` | 250057049 |
| 5 | `MsgGrantAllowance` | `3096F42FAC6E013A...` | 250058258 |
| 6 | `MsgGrant` (authz) | `78E5C7C132F2C90E...` | 250058293 |
| 7 | `MsgSetWithdrawAddress` | `5B5AF6C1FF686EE6...` | 250058331 |
| 8 | `MsgCreateVestingAccount` | `7E2B499CB0C6A850...` | 250058373 |
| 9 | `MsgDelegate` (×2) | `413A59B3A0736...` / `FA67C0E929...` | 250059491 / 250059647 |
| 10 | `MsgUndelegate` | `BE14142F057C7536...` | 250059541 |
| 11 | `MsgBeginRedelegate` | `FC3A13BCCF91A534...` | 250059677 |
| 12 | `MsgWithdrawDelegatorReward` | `F9E21AF94F227C0A...` | 250059570 |
| 13 | `MsgExec` (inner MsgUndelegate) | `180DCFBABB1ADD99...` | 250059834 |
| 14 | `MsgExec` single inner MsgSend | `10BE1868DC8ADE5C...` | 250059863 |
| 15 | `MsgExec` multi inner (MsgSend + MsgSetWithdrawAddress) | `49F9960552385535...` | 250059893 |
| 16 | `MsgFundCommunityPool` | `DCFCA0511132666...` | 250060963 |
| 17 | `MsgSubmitProposal` (v1beta1) | `B96DD20A51D9F053...` | 250060990 |
| 18 | `MsgCreateDenom` (tokenfactory) | `30B220D1B310E8EF...` | 250060445 |
| 19 | `MsgMint` (kept-by-attacker) | `D734B5DC3805B94E...` | 250060551 |
| 20 | `MsgMint` (forwarded-to-victim) | `F385B6A1C09F72D7...` | 250060474 |
| 21 | `MsgBurn` (tokenfactory) | `89B9FC3044BDA96B...` | 250060581 |
| 22 | `MsgInstantiateContract` (with funds) | `5CA109F991D394C5...` | 250060829 |
| 23 | `MsgExecuteContract` (CW-20 to BitGo wallet) | `6776EB6AE32F8237...` | 250060715 |

### 4.4 DeliverTx failures (2 — IBC)

Both IBC `MsgTransfer` txs landed in a block with code=29 because all 51 atlantic-2 transfer channels have expired IBC clients as of 2026-05-26.

| Msg | Tx hash | Height | Code |
|---|---|---|---|
| `MsgTransfer` (live scenario) | `79E6BD0D346EA5FA...` | 250060300 | 29 (client Expired) |
| `MsgTransfer` (timeout scenario) | `45614D29BE57C6DF...` | 250060331 | 29 (same) |

### 4.5 Msg types NOT registered on Sei v6.5.0 (5)

These fail at broadcast with `code 2: unable to resolve type URL ... tx parse error` — they never land in any block.

| Msg type | Reason |
|---|---|
| `MsgCancelUnbondingDelegation` | cosmos-sdk v0.46 addition; Sei v0.45 fork |
| `MsgCreatePermanentLockedAccount` | cosmos-sdk v0.46 addition |
| `MsgCreatePeriodicVestingAccount` | cosmos-sdk v0.46 addition |
| `MsgInstantiateContract2` | wasmd v0.30 addition; Sei fork predates |
| `gov.v1.MsgSubmitProposal` | cosmos-sdk v0.46; all gov.v1.* unregistered |

### 4.6 Silently dropped at Sei mempool (3)

Sei v6.5.0's CheckTx runs a full simulation — it drops any tx that would fail DeliverTx before block inclusion. These never landed:
- `edge-failed-tx` (oversize amount / under-gas) — odes not include
- `MsgCreatePermanentLockedAccount` (received broadcast hash but never landed)
- `MsgCreatePeriodicVestingAccount` (same)

### 4.7 Historical mainnet captures (3)

| Msg type | Tx hash | Height | Why historical |
|---|---|---|---|
| `MsgEVMTransaction` | `62ABC7EAC436271559CF...` | 209671085 | Needs foundry/hardhat; can't submit from attacker script |
| `MsgSend` (evm module) | `40CACAF09A15F025E1B6...` | 204636477 | Internal-only on Sei v6.5.0 |
| `MsgRecvPacket` | `96C863A17E5BD3F8EE4F...` | 207042134 | Relayer-submitted; no active atlantic-2 channel |

### 4.8 Key simulation findings (new vs code-only analysis)

**Finding S1 — 5 additional module accounts confirmed missing from fee-collector map**

| Module | Address | Evidence tx |
|---|---|---|
| bonded_tokens_pool | `sei1fl48vsnmsdzcv85q5d2q4z5ajdha8yu3chcelk` | MsgDelegate `413A59B3...` |
| not_bonded_tokens_pool | `sei1tygms3xhhs3yv487phx3dw4a95jn7t7lvhygfz` | MsgUndelegate `BE14142F...` |
| gov | `sei10d07y265gmmuvt4z0w9aw880jnsr700jhwznsj` | MsgSubmitProposal `B96DD20A...` |
| distribution | `sei1jv65s3grqf6v6jl3dp4t6c9t9rk99cd82n4207` | MsgFundCommunityPool `DCFCA051...` |
| tokenfactory | `sei19ejy8n9qsectrf4semdp9cpknflld0j6svvmtq` | MsgMint `D734B5DC...` |

**Finding S2 — `MsgExec` inner `MsgUndelegate` confirmed: `unbond` event IS emitted**

Testnet tx `180DCFBABB1ADD998E4E44AD4A381219...` at height 250059834 landed code=0 and the cosmos-sdk emitted a top-level `unbond` event from inside `MsgExec.msgs[]`. The indexer has all the data — `parseIsUnstakeTx` simply doesn't look. Fix path: when iterating events, treat `unbond` event as authoritative regardless of top-level msg type.

**Finding S3 — `MsgBeginRedelegate` confirmed: `redelegate` event not in indexer switch**

Testnet tx `FC3A13BCCF91A534...` emitted `redelegate` event (with src/dst validator attributes) and `withdraw_rewards`. No `coin_received` for the share move (correct — no bank events). The parser switch simply doesn't handle the `redelegate` event type.

**Finding S4 — IBC fabric on atlantic-2 entirely broken**

All 51 open transfer-port channels reference IBC clients in `Expired` state. Any user-submitted `MsgTransfer` lands at code=29. The "IBC timeout refund" simulation scenario is not executable until relayers refresh clients.

**Finding S5 — Sei mempool blocks intentional-failure txs**

Sei's CheckTx runs a full simulation and drops anything that would fail DeliverTx. Block-included failed txs on Sei testnet are effectively limited to the IBC code=29 case.

**Finding S6 — Tokenfactory `MsgMint` emits `coinbase` event (distinct from `coin_received`)**

Fix path for tokenfactory: register `factory/*` denoms in `CosmosSupportedDenomination` — the existing event handlers will pick up the bank events naturally. The `coinbase` event is informational; the critical events (`coin_received` / `transfer`) fire afterward in the same tx.

**Finding S7 — CW-20 path on fresh BitGo wallet reproduces CGD-1093 1:1**

Tx `6776EB6AE32F8237...` on a brand-new BitGo `tsei` wallet (`sei149yhz4fyajh0c2fsprrfuafnxcvrhq04llx20x`). The tx only fires `execute` + `wasm` + `coin_spent` (fee) — no `coin_received` / `transfer` for the CW-20 amount. CGD-1093 finding is independent of wallet state.

**Finding S8 — BitGo SDK tsei addresses carry `?memoId=0`**

`walletInstance.receiveAddress()` on a tsei wallet returns `bech32?memoId=0`. The suffix must be stripped before using as a Cosmos recipient field — otherwise the chain rejects the tx. `lib/clean-wallets.ts` handles this.

**Finding S9 — Hand-rolled cosmjs proto encoders need `create()` method**

`cosmjs Registry` calls `type.create(value)` before `type.encode(...)`. Hand-rolled encoders must define `create: (m) => m` (identity) or signing throws `TypeError: type.create is not a function`.

---

## 5. Phase 3: Initial Reconciliation (2026-05-26 + 2026-05-28 redos)

> Source: `RECONCILIATION-REPORT.md`  
> Indexer: `sei-indexer-0`, git_hash `7f0f07361a31e8da97783941d0b2a1adc0014461`

### 5.1 Summary

| | Count |
|---|---|
| BitGo-victim-touching txs in scope | 9 (7 initial + 2 transfer redos on 2026-05-28) |
| Correctly indexed | **7** |
| Silently dropped by indexer | **2** ⚠️ |
| 3-way verdict | 2 confirmed parser bugs, no other mismatches |

### 5.2 Per-tx results

| Tx | Msg type | Height | Verdict | Notes |
|---|---|---|---|---|
| `018766A3...` | `MsgSend` | 250056941 | ✅ Clean | b=1000, LCD=1000, Δ=0 |
| `6BABE89A...` | `MsgMultiSend` | 250056973 | ✅ Clean | b=500, LCD=500, Δ=0 |
| `7E2B499C...` | `MsgCreateVestingAccount` | 250058373 | ✅ Clean | b=0 vs spendable=0; bank=10000 locked; correct by design |
| `10BE1868...` | `MsgExec` single inner MsgSend | 250059863 | ✅ Clean | b=300, LCD=300, Δ=0 |
| `49F99605...` | `MsgExec` multi inner | 250059893 | ✅ Clean | b=300, LCD=300, Δ=0 |
| `F385B6A1...` | `MsgMint` (factory denom → victim) | 250060474 | ❌ **BUG: UNSUPPORTED_TOKEN drop** | No tx row, no balance row; victim holds 1,000,000 factory tokens on-chain |
| `6776EB6A...` | `MsgExecuteContract` (CW-20) | 250060715 | ❌ **BUG: CGD-1093 silent drop** | No tx row, no balance row; victim holds 100 BGTEST on-chain |
| `F8B6D7FB...` | `MsgSend` self-loop (redo 2026-05-28) | 250427288 | ✅ Clean | b=4,700,000, LCD=4,700,000 |
| `23215EBB...` | `MsgSend` fan-out (redo 2026-05-28) | 250427392 | ✅ Clean | b=4,699,500, LCD=4,699,500 |

### 5.3 Why 18 "attacker-only" txs were not indexed

18 of the 27 successful broadcasts touched only the attacker or had no balance-event side. The indexer correctly ignored all of them — the attacker (`sei1j4duheg4uy7en9vcp0xm7hndccc3euwpx7utx2`) is not a tracked BitGo wallet, so its `balances` row exists but has no `walletId` field. These txs include all staking, governance, tokenfactory, feegrant, authz-grant, IBC (failed), and wasm-instantiate operations from the initial sim.

### 5.4 Notable: indexer balances snapshot post-initial-sim

| Wallet (label) | Address | Indexer `b` | LCD bank | Δ | Verdict |
|---|---|---|---|---|---|
| bank-msgsend | sei1lssjd8e... | 1,000 | 1,000 | 0 | ✅ |
| bank-msgmultisend | sei1auptus... | 500 | 500 | 0 | ✅ |
| vesting | sei1tjtmju3... | 0 | 10,000 (locked) | 0 vs spendable | ✅ |
| edge-msgexec-single | sei1wqjrcz2... | 300 | 300 | 0 | ✅ |
| edge-msgexec-multi | sei1p5k0k5u... | 300 | 300 | 0 | ✅ |
| tokenfactory-msgmint | sei1tn9jr6c... | **MISSING** | 1,000,000 factory | **−1,000,000** | ❌ |
| wasm-cw20 | sei149yhz4f... | **MISSING** | 100 BGTEST | **−100 BGTEST** | ❌ |

---

## 6. Phase 4: Redo Round 1 — BitGo SDK Attempts (2026-05-28)

> Source: `redo/REDO-REPORT.md`

### 6.1 Summary

| | |
|---|---|
| Redo wallets created | 6 BitGo TSS wallets |
| Redos attempted | 6 (2 bank transfers + 4 staking) |
| Succeeded | **2** (bank transfers, after re-funding to 5,050,000 usei each) |
| Failed (SDK bug) | **4** (all staking intents) |

### 6.2 SDK root cause: `populateIntent` strips cosmos-specific fields

`/BitGoJS/modules/sdk-core/src/bitgo/utils/mpcUtils.ts:118-271` builds a `baseIntent` with only non-chain-specific fields. It then calls `this.baseCoin.setCoinSpecificFieldsInIntent(baseIntent, params)` — a NO-OP for cosmos (the base implementation at `baseCoin.ts:642-644` is empty, and `abstract-cosmos/src/cosmosCoin.ts` did **not** override it). All cosmos-specific intent fields (`validatorAddress`, `destValidatorAddress`, `amount`) were silently dropped before reaching wallet-platform. The server constructed Msgs with empty/zero fields and rejected.

Failure pattern for all 4 staking redos:

| Intent | Error |
|---|---|
| `delegate` / `undelegate` | `transactionBuilder: validateAmount: Invalid amount: 0` |
| `switchValidator` | `Cannot read properties of undefined (reading 'value')` |
| `stakeClaimRewards` | `Invalid WithdrawDelegatorRewardsMessage validatorAddress: undefined` |

### 6.3 Wallet-platform spendable threshold empirical finding

Initial funding of 50,000 usei per wallet was insufficient — wallet-platform rejected txs with `"Transaction amount cannot be more than spendable amount"` (spendable=0 even though the chain had the balance). After re-funding to 5,050,000 usei, both transfer redos succeeded. **Empirical threshold: somewhere between 50K and 5.05M usei for fresh tsei TSS wallets.**

### 6.4 The 12 msg types with NO redo path via BitGo SDK

Per the cosmos-intent-audit, these types have no server-side intent handler in `abstractCosmosLike/utils.ts`'s `generateTransactionData()` switch:

`MsgGrantAllowance`, `MsgGrant`, `MsgSetWithdrawAddress`, `MsgExec` (inner MsgUndelegate), `MsgTransfer` (IBC), `MsgCreateDenom`, `MsgMint`, `MsgBurn` (tokenfactory), `MsgInstantiateContract`, `MsgFundCommunityPool`, `MsgSubmitProposal`

---

## 7. Phase 5: Redo Round 2 — SDK Fix + Further Broadcasts (2026-05-29)

> Source: `redo/REDO-ROUND2-REPORT.md`

### 7.1 SDK fix applied: `abstract-cosmos/src/cosmosCoin.ts`

Added `setCoinSpecificFieldsInIntent` override to `CosmosCoin`:

```typescript
setCoinSpecificFieldsInIntent(intent: PopulatedIntent, params: PrebuildTransactionWithIntentOptions): void {
  const p = params as any;
  const i = intent as any;
  switch (params.intentType) {
    case 'delegate':
    case 'stake':
    case 'undelegate':
    case 'unstake':
      if (p.validatorAddress !== undefined) i.validatorAddress = p.validatorAddress;
      if (p.amount !== undefined) i.amount = p.amount;
      delete i.recipients;   // server uses validatorAddress path only when recipients absent
      break;
    case 'stakeClaimRewards':
      if (p.validatorAddress !== undefined) i.validatorAddress = p.validatorAddress;
      delete i.recipients;
      break;
    case 'switchValidator':
      if (p.validatorAddress !== undefined) i.validatorAddress = p.validatorAddress;
      if (p.destValidatorAddress !== undefined) i.destValidatorAddress = p.destValidatorAddress;
      if (p.amount !== undefined) i.amount = p.amount;
      delete i.recipients;
      break;
    case 'contractCall':
      if (p.contract !== undefined) i.contract = p.contract;
      if (p.msgHex !== undefined) i.msgHex = p.msgHex;
      if (p.feeGranter !== undefined) i.feeGranter = p.feeGranter;
      break;
  }
}
```

**Critical detail:** `delete i.recipients` is required because wallet-platform's `constructTransactionMessageForStakingActivateOrDeactivate` checks `if (!intent.recipients)` to decide whether to use the single-validator path vs recipient-list path. An empty `[]` is truthy, causing the server to map over nothing and produce `amount=0`.

This fix unblocks cosmos staking via TSS for **all cosmos chains** (atom, osmo, sei, inj, etc.).

### 7.2 Round 2 broadcasts (7 new txs)

| # | Msg type | Tx hash | Height | Wallet | Source |
|---|---|---|---|---|---|
| 1 | `MsgSend` (edge-same-address-twice, BitGo self-loop) | `F87ACF1ECDA25857...` | 250591749 | `sei1pxf40x...` | SDK `sendMany` |
| 2 | `MsgDelegate` | `05529A67FEBA2464...` | 250594237 | `sei19urvgv...` | SDK `delegate` intent |
| 3 | `MsgUndelegate` (needs setup delegate first) | `632356B8A3570016...` | 250594881 | `sei13wk6r3...` | SDK `undelegate` intent |
| 4 | `MsgBeginRedelegate` (needs setup delegate first) | `4233F3409A3DBABC...` | 250595525 | `sei1hdf3ld...` | SDK `switchValidator` intent |
| 5 | `MsgWithdrawDelegatorReward` (needs setup first) | `587A1F26DEF66BB0...` | 250596170 | `sei1ntn9qz...` | SDK `stakeClaimRewards` intent |
| 6 | `MsgSetWithdrawAddress` (attacker-signed, BitGo wallet as new withdraw addr) | `0A3CA540209892AC...` | 250596825 | `sei1xuduap...` | Attacker-signed |
| 7 | `MsgMint + MsgSend` (factory denom → fresh BitGo wallet) | `E1726286CAB19F8C...` | 250596831 | `sei1n0cvsu...` | Attacker-signed |

Plus 4 setup delegate txs: `981E2BB7...` (for undelegate), `E7D2816F...` (for redelegate), `0A913AD4...` (for withdrawReward), `6479FE9A...` (for delegate itself after refund).

### 7.3 Not achievable without new wallet-platform intent handlers (7)

| Msg type | Blocker |
|---|---|
| `MsgMultiSend` (selfloop) | `sendMany()` only builds MsgSend — needs `multiSend` intent |
| `MsgExec` inner `MsgUndelegate` | Needs `authzGrant` + `authzExec` intents — **highest priority** (closes §5.2 parser bug) |
| `MsgTransfer` (IBC live + timeout) | Needs `ibcTransfer` intent + active atlantic-2 channels |
| `MsgCreateDenom`, `MsgBurn` (tokenfactory) | Needs tokenfactory intents |
| `MsgInstantiateContract` | Needs `wasmInstantiate` intent |
| `MsgFundCommunityPool` | Needs `distributionFundPool` intent |
| `MsgSubmitProposal` v1beta1 | Needs `govSubmitProposal` intent |

---

## 8. Phase 6: Redo Round 2 Reconciliation (2026-05-29)

> Source: `redo/RECONCILIATION-REPORT.md`  
> Indexer: `sei-indexer-0`, git_hash `424e33dd7be9d77385e53441ba2cc54749dcb6d8`

### 8.1 Summary

| | Count |
|---|---|
| Round-2 txs in scope | 10 (7 primaries + 3 setup-delegates) |
| Correctly indexed | **8** of 10 |
| Silent-dropped | **1** (MsgMint factory denom `E1726286...`) |
| Correctly skipped (no balance event) | **1** (MsgSetWithdrawAddress `0A3CA540...`) |
| All BitGo wallet `b` vs LCD bank match | **5/5** ✅ |
| NEW parser bugs confirmed | **3** |

### 8.2 Per-tx reconciliation

| Tx hash | Msg type | Verdict | Notes |
|---|---|---|---|
| `F87ACF1E...` | `MsgSend` self-loop (edge-same-address-twice) | ✅ | b=650,000, LCD=650,000 |
| `05529A67...` | `MsgDelegate` | ⚠️ Bug — b OK, wrong entry type | b=680,000 matches LCD; Transfer entry instead of Delegated; bonded_tokens_pool phantom |
| `981E2BB7...` | `MsgDelegate` (setup for undelegate) | ⚠️ Same bug | Same pattern |
| `632356B8...` | `MsgUndelegate` | ✅ with caveats | b=310,000 matches LCD; has typed `Undelegated` entry; module-account phantoms persist |
| `E7D2816F...` | `MsgDelegate` (setup for redelegate) | ⚠️ Same bug | Same pattern |
| `4233F340...` | `MsgBeginRedelegate` | ❌ **NEW BUG** | b=320,000 matches LCD (correct by accident — no bank events); **ONLY Fee entry** — no Redelegated entry, no src/dst validator tracking |
| `0A913AD4...` | `MsgDelegate` (setup for withdrawReward) | ⚠️ Same bug | Same pattern |
| `587A1F26...` | `MsgWithdrawDelegatorReward` | ❌ **NEW BUG CANDIDATE** | b=290,000 matches LCD; **ONLY Fee entry** — no Transfer entry for reward credit |
| `0A3CA540...` | `MsgSetWithdrawAddress` | ✅ Correctly skipped | No entry for BitGo target — correct |
| `E1726286...` | `MsgMint + MsgSend` factory → fresh BitGo wallet | ❌ **BUG confirmed** | No tx row, no balance row; chain has 500 factory tokens; confirms wallet-independent |

### 8.3 Module-account phantom accumulation (empirical, post-round-2)

| Module account | Address | Indexer `b` |
|---|---|---|
| bonded_tokens_pool | `sei1fl48vsnmsdzcv85q5d2q4z5ajdha8yu3chcelk` | **222,378,532,267,706 usei** (222 trillion phantom) |
| not_bonded_tokens_pool | `sei1tygms3xhhs3yv487phx3dw4a95jn7t7lvhygfz` | **36,425,141,490,160 usei** (36 trillion phantom) |

These rows have no `walletId` and don't corrupt customer balances. However they pollute any indexer-wide aggregation that doesn't filter by `walletId IS NOT NULL`.

---

## 9. Consolidated Bug Register

All confirmed and suspected bugs for SEI, across all phases, with priority.

### 9.1 Confirmed bugs (empirical evidence)

| # | Bug | Severity | Evidence | Fix target |
|---|---|---|---|---|
| B1 | **CW-20 `MsgExecuteContract` silent drop** (CGD-1093) | P1 | Testnet `6776EB6A...`; mainnet `1DC38AE1...` | `CosmosLikeTransaction.java` — surface CW-20 wasm events when no bank events fire |
| B2 | **Tokenfactory `factory/*` denom drop** — whole-tx silent drop | P1 | Testnet `F385B6A1...` and `E1726286...` (wallet-independent) | `CosmosSupportedDenomination.java` — register `factory/*` denoms or filter per-event instead of per-tx |
| B3 | **`MsgEVMTransaction` complementary-arrays bug** — spender balance overstated | P1 | Mainnet `62ABC7EAC4...` h=209671085; ~10905 usei overstated per EVM tx | `CosmosLikeTransaction.java:394-412` — merge events[] into logs[] before processing for sei |
| B4 | **`MsgExec` inner `MsgUndelegate` missing pending payback** | P1 | Mainnet `409EAD27D0...`; testnet `180DCFBA...` | `CosmosLikeTransaction.java:317-329` — unwrap `MsgExec.msgs[]` in `parseIsUnstakeTx` |
| B5 | **`MsgBeginRedelegate` emits only Fee entry** — no Redelegated tracking | P2 | Testnet `4233F340...` (BitGo wallet delegator) | `CosmosLikeTransaction.java:498-527` — add handler for `redelegate` event type |
| B6 | **`MsgDelegate` wrong entry type** — Transfer instead of Delegated + module-account phantom | P2 | Testnet `05529A67...` | `CosmosFeeCollector.java` — add sei/tsei; update MsgDelegate handler |
| B7 | **Module-account phantom accumulation** — 222T+ and 36T+ phantom usei | P2 | Empirical: `sei1fl48vsn...` and `sei1tygms3x...` in indexer | `CosmosFeeCollector.java` — add all 7 module accounts for sei/tsei |

### 9.2 Confirmed bugs (code-only analysis, no empirical BitGo-wallet test yet)

| # | Bug | Severity | Evidence | Fix target |
|---|---|---|---|---|
| B8 | **`MsgRecvPacket` fee attributed to relayer** (pre-existing cross-chain) | P3 | Mainnet `96C863A1...` h=207042134 | `CosmosLikeTransaction.java:281-307` `createdFeeEntry` — read fee-payer from `tx.auth_info.fee.payer` |
| B9 | **`MsgWithdrawDelegatorReward` reward credit missing** — ambiguous | P2/P3 | Testnet `587A1F26...` — may be reward=0 (5-min delegation) | Needs follow-up: inspect tx event log for `withdraw_rewards` amount value |

### 9.3 Code gaps (no fix yet, no live repro possible)

| # | Gap | Condition | Fix target |
|---|---|---|---|
| G1 | **`MsgCancelUnbondingDelegation` double-credit risk** — no cancel path in pending-payback task | NOT registered on Sei v6.5.0, so academic for now; matters for other cosmos chains | `CosmosLikeIndexBlockAndProcessPendingPayback.java:44-66` — add cancel handler |
| G2 | **feegrant fee-payer attribution** (pre-existing) | Affects any tx using feegrant | `CosmosLikeTransaction.java:281-307` — read from fee.payer |

---

## 10. SDK Bug and Fix

### Bug: `CosmosCoin.setCoinSpecificFieldsInIntent` missing override

**File:** `modules/abstract-cosmos/src/cosmosCoin.ts`  
**Root cause:** `populateIntent` in `mpcUtils.ts:118-271` drops all cosmos-specific fields (`validatorAddress`, `destValidatorAddress`, `amount`) before the intent reaches wallet-platform. The `setCoinSpecificFieldsInIntent` hook exists but the base impl is a no-op and `cosmosCoin.ts` never overrode it.

**Impact:** All cosmos staking operations via TSS SDK (delegate, undelegate, redelegate, claimRewards) were broken for ALL cosmos chains, not just sei.

**Fix:** Added the override (see §7.1). Status: implemented locally in `abstract-cosmos/src/cosmosCoin.ts`, not yet in a PR.

**Recommendation:** Ship as a standalone SDK PR. This is a correctness fix for all cosmos chains — atom, osmo, inj, sei, tia, etc.

---

## 11. Finalized Whitelist

Derived from CGD-1465 preliminary whitelist + CGD-1483 testnet sign-off demotions/promotions.

### 11.1 Changes vs preliminary whitelist (CGD-1465)

**Demoted (5 — not registered on Sei v6.5.0):**
- `/cosmos.staking.v1beta1.MsgCancelUnbondingDelegation`
- `/cosmos.vesting.v1beta1.MsgCreatePermanentLockedAccount`
- `/cosmos.vesting.v1beta1.MsgCreatePeriodicVestingAccount`
- `/cosmwasm.wasm.v1.MsgInstantiateContract2`
- `cosmos.gov.v1.*` all variants

**Promoted to whitelist (1 — testnet confirmed):**
- `/cosmos.gov.v1beta1.MsgSubmitProposal` — testnet tx `B96DD20A...` confirmed; moved from 🔍 to ✅

**Moved to route_to_zero_value_alert (1):**
- `/cosmwasm.wasm.v1.MsgExecuteContract` — usei path is OK but CW-20/tokenfactory paths are broken; safest routing is zero-value + alert until CW-20 fix ships

### 11.2 Final whitelist JSON

```json
{
  "chain": "sei",
  "version": "v6.5.0",
  "generated": "2026-05-26",
  "source": "CGD-1483 testnet simulation + CGD-1465 final-report.md",

  "whitelist": [
    "/cosmos.bank.v1beta1.MsgSend",
    "/cosmos.bank.v1beta1.MsgMultiSend",
    "/cosmos.staking.v1beta1.MsgUndelegate",
    "/cosmos.staking.v1beta1.MsgCreateValidator",
    "/cosmos.staking.v1beta1.MsgEditValidator",
    "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
    "/cosmos.distribution.v1beta1.MsgWithdrawValidatorCommission",
    "/cosmos.distribution.v1beta1.MsgSetWithdrawAddress",
    "/cosmos.distribution.v1beta1.MsgFundCommunityPool",
    "/cosmos.gov.v1beta1.MsgVote",
    "/cosmos.gov.v1beta1.MsgVoteWeighted",
    "/cosmos.gov.v1beta1.MsgDeposit",
    "/cosmos.gov.v1beta1.MsgSubmitProposal",
    "/cosmos.authz.v1beta1.MsgGrant",
    "/cosmos.authz.v1beta1.MsgRevoke",
    "/cosmos.feegrant.v1beta1.MsgGrantAllowance",
    "/cosmos.feegrant.v1beta1.MsgRevokeAllowance",
    "/cosmos.feegrant.v1beta1.MsgPruneAllowances",
    "/cosmos.slashing.v1beta1.MsgUnjail",
    "/cosmos.vesting.v1beta1.MsgCreateVestingAccount",
    "/ibc.applications.transfer.v1.MsgTransfer",
    "/ibc.core.channel.v1.MsgTimeout",
    "/ibc.core.channel.v1.MsgCreateClient",
    "/ibc.core.channel.v1.MsgUpdateClient",
    "/ibc.core.channel.v1.MsgConnectionOpenInit",
    "/ibc.core.channel.v1.MsgConnectionOpenTry",
    "/ibc.core.channel.v1.MsgConnectionOpenAck",
    "/ibc.core.channel.v1.MsgConnectionOpenConfirm",
    "/ibc.core.channel.v1.MsgChannelOpenInit",
    "/ibc.core.channel.v1.MsgChannelOpenTry",
    "/ibc.core.channel.v1.MsgChannelOpenAck",
    "/ibc.core.channel.v1.MsgChannelOpenConfirm",
    "/ibc.core.channel.v1.MsgChannelCloseInit",
    "/ibc.core.channel.v1.MsgChannelCloseConfirm",
    "/cosmos.upgrade.v1beta1.MsgSoftwareUpgrade",
    "/cosmos.upgrade.v1beta1.MsgCancelUpgrade",
    "/cosmos.crisis.v1beta1.MsgVerifyInvariant",
    "/cosmos.evidence.v1beta1.MsgSubmitEvidence",
    "/cosmos.mint.v1beta1.MsgUpdateParams",
    "/seiprotocol.seichain.oracle.MsgAggregateExchangeRateVote",
    "/seiprotocol.seichain.oracle.MsgDelegateFeedConsent",
    "/seiprotocol.seichain.tokenfactory.MsgCreateDenom",
    "/seiprotocol.seichain.tokenfactory.MsgUpdateDenom",
    "/seiprotocol.seichain.tokenfactory.MsgChangeAdmin",
    "/seiprotocol.seichain.tokenfactory.MsgSetDenomMetadata",
    "/cosmwasm.wasm.v1.MsgStoreCode",
    "/cosmwasm.wasm.v1.MsgMigrateContract",
    "/cosmwasm.wasm.v1.MsgUpdateAdmin",
    "/cosmwasm.wasm.v1.MsgClearAdmin",
    "/cosmwasm.wasm.v1.MsgUpdateParams",
    "/seiprotocol.seichain.evm.MsgAssociate",
    "/seiprotocol.seichain.evm.MsgAssociateContractAddress",
    "/seiprotocol.seichain.evm.MsgRegisterPointer"
  ],

  "whitelist_after_fix": [
    "/cosmos.staking.v1beta1.MsgDelegate",
    "/cosmos.authz.v1beta1.MsgExec",
    "/cosmwasm.wasm.v1.MsgInstantiateContract",
    "/seiprotocol.seichain.evm.MsgSend"
  ],

  "route_to_zero_value_alert": [
    "/cosmos.staking.v1beta1.MsgBeginRedelegate",
    "/seiprotocol.seichain.evm.MsgEVMTransaction",
    "/seiprotocol.seichain.tokenfactory.MsgMint",
    "/seiprotocol.seichain.tokenfactory.MsgBurn",
    "/seiprotocol.seichain.evm.MsgClaim",
    "/seiprotocol.seichain.evm.MsgClaimSpecific",
    "/seiprotocol.seichain.evm.MsgInternalEVMCall",
    "/seiprotocol.seichain.evm.MsgInternalEVMDelegateCall",
    "/cosmwasm.wasm.v1.MsgExecuteContract"
  ],

  "needs_simulation": [
    "/ibc.core.channel.v1.MsgAcknowledgement",
    "/ibc.core.channel.v1.MsgRecvPacket"
  ],

  "_demotions_from_preliminary": [
    "/cosmos.staking.v1beta1.MsgCancelUnbondingDelegation",
    "/cosmos.vesting.v1beta1.MsgCreatePermanentLockedAccount",
    "/cosmos.vesting.v1beta1.MsgCreatePeriodicVestingAccount",
    "/cosmwasm.wasm.v1.MsgInstantiateContract2",
    "/cosmos.gov.v1.MsgSubmitProposal",
    "/cosmos.gov.v1.MsgVote",
    "/cosmos.gov.v1.MsgVoteWeighted",
    "/cosmos.gov.v1.MsgDeposit",
    "/cosmos.gov.v1.MsgExecLegacyContent"
  ]
}
```

---

## 12. Required Fixes — Prioritized Action Plan

### P1 — Must fix before enabling whitelist enforcement

| Action | File | Detail |
|---|---|---|
| **Add sei/tsei to `CosmosFeeCollector.feeCollectorAddressMap`** | `CosmosFeeCollector.java` | Add all 7 module accounts (§9 B7). Without this, every delegation tx creates phantom entries on module-account addresses. |
| **Fix `MsgEVMTransaction` complementary-arrays bug** (B3) | `CosmosLikeTransaction.java:394-412` | For sei: process both `logs[]` and `events[]` then deduplicate; similar to zeta's `removeDuplicateEntries` pattern. Repro: mainnet `62ABC7EAC4...` |
| **Fix `MsgExec` inner-msg recursion** (B4) | `CosmosLikeTransaction.java:317-329`, `CosmosLikeIndexBlockAndProcessPendingPayback.java:52-53` | Unwrap `MsgExec.msgs[]` in `parseIsUnstakeTx` and `findVestingMessageIndices`. Repro: mainnet `409EAD27D0...` |
| **Fix `CosmosSupportedDenomination` for tokenfactory** (B2) | `CosmosSupportedDenomination.java:46-48` | Register `factory/*` denoms OR filter at the event level (drop only factory-denom entries) instead of dropping the whole tx. Repro: testnet `F385B6A1...` and `E1726286...` |
| **Fix CW-20 silent drop** (B1) | `CosmosLikeTransaction.java:parseEventsToCreateEntries()` | Surface CW-20 wasm transfer events when no bank events fire (`wasm-transfer` event attributes from known CW-20 contracts). Repro: testnet `6776EB6A...`, mainnet `1DC38AE1...` |

### P2 — Fix for correctness/completeness

| Action | File | Detail |
|---|---|---|
| **Add `redelegate` event handler** (B5) | `CosmosLikeTransaction.java:498-527` | Create zero-value + alert entry for `redelegate` event; no bank balance impact but information loss. Repro: testnet `4233F340...` |
| **Fix `MsgDelegate` entry classification** (B6) | CosmosLikeTransaction MsgDelegate handler | Emit a typed `Delegated` entry (matching `Undelegated` design) instead of a `Transfer` entry |
| **Investigate `MsgWithdrawDelegatorReward` reward credit** (B9) | CosmosLikeTransaction handler | Inspect `587A1F26...` tx event log for `withdraw_rewards amount` — distinguish reward=0 case from parser drop |
| **Ship SDK PR: `setCoinSpecificFieldsInIntent` override** | `abstract-cosmos/src/cosmosCoin.ts` | Fixes cosmos staking via TSS for all cosmos chains. PR in local branch, not yet pushed. |

### P3 — Pre-existing / cross-chain / future

| Action | Notes |
|---|---|
| **Fix `MsgRecvPacket` fee attribution** (B8) | Pre-existing across all IBC chains; `CosmosLikeTransaction.java:281-307`; `tx.auth_info.fee.payer` path |
| **Add `MsgCancelUnbondingDelegation` cancel handler** (G1) | NOT registered on Sei v6.5.0; relevant for other chains |
| **Fix feegrant fee-payer attribution** (G2) | Pre-existing; `CosmosLikeTransaction.java:281-307` |

### Future wallet-platform intent handlers needed (for full coverage)

If BitGo ever wants to support these tx types originating from a BitGo wallet:

- `authzGrant` + `authzExec` (closes MsgExec-inner-Undelegate parser bug falsifiability gap — **highest priority**)
- `ibcTransfer` (also requires active IBC relayers on atlantic-2)
- `tokenfactoryCreateDenom`, `tokenfactoryMint`, `tokenfactoryBurn`
- `wasmInstantiate`
- `distributionFundPool`
- `govSubmitProposal`
- `multiSend`

---

## 13. Ticket Reference

| Ticket | Title | Status | Role in this report |
|---|---|---|---|
| **CGD-775** | Whitelist supported Cosmos transfer types in indexer | Todo | Parent ticket; this report is the SEI deliverable |
| **CGD-1465** | [sei] generate cosmos message-type whitelist report | Done ✅ | Code-only analysis; produced GitHub final-report.md |
| **CGD-1483** | [sei] testnet simulation + 3-way balance reconciliation | In Progress | All simulation, reconciliation, and redo work |
| **CGD-1093** | [Indexer] SEI transaction type enforcement audit | In Progress | CW-20 silent drop (B1) pre-existing audit |

---

## 14. Artifacts & File Index

All artifacts are in `/Users/venkateshv/BitGo/BitGoJS/examples/ts/sei/cgd-1483-simulation/`.

| Path | Content |
|---|---|
| `SIMULATION-REPORT.md` | Phase 2 simulation details (31 broadcasts, 2026-05-26) |
| `RECONCILIATION-REPORT.md` | Phase 3 initial 3-way reconciliation (updated 2026-05-28 with transfer redos) |
| `redo/REDO-REPORT.md` | Phase 4 redo round 1 (2 transfers succeeded, 4 staking failed + root cause) |
| `redo/REDO-ROUND2-REPORT.md` | Phase 5 redo round 2 (SDK fix + 7 new broadcasts, 2026-05-29) |
| `redo/RECONCILIATION-REPORT.md` | Phase 6 redo round 2 reconciliation (3 new bugs confirmed, 2026-05-29) |
| `SEI-FULL-REPORT.md` | **This document** |
| `wallets.json` | 14 BitGo `tsei` victim wallet entries |
| `redo/redo-wallets.json` | 6 BitGo `tsei` redo wallet entries |
| `whitelist.json` | Finalized whitelist JSON |
| `reconciliation.csv` | 35-row 3-way reconciliation table |
| `tokenfactory-state.json` | Tokenfactory denom + state for reuse |
| `fixtures/*.json` (34 files) | Per-msg-type tx fixtures with on-chain data |
| `redo/fixtures/*.json` (8 files) | Redo-specific tx fixtures |
| GitHub: `BitGo/indexer` branch `sei-cosmos-whitelist-report` | `.claude/cosmos-whitelist/sei/final-report.md` — code-only phase |

---

## 15. Appendix: All Wallet Addresses Used

### Attacker wallet
| | |
|---|---|
| Address | `sei1j4duheg4uy7en9vcp0xm7hndccc3euwpx7utx2` |
| Chain | atlantic-2 (testnet) |
| Role | Signed all attacker txs; funded all victim wallets |

### Original simulation victim wallets (14)

| Label | BitGo wallet id (prefix) | Address |
|---|---|---|
| evm-msgevmtransaction | `6a1581ef862a46a3` | `sei12z2lyqydcdw32wagqyly3fqu3czu8g29ed7820` |
| tokenfactory-msgmint | `6a158201ae927286` | `sei1tn9jr6chje54u94lvhh7nrw84dxnwe3qqusgw4` |
| wasm-msgexecutecontract-cw20 | `6a1582107daa6819` | `sei149yhz4fyajh0c2fsprrfuafnxcvrhq04llx20x` |
| vesting-msgcreatevestingaccount | `6a1582228b00e127` | `sei1tjtmju3ueq7fwa376d3umrt8rxjaee3f2yawmd` |
| vesting-msgcreatepermanentlocked | `6a158234f0d2ad3e` | `sei1s7euvvw4ru66c7yjg2vgr8yfupwf4k3pufekjc` |
| vesting-msgcreateperiodic | `6a158244f0d2ad3e` | `sei1knh5qww3p9xt6rhkr8a5ccxg9sjf6wp4wpgmer` |
| bank-msgsend | `6a15825517188135` | `sei1lssjd8ecayrlket492y3npxpqdqfpdkr7dyequ` |
| bank-msgmultisend | `6a158267b7348cc9` | `sei1auptusxvwlqw2urnc9s6fw75e6zc883g2xhu84` |
| feegrant-msggrantallowance | `6a158278ecfb65b5` | `sei1xuduapaqmq3c4gkpl44wfhas6a3459074lk09k` |
| authz-msggrant | `6a15828817188135` | `sei1p35q8h20yxpqmr4pnlvk5uva2a33r9mu3yn8z8` |
| evm-msgsend | `6a158298fc64c164` | `sei1n0cvsu7ssn9klj800kcp9rlev6mu9y8q3qyavk` |
| edge-msgexec-single-inner | `6a1582a9fc64c164` | `sei1wqjrcz2dhlx3s93wmmr75l00qtsg8pkd6d2lwg` |
| edge-msgexec-multi-inner | `6a1582bbb7348cc9` | `sei1p5k0k5ulf42mr4anxlu889ejjz208qyz67wkyg` |
| edge-same-address-twice | `6a1582ca42110676` | `sei1pxf40xut3vfwt27lce0usq8ee8xdmkhxjjfxze` |

### Redo wallets (6)

| Label | BitGo wallet id | Address |
|---|---|---|
| redo-bank-msgsend-selfloop | `6a180f6fa462f8b0` | `sei1xuy46c3n9uhx8c5vlpfumrvmsfq4lmksxl0qvk` |
| redo-staking-msgdelegate | `6a180f82ff52cea1` | `sei19urvgvahwsu8nr2fpzvfdkgd30ykkhvwaczfc3` |
| redo-staking-msgundelegate | `6a180f93378e5d82` | `sei13wk6r363yuh8uk4s0xenxzgry0pfseccrnmrhf` |
| redo-staking-msgbeginredelegate | `6a180fa5c6564366` | `sei1hdf3ld43r4nv2t0a6hq3sgva6vfyg4jp557s7t` |
| redo-staking-msgwithdrawdelegatorreward | `6a180fb517a04fdc` | `sei1ntn9qzys409q8a22ya0z800knv873k8tl3m3gf` |
| redo-bank-msgsend-fanout | `6a180fc6a48c22a4` | `sei1h5224ssqzdeepqnqryq8xal2mxj3k369c7q79z` |
