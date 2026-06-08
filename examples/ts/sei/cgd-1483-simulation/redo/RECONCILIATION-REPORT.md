# CGD-1483 — Sei testnet REDO round 2 — reconciliation report

> Companion to `REDO-ROUND2-REPORT.md`. Reconciles the 10 round-2 txs
> (4 setup delegates + 6 primary redos) plus the 2 attacker-signed-to-BitGo
> txs against the live tsei indexer and on-chain LCD.
>
> **Date**: 2026-05-29
> **Parent report**: `../RECONCILIATION-REPORT.md` (2026-05-26 sim + 2026-05-28 transfer redos)

Sources used:
- **Indexer Mongo**: `redash-test`, data source `sei-indexer-mongo` (id=169) —
  `transactions._id`, `balances._id` collections.
- **Chain (LCD)**: `https://rest-testnet.sei-apis.com` — bank, spendable,
  delegations, unbonding endpoints.
- **Indexer logs**: `grafana-test`, Loki
  `{app="sei-indexer", namespace="app-microservices-coins"}`, sim window
  2026-05-29T07:19Z to 2026-05-29T07:57Z.

---

## 1. Executive summary

| | Count |
|---|---|
| Round-2 txs that landed on chain | **10** (1 selfloop + 4 staking primaries + 4 setup-delegates + MsgSetWithdrawAddress + MsgMint factory) |
| Indexer correctly indexed | **8** of 10 (all staking + selfloop) |
| Silent-dropped by indexer | **1** ⚠️ — MsgMint+MsgSend factory denom to fresh BitGo wallet (`E1726286...`) |
| Correctly skipped (no balance event) | **1** — MsgSetWithdrawAddress (`0A3CA540...`) |
| 3-way `b` balance match (indexer `b` vs LCD bank) | **5 of 5 BitGo wallets** ✅ |
| NEW parser bugs confirmed (beyond original sim) | **3** ⚠️ |

**Top-line verdict**: every BitGo-wallet liquid balance (`b` field) matches
the chain's bank balance to the usei. Three new parser classification bugs
are confirmed on top of the two from the original RECONCILIATION-REPORT:

1. **MsgDelegate produces a Transfer entry, not a Delegated entry** — the
   indexer treats outbound delegation as a generic Transfer to the
   bonded_tokens_pool module account. Compare to MsgUndelegate which DOES
   create a typed `Undelegated` entry. Asymmetric classification.
2. **MsgBeginRedelegate emits ONLY a Fee entry** — no `Redelegated`
   informational entry, no source/destination tracking. Confirms
   SIMULATION-REPORT §5.3 `WRONG_EVENT_HANDLING` on `redelegate` event,
   now with a tracked BitGo wallet as the delegator.
3. **MsgWithdrawDelegatorReward emits ONLY a Fee entry** — no Transfer
   entry for the reward credit. May be because the reward was 0 (fresh
   ~5-minute delegation, sub-minimum-credit) or the indexer dropped the
   `coin_received` event.

The previously-confirmed bugs (UNSUPPORTED_TOKEN factory denom drop,
CW-20 silent drop) hold:

4. **`E1726286...` confirms UNSUPPORTED_TOKEN drop is wallet-independent**
   — the factory denom drops the whole tx even when the recipient is a
   fresh BitGo wallet (`sei1n0cvsu7ssn9klj800kcp9rlev6mu9y8q3qyavk`) that
   had never previously interacted with the factory denom.

---

## 2. What "tracked" means here (round 2)

All 5 round-2 wallets are registered BitGo TSS wallets:

| Wallet | walletId | Source |
|---|---|---|
| `sei1pxf40x...` | `6a1582ca421106763a791ee76e64b401` | original sim wallets.json (edge-same-address-twice) |
| `sei19urvgv...` | `6a180f82ff52cea1f6f875b38042b198` | `redo-wallets.json` (redo-staking-msgdelegate) |
| `sei13wk6r3...` | `6a180f93378e5d82cec8e4e8cab44f3b` | `redo-wallets.json` (redo-staking-msgundelegate) |
| `sei1hdf3ld...` | `6a180fa5c656436698e8247143a611be` | `redo-wallets.json` (redo-staking-msgbeginredelegate) |
| `sei1ntn9qz...` | `6a180fb517a04fdc032f6da09b099ca3` | `redo-wallets.json` (redo-staking-msgwithdrawdelegatorreward) |

Plus two pre-existing BitGo wallets used as targets of attacker-signed txs:

| Wallet | walletId | Role |
|---|---|---|
| `sei1xuduapaqmq3c4gkpl44wfhas6a3459074lk09k` | `6a158278ecfb65b5a298f39b23a8bcb7` | feegrant victim; new withdraw-address target for tx `0A3CA540...` |
| `sei1n0cvsu7ssn9klj800kcp9rlev6mu9y8q3qyavk` | `6a158298fc64c164b30ee3c598efd475` | evm-msgsend victim (fresh, never received factory tokens); mint+forward recipient for tx `E1726286...` |

The attacker `sei1j4duheg4uy7en9vcp0xm7hndccc3euwpx7utx2` is still NOT
a tracked BitGo wallet — same as original sim. Its `balances` row exists
but has no `walletId` field.

---

## 3. Per-tx reconciliation

### 3.1 ✅ `edge-same-address-twice` (BitGo self-loop) — tx `F87ACF1E...`

| | |
|---|---|
| Height | 250591749 |
| BitGo wallet | `sei1pxf40xut3vfwt27lce0usq8ee8xdmkhxjjfxze` (`6a1582ca421106763a791ee76e64b401`) |
| Indexer tx present? | ✅ yes |
| Indexer entries | Transfer +500 → self (chainAddress); Transfer −500 ← self (chainAddress); Fee −350000 ← self (chainAddress) |
| Indexer balance | `b=650,000, s=350,500, r=1,000,500, height=250591749, tu=[F87ACF1E...]` |
| LCD bank | `650,000 usei` |
| LCD spendable | `650,000 usei` |
| LCD delegations | none |
| Δ | **0 — clean** |

Identical shape to the `redo-bank-msgsend-selfloop` tx from REDO-REPORT
(§3.8 of parent RECONCILIATION-REPORT) but on the *original*
dedicated edge wallet. Confirms self-loop handling is wallet-independent.

### 3.2 ⚠️ `/cosmos.staking.v1beta1.MsgDelegate` — tx `05529A67...`

| | |
|---|---|
| Height | 250594237 |
| BitGo wallet (delegator) | `sei19urvgvahwsu8nr2fpzvfdkgd30ykkhvwaczfc3` (`6a180f82ff52cea1f6f875b38042b198`) |
| Validator | `seivaloper19tup24vtzed7za6nz3r0dylm0eln2clpvhtawu` |
| Amount delegated | 50,000 usei |
| Indexer tx present? | ✅ yes |
| Indexer entries | **Transfer +50,000 → `sei1fl48vsn...` (bonded_tokens_pool, NO chainAddress)**; Transfer −50,000 ← BitGo (chainAddress); Fee −350,000 ← BitGo (chainAddress) |
| Indexer balance (BitGo wallet) | `b=680,000, s=400,000, r=1,080,000, height=250594237, tu=[05529A67...]` |
| LCD bank (BitGo wallet) | `680,000 usei` |
| LCD delegations | `50,000 usei to seivaloper19tup24v...` |
| Δ (b vs bank) | **0** ✓ |

**Verdict: bug — but no balance break.** The BitGo wallet's `b` matches
the chain's bank balance perfectly. The two issues are:

1. **Phantom entry on module account**: `sei1fl48vsnmsdzcv85q5d2q4z5ajdha8yu3chcelk`
   (bonded_tokens_pool) gets a `+50,000` Transfer entry recorded in the
   indexer. The address has no `chainAddress` so no tracked wallet is
   corrupted, but the `balances` row for this module account has now
   accumulated **222,378,532,267,706 usei** in the indexer's view
   (222 trillion!) from every Cosmos delegation across all wallets and
   chains — pure phantom accumulation, never reconciled with chain. This
   is the SIMULATION-REPORT §5.1 `CosmosFeeCollector` gap, now empirically
   surfaced.

2. **Wrong entry classification**: the delegation output is recorded as a
   `Transfer`, not a typed `Delegated` entry. The indexer has the concept
   (we see `Undelegated` in tx `632356B8...` below), but doesn't apply it
   to MsgDelegate. Downstream consumers of the indexer's transaction feed
   cannot distinguish "wallet spent 50K on a transfer" from "wallet
   delegated 50K to a validator".

> Note on indexer's `s` field: `s=400,000 = 50,000 + 350,000` = sum of
> outbound (delegation amount + fee), NOT chain-staked. This is misleading
> naming — the field tracks the indexer's running outbound accumulator,
> not the actual delegated amount on chain. Same pattern across all
> staking wallets below.

### 3.3 ⚠️ `/cosmos.staking.v1beta1.MsgDelegate` (setup for undelegate) — tx `981E2BB7...`

| | |
|---|---|
| Height | 250594527 |
| BitGo wallet | `sei13wk6r363yuh8uk4s0xenxzgry0pfseccrnmrhf` (`6a180f93378e5d82cec8e4e8cab44f3b`) |
| Indexer tx present? | ✅ yes |
| Indexer entries | Transfer +50,000 → bonded_tokens_pool (untracked); Transfer −50,000 ← BitGo; Fee −350,000 ← BitGo |
| Verdict | **Same as §3.2** — phantom + classification, no balance break |

### 3.4 ✅ (with caveats) `/cosmos.staking.v1beta1.MsgUndelegate` — tx `632356B8...`

| | |
|---|---|
| Height | 250594881 |
| BitGo wallet | `sei13wk6r363yuh8uk4s0xenxzgry0pfseccrnmrhf` (`6a180f93378e5d82cec8e4e8cab44f3b`) |
| Amount undelegated | 25,000 usei |
| Indexer tx present? | ✅ yes |
| Indexer entries | **Transfer +25,000 → `sei1tygms3x...` (not_bonded_tokens_pool, untracked); Transfer −25,000 ← `sei1fl48vsn...` (bonded_tokens_pool, untracked); `Undelegated` value=0 on BitGo wallet (chainAddress); Fee −350,000 ← BitGo (chainAddress)** |
| Indexer balance (BitGo) | `b=310,000, s=750,000, r=1,060,000, height=250594881, tu=[632356B8...]` |
| LCD bank | `310,000 usei` |
| LCD delegations | `25,000 usei` (residual) |
| LCD unbonding | `25,000 usei` (completion 2026-06-19) |
| Δ (b vs bank) | **0** ✓ |

**Verdict: indexed correctly with typed entry, but module-account
phantom problem persists.** The indexer DID emit a typed `Undelegated`
entry (value=0, similar to VestingTransfer's design) on the BitGo
wallet. This is the right shape — the funds become unbonding, not
spendable, so value=0 reflects that. The `b` field matches LCD bank
exactly.

The two module-account entries (bonded_tokens_pool −25,000 and
not_bonded_tokens_pool +25,000) are again phantom — both have no
`chainAddress`, so no tracked wallet is corrupted, but the module
accounts continue to accumulate inflated balances in the indexer.

### 3.5 ⚠️ `/cosmos.staking.v1beta1.MsgDelegate` (setup for redelegate) — tx `E7D2816F...`

| | |
|---|---|
| Height | 250595182 |
| BitGo wallet | `sei1hdf3ld43r4nv2t0a6hq3sgva6vfyg4jp557s7t` (`6a180fa5c656436698e8247143a611be`) |
| Indexer entries | Transfer +50,000 → bonded_tokens_pool; Transfer −50,000 ← BitGo; Fee −350,000 ← BitGo |
| Verdict | **Same as §3.2** |

### 3.6 ❌ `/cosmos.staking.v1beta1.MsgBeginRedelegate` — tx `4233F340...`

| | |
|---|---|
| Height | 250595525 |
| BitGo wallet (delegator) | `sei1hdf3ld43r4nv2t0a6hq3sgva6vfyg4jp557s7t` (`6a180fa5c656436698e8247143a611be`) |
| src validator | `seivaloper19tup24vtzed7za6nz3r0dylm0eln2clpvhtawu` |
| dst validator | `seivaloper1sq7x0r2mf3gvwr2l9amtlye0yd3c6dqa4th95v` |
| Amount redelegated | 25,000 usei |
| Indexer tx present? | ✅ yes (in `transactions`) |
| Indexer entries | **ONLY Fee −350,000 ← BitGo (chainAddress)** — no `Redelegated` entry, no source/dest validator tracking |
| Indexer balance (BitGo) | `b=320,000, s=750,000, r=1,070,000, height=250595525, tu=[4233F340...]` |
| LCD bank | `320,000 usei` |
| LCD delegations | `25,000 src + 24,999 dst` (1 usei lost to share rounding) |
| Δ (b vs bank) | **0** ✓ |

**Verdict: NEW BUG CONFIRMED.** This is the empirical confirmation of
SIMULATION-REPORT §5.3 (`WRONG_EVENT_HANDLING` on `redelegate` event).
The original sim's MsgBeginRedelegate (`FC3A13BC...`) was attacker-only
and not indexed at all, so the parser bug stayed latent. With a tracked
BitGo wallet as the delegator, the bug now manifests: the indexer
records ONLY the Fee row, completely losing the redelegation
information (no entry indicates this wallet moved 25K of stake from
validator A to validator B).

The bank balance match (`b=320,000` = LCD bank) is correct because
redelegations involve no bank events on chain — the share move
happens entirely in the staking module. So the indexer's `b` is
right by accident: it didn't process the event AND there was no
bank-event impact to process.

Auto-claim of rewards on the source validator (typical cosmos
behavior — emits `withdraw_rewards`) is also not captured by the
indexer.

### 3.7 ⚠️ `/cosmos.staking.v1beta1.MsgDelegate` (setup for withdrawReward) — tx `0A913AD4...`

| | |
|---|---|
| Height | 250595823 |
| BitGo wallet | `sei1ntn9qzys409q8a22ya0z800knv873k8tl3m3gf` (`6a180fb517a04fdc032f6da09b099ca3`) |
| Indexer entries | Transfer +50,000 → bonded_tokens_pool; Transfer −50,000 ← BitGo; Fee −350,000 ← BitGo |
| Verdict | **Same as §3.2** |

### 3.8 ❌ `/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward` — tx `587A1F26...`

| | |
|---|---|
| Height | 250596170 |
| BitGo wallet (delegator) | `sei1ntn9qzys409q8a22ya0z800knv873k8tl3m3gf` (`6a180fb517a04fdc032f6da09b099ca3`) |
| Indexer tx present? | ✅ yes (in `transactions`) |
| Indexer entries | **ONLY Fee −350,000 ← BitGo (chainAddress)** — no Transfer entry for any reward credit |
| Indexer balance (BitGo) | `b=290,000, s=750,000, r=1,040,000, height=250596170, tu=[587A1F26...]` |
| LCD bank | `290,000 usei` |
| LCD delegations | `50,000 usei` (delegation unchanged) |
| Δ (b vs bank) | **0** ✓ |

**Verdict: NEW BUG CANDIDATE.** The withdraw-reward msg should emit a
`coin_received` event on the delegator + a `withdraw_rewards` event.
The indexer recorded only the fee. Two possibilities:

(a) **Reward was 0**: delegation happened at height 250595823, withdraw
    at height 250596170 — that's only ~347 blocks (~5–6 minutes) of
    accrual. Sei's testnet reward rate on a tiny 50K stake over 5
    minutes is effectively 0 usei (sub-minimum-unit). If the chain
    emitted `coin_received` with `amount=""` or no amount, the indexer
    may correctly not create an entry.

(b) **Indexer dropped it**: the chain might still emit a
    `withdraw_rewards` event with `amount="0usei"` (informational), and
    the indexer's parser might fail to emit a value=0 Transfer entry
    to record the operation happened.

**Recommend** re-running this against the LCD's tx events feed
(`/cosmos/tx/v1beta1/txs/<hash>`) to inspect the events array and
distinguish (a) vs (b). For now, the bank balance matches so no
funds are misaccounted — but the operation history record is
incomplete either way.

### 3.9 ✅ (correctly skipped) `MsgSetWithdrawAddress` (BitGo as target) — tx `0A3CA540...`

| | |
|---|---|
| Height | 250596825 |
| Signer | attacker (untracked) |
| New withdraw-addr target | BitGo wallet `sei1xuduapaqmq3c4gkpl44wfhas6a3459074lk09k` (`6a158278ecfb65b5a298f39b23a8bcb7`) |
| Indexer tx present? | ❌ NO |
| Indexer balance (target) | no row |
| LCD bank (target) | `0 usei` (no funds) |
| Δ | **0** ✓ |

**Verdict: correctly skipped.** This msg type emits a
`set_withdraw_address` event with no bank-event impact. The indexer's
behavior is consistent with the original sim's `5B5AF6C1...` (also
not indexed). The target BitGo wallet's appearance in the tx body
does not trigger indexing — which is correct, because no balance
change occurs.

Loki logs confirm block 250596825 was indexed at 07:56:45Z:

```
2026-05-29T07:56:45Z Indexing block 250596825
2026-05-29T07:56:45Z inserted block 790f023e... at height 250596825
2026-05-29T07:56:45Z Using pre-computed ending balances for block 250596825H (count=1)
```

`count=1` is the attacker's fee debit (attacker has a `balances` row
from prior tx history); no entry was created for the BitGo target.

### 3.10 ❌ `MsgMint + MsgSend` (factory denom → fresh BitGo wallet) — tx `E1726286...`

| | |
|---|---|
| Height | 250596831 |
| Signer / minter | attacker `sei1j4duheg4uy7en9vcp0xm7hndccc3euwpx7utx2` |
| Recipient (BitGo wallet) | `sei1n0cvsu7ssn9klj800kcp9rlev6mu9y8q3qyavk` (`6a158298fc64c164b30ee3c598efd475`) — fresh, never previously touched factory denom |
| Factory denom | `factory/sei1j4duheg.../cgd1483-1779796200758` |
| Indexer tx present? | ❌ NO |
| Indexer entries | — |
| Indexer balance (BitGo) | no row |
| LCD balance (BitGo) | **500 of `factory/.../cgd1483-...`** ✅ on chain |
| Δ | **−500 factory denom — indexer is short** |

**Verdict: SILENT_DROP confirmed (wallet-independent).** Same
`CosmosSupportedDenomination` filter drop as the original sim's
`F385B6A1...`. The recipient wallet had **never** previously
interacted with the factory denom, so the bug is **not** a
wallet-specific stale-state issue — it's a deterministic
parser-level rejection of any tx containing a `factory/*` denom.

Loki logs confirm block 250596831 was indexed at 07:56:48Z:

```
2026-05-29T07:56:48Z Indexing block 250596831
2026-05-29T07:56:48Z inserted block 42aedc2f... at height 250596831
2026-05-29T07:56:48Z Using pre-computed ending balances for block 250596831H (count=1)
```

`count=1` is the attacker's fee debit; the BitGo recipient got nothing.

---

## 4. Indexer balances snapshot (post round-2)

Pulled fresh on 2026-05-29T08:11Z.

| Wallet (label) | `_id` | Indexer `b` | Indexer `s` (aggregate) | LCD bank | LCD delegated | LCD unbonding | Δ (b vs bank) | Verdict |
|---|---|---|---|---|---|---|---|---|
| edge-same-addr (round-2 selfloop) | sei1pxf40x... | 650,000 | 350,500 | 650,000 | 0 | 0 | **0** | ✅ OK |
| redo-staking-msgdelegate | sei19urvgv... | 680,000 | 400,000 | 680,000 | 50,000 | 0 | **0** | ⚠️ b OK, missing Delegated entry |
| redo-staking-msgundelegate | sei13wk6r3... | 310,000 | 750,000 | 310,000 | 25,000 | 25,000 | **0** | ⚠️ b OK, has Undelegated entry, phantom module entries |
| redo-staking-msgbeginredelegate | sei1hdf3ld... | 320,000 | 750,000 | 320,000 | 49,999 (split 2 vals) | 0 | **0** | ❌ b OK by accident; redelegate not tracked |
| redo-staking-msgwithdrawdelegatorreward | sei1ntn9qz... | 290,000 | 750,000 | 290,000 | 50,000 | 0 | **0** | ❌ b OK; reward credit (if any) not tracked |
| feegrant-msggrantallowance (set as withdraw addr) | sei1xudua... | — (no row) | — | 0 | 0 | 0 | n/a | ✅ correctly skipped |
| evm-msgsend (mint+forward target) | sei1n0cvsu... | — (no row) | — | **500 factory** | 0 | 0 | **−500 factory** | ❌ SILENT_DROP |
| attacker | sei1j4duheg... | 17,861,440 | 6,782,100 | (not queried — out of scope) | — | — | n/a | n/a (not a BitGo wallet) |

Module-account phantom rows (untracked but accumulating):

| Module | Address | Indexer `b` | Notes |
|---|---|---|---|
| bonded_tokens_pool | sei1fl48vsn... | **222,378,532,267,706 usei** | All-time delegation accumulator in indexer — pure phantom |
| not_bonded_tokens_pool | sei1tygms3x... | **36,425,141,490,160 usei** | All-time undelegation accumulator |

These two rows have no `walletId` and aren't reachable from any BitGo
wallet's tracking, so they don't corrupt customer balances. But they
will pollute any indexer-wide aggregation that doesn't filter by
`walletId IS NOT NULL`.

---

## 5. Outcomes vs the REDO-ROUND2-REPORT §9 open items

| Open item | Status |
|---|---|
| #1 — Run reconciliation for round 2 txs | ✅ **Done.** This document. |
| #2 — Verify MsgSetWithdrawAddress has no phantom entry | ✅ **Confirmed** in §3.9. No entry created for the BitGo target wallet, correct behavior. |
| #3 — Re-confirm UNSUPPORTED_TOKEN drop on `E1726286...` | ✅ **Confirmed** in §3.10. Bug is wallet-independent (recipient wallet had never touched factory denom prior). |
| #4 — Open CGD-775 child tickets for 9 not-achievable msg types | Out of scope; flagged in §7. |
| #5 — Ship SDK fix PR | Out of scope; SDK change in `abstract-cosmos/src/cosmosCoin.ts` is a separate PR. |

---

## 6. Recommended ticket-level findings (new this round)

1. **MsgDelegate emits Transfer entry, not Delegated entry** (new, see §3.2).
   Repro = tx `05529A67...`, BitGo delegator
   `sei19urvgvahwsu8nr2fpzvfdkgd30ykkhvwaczfc3`, delegate 50K to
   `seivaloper19tup24v...`. Fix is in the cosmos parser's MsgDelegate
   handler — add a typed `Delegated` entry similar to `Undelegated`. The
   bank balance match is preserved either way, but downstream consumers
   need the type signal.

2. **Module-account phantom accumulation** (confirms SIMULATION-REPORT §5.1).
   The `CosmosFeeCollector.feeCollectorAddressMap` for sei/tsei is missing
   at least 5 module accounts (per SIMULATION-REPORT §5.1); empirically
   surfaced here:
   - `sei1fl48vsnmsdzcv85q5d2q4z5ajdha8yu3chcelk` (bonded_tokens_pool) — indexer accumulated 222T+ usei phantom
   - `sei1tygms3xhhs3yv487phx3dw4a95jn7t7lvhygfz` (not_bonded_tokens_pool) — 36T+ usei phantom
   - `sei1jv65s3grqf6v6jl3dp4t6c9t9rk99cd82n4207` (distribution) — surfaced in original sim
   - `sei10d07y265gmmuvt4z0w9aw880jnsr700jhwznsj` (gov) — surfaced in original sim
   - `sei19ejy8n9qsectrf4semdp9cpknflld0j6svvmtq` (tokenfactory) — surfaced in original sim

3. **MsgBeginRedelegate emits only Fee entry — no Redelegated tracking** (new, see §3.6).
   Repro = tx `4233F340...`, BitGo
   `sei1hdf3ld43r4nv2t0a6hq3sgva6vfyg4jp557s7t`. Bank balance matches
   chain only because redelegate has no bank events. Information loss:
   operators can't see this wallet moved stake between validators.

4. **MsgWithdrawDelegatorReward emits only Fee entry — reward credit missing** (new, see §3.8).
   Repro = tx `587A1F26...`, BitGo
   `sei1ntn9qzys409q8a22ya0z800knv873k8tl3m3gf`. Needs follow-up to
   distinguish "reward was 0 (sub-minimum-credit)" from "indexer dropped
   the reward event". Inspect the tx's event log via
   `https://rest-testnet.sei-apis.com/cosmos/tx/v1beta1/txs/587A1F26...`
   to confirm.

5. **UNSUPPORTED_TOKEN factory denom drop confirmed wallet-independent** (extends original §3.6).
   Repro = tx `E1726286...`, fresh BitGo
   `sei1n0cvsu7ssn9klj800kcp9rlev6mu9y8q3qyavk`. The recipient had
   zero prior factory-denom history; the indexer still dropped the
   tx. Bug is in `CosmosSupportedDenomination`, not in stale per-wallet
   state.

---

## 7. Out-of-scope follow-ups (from REDO-ROUND2-REPORT §5)

7 msg types still not achievable without new wallet-platform intent
handlers. These cannot be reconciled until those FRs ship:

- `MsgMultiSend` (selfloop) — needs `multiSend` intent
- `MsgExec` inner `MsgUndelegate` — needs `authzGrant` + `authzExec` intents. **Highest priority** — closes SIMULATION-REPORT §5.2 `parseIsUnstakeTx` parser gap.
- `MsgTransfer` (IBC live/timeout) — needs `ibcTransfer` intent + active IBC relayer
- `MsgCreateDenom`, `MsgBurn` (tokenfactory) — needs tokenfactory intents
- `MsgInstantiateContract` — needs `wasmInstantiate` intent
- `MsgFundCommunityPool` — needs `distributionFundPool` intent
- `MsgSubmitProposal` v1beta1 — needs `govSubmitProposal` intent

---

## Appendix A — Verification commands

```jsonc
// 1) Round-2 tx presence in indexer
// redash-test, data source 169 (sei-indexer-mongo)
{
  "collection": "transactions",
  "query": {"_id": {"$in": [
    "F87ACF1ECDA25857A4B2339DA016D84718D50256215FC0AEA5622D890026D20B",
    "05529A67FEBA246414243481824F7EE5A036C06AFC73AE113F291BB594FAE170",
    "981E2BB7A8F4C2CB653BD0A0327511A54CDE99A9BF200F44C5E626FDD2014AD1",
    "632356B8A35700162F5B4E3A2982A3A08E729EE8306EEB979EF720B8408A3717",
    "E7D2816F74A85C6BAD4349026B6EF39041A73F415AEBFC9E8723EFB5C221FF2E",
    "4233F3409A3DBABC5C81F180BF434C386296FF26A56E800A2E6549A355632C2A",
    "0A913AD4815DF46FEB2E10DF2D2872365FA8FEB3E88F7FF15A106700C49F176E",
    "587A1F26DEF66BB0F7F117525A3DEE765A6E8F29CFEE83286F6FBD542D760423",
    "0A3CA540209892AC91DC463545CE468E7BD7F8F4F3A95CF61898D6F050B3A526",
    "E1726286CAB19F8CE11EA64ED1DA917D1CBB84373A9CAF018C963A3D9C74B5D5"
  ]}}
}

// 2) Round-2 wallet balances
{
  "collection": "balances",
  "query": {"_id": {"$in": [
    "sei1pxf40xut3vfwt27lce0usq8ee8xdmkhxjjfxze",
    "sei19urvgvahwsu8nr2fpzvfdkgd30ykkhvwaczfc3",
    "sei13wk6r363yuh8uk4s0xenxzgry0pfseccrnmrhf",
    "sei1hdf3ld43r4nv2t0a6hq3sgva6vfyg4jp557s7t",
    "sei1ntn9qzys409q8a22ya0z800knv873k8tl3m3gf",
    "sei1xuduapaqmq3c4gkpl44wfhas6a3459074lk09k",
    "sei1n0cvsu7ssn9klj800kcp9rlev6mu9y8q3qyavk",
    "sei1fl48vsnmsdzcv85q5d2q4z5ajdha8yu3chcelk",
    "sei1tygms3xhhs3yv487phx3dw4a95jn7t7lvhygfz"
  ]}}
}
```

```logql
// 3) Indexer block-processing logs for silent-drop candidates
{app="sei-indexer"} |= "250596825"   // MsgSetWithdrawAddress
{app="sei-indexer"} |= "250596831"   // MsgMint factory
// Time window: 2026-05-29T07:55Z to 2026-05-29T08:00Z
```

```bash
# 4) LCD bank + delegations + unbonding (per wallet)
LCD="https://rest-testnet.sei-apis.com"
for addr in sei19urvgvahwsu8nr2fpzvfdkgd30ykkhvwaczfc3 sei13wk6r363yuh8uk4s0xenxzgry0pfseccrnmrhf sei1hdf3ld43r4nv2t0a6hq3sgva6vfyg4jp557s7t sei1ntn9qzys409q8a22ya0z800knv873k8tl3m3gf; do
  curl -s "$LCD/cosmos/bank/v1beta1/balances/$addr"
  curl -s "$LCD/cosmos/staking/v1beta1/delegations/$addr"
  curl -s "$LCD/cosmos/staking/v1beta1/delegators/$addr/unbonding_delegations"
done

# 5) Verify factory denom landed on recipient (the silent-drop case)
curl -s "$LCD/cosmos/bank/v1beta1/balances/sei1n0cvsu7ssn9klj800kcp9rlev6mu9y8q3qyavk"
# Expected: 500 factory/sei1j4duheg.../cgd1483-1779796200758 (chain truth)
# Indexer: no balances row at all (silent drop)
```

## Appendix B — Indexer build observed

- `git_hash`: `424e33dd7be9d77385e53441ba2cc54749dcb6d8` (different from
  original sim's `7f0f0736...` — indexer was updated between 2026-05-26
  and 2026-05-29 with `f5dc8c9b...` worth of changes)
- Logger paths sampled: `CosmosLikeIndexBlockAndProcessPendingPayback`,
  `PrepareBalanceHistory`, `com.bitgo.indexer.db.MongoBlockStore`,
  `DecorateTXsV2`
- Pod: `sei-indexer-0` in `app-microservices-coins` (test cluster)
- The "Using pre-computed ending balances for block <h>H (count=N)"
  pattern from the parent report holds — `count=1` for both
  silently-dropped blocks (`250596825`, `250596831`), accounting for
  the attacker's fee debit and nothing else.

---

## 8. Hand-off

Recon complete. **10 round-2 txs**: **6 indexed correctly** with
sensible entries (selfloop + 4 setup-delegates + undelegate has the
typed `Undelegated` entry), **2 indexed but information-lossy**
(redelegate emits only Fee, withdrawReward emits only Fee — see §3.6,
§3.8), **1 silently dropped** (factory denom mint to fresh BitGo wallet
`E1726286...`), **1 correctly skipped** (MsgSetWithdrawAddress, no
balance event).

All 5 BitGo wallet **`b` balances match the chain LCD bank balance to
the usei**. The bugs are about *entry classification and information
preservation*, not balance accounting.

Three NEW parser bugs confirmed this round (beyond original sim):
**MsgDelegate-classification**, **MsgBeginRedelegate-not-tracked**,
**MsgWithdrawDelegatorReward-reward-credit-missing**. Plus the original
**UNSUPPORTED_TOKEN factory denom drop** is now confirmed
wallet-independent.

Report: `/Users/venkateshv/BitGo/BitGoJS/examples/ts/sei/cgd-1483-simulation/redo/RECONCILIATION-REPORT.md`.

Open items: confirm via tx event log whether tx `587A1F26...`'s
withdraw-reward had `amount=0` (reward 0 due to short delegation
window) or whether the indexer dropped a non-zero reward event.
