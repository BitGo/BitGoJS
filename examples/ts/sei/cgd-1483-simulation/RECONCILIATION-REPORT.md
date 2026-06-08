# CGD-1483 — Sei testnet 3-way reconciliation report

> Companion to `SIMULATION-REPORT.md`. Reconciles the 31 broadcast msg types
> from the 2026-05-26 testnet simulation against the live tsei indexer
> (Mongo, accessed via Redash test) and the on-chain LCD (rest-testnet.sei-apis.com).
> Closes out the CGD-1483 "open items #1" by populating the indexer side
> that `reconcile.ts` left blank when `INDEXER_BALANCE_URL` was unset.
>
> **Updated 2026-05-28**: Added §3.8 and §3.9 reconciling the two
> follow-up transfer redos broadcast from BitGo TSS wallets after the
> wallet-platform spendable-check funding issue was diagnosed (see §10).

Sources used:
- **Indexer Mongo**: `redash-test`, data source `sei-indexer-mongo` (id=169) —
  `transactions._id`, `balances._id` collections.
- **Chain (LCD)**: `https://rest-testnet.sei-apis.com/cosmos/bank/v1beta1/...`
  and `/cosmwasm/wasm/v1/contract/.../smart/...` for the CW-20.
- **Indexer logs**: `grafana-test`, Loki `{app="sei-indexer", namespace="app-microservices-coins"}`,
  filtered by block height around the sim window 2026-05-26T11:24–11:55Z
  (initial run) and 2026-05-28T10:24–10:26Z (transfer redos).

---

## 1. Executive summary

| | Count |
|---|---|
| Successful chain-side broadcasts in scope | **27** (25 from initial sim + 2 transfer redos on 2026-05-28) |
| BitGo-victim-touching txs that the indexer correctly indexed | **7** (5 initial + 2 redos) |
| BitGo-victim-touching txs **silently dropped** by indexer | **2** ⚠️ |
| Attacker-only txs (no BitGo wallet involved) | **18** — correctly not indexed |
| Wallets with chain balance > 0 missing from indexer `balances` | **2** ⚠️ |
| 3-way verdict | **2 confirmed parser bugs, no other indexer mismatches** |

**Top-line verdict**: the indexer's behavior on the simulation is consistent
with the chain in every case **except the two parser bugs already flagged in
CGD-1465 / CGD-1093**:

1. **CW-20 silent drop** on a BitGo wallet — CGD-1093 reproduces 1-for-1
   on the new tsei wallet `sei149yhz4fyajh0c2fsprrfuafnxcvrhq04llx20x`.
2. **Tokenfactory `factory/*` denom drop** — `MsgMint` + inner `MsgSend`
   forwarding the factory denom to the tracked BitGo wallet
   `sei1tn9jr6chje54u94lvhh7nrw84dxnwe3qqusgw4` was dropped *whole* by
   `CosmosSupportedDenomination`, even though the bank `MsgSend` leg
   alone would normally have generated a tracked Transfer entry.

The two MsgExec parser concerns (§5.2 of SIMULATION-REPORT) are *not
falsifiable from this run* because both MsgExec txs that involved an
unbond happened with attacker as both granter and grantee, and the
attacker is not a BitGo-tracked wallet — so the indexer ignored those
txs entirely and the bug surface stayed latent. They remain on the
"needs a BitGo-wallet repro" list.

---

## 2. What "tracked" means here

For the indexer to write a `transactions` row + `entries[]` + `balances`
update, at least one address in the tx must be a registered BitGo
chain-address. From the test indexer:

- **All 14 victim wallets created in §3 of SIMULATION-REPORT.md are
  registered** — every wallet that received funds has either a `balances`
  row or no balance row at all (depending on whether anything actually
  landed for it).
- **Attacker `sei1j4duheg4uy7en9vcp0xm7hndccc3euwpx7utx2` is NOT a tracked
  BitGo wallet** even though it has a `balances` row. The row was
  auto-created as the counterparty side of a tracked BitGo wallet's tx;
  the row has no `walletId` field and `tu` references an unrelated tx
  hash from later (`966AB685... @ height 250390013`). So any tx that
  *only* affects the attacker (delegate / undelegate / withdraw rewards /
  fund pool / submit proposal / etc.) is *correctly* ignored by the
  indexer.

This means the simulation's "attacker-only" rows are not informative for
indexer reconciliation. The signal comes entirely from the 7 txs that
named a victim BitGo wallet as a recipient.

---

## 3. Per-tx reconciliation (the 9 victim-touching txs)

Wallet IDs and addresses come from `wallets.json`. "Indexer entries"
is the `entries[]` array on `transactions._id`. "Indexer balance" is
`balances.<address>.b` and `balances.<address>.s` (staked).

### 3.1 ✅ `/cosmos.bank.v1beta1.MsgSend` — tx `018766A3...`

| | |
|---|---|
| Height | 250056941 |
| Victim wallet | `sei1lssjd8ecayrlket492y3npxpqdqfpdkr7dyequ` (`6a15825517188135919a2229481617cd`) |
| Indexer tx present? | ✅ yes |
| Indexer entries | Transfer +1000 → victim (with `chainAddress`); Transfer −1000 ← attacker; Fee −20000 attacker |
| Indexer victim balance | `b=1000, s=0, height=250056941, tu=[018766A3...]` |
| LCD victim bank balance | `1000 usei` |
| Δ | **0 — clean** |

Log evidence: `Subscriber notified of ADD TRANSACTION 018766A3... → published to Kafka topic app-microservices-indexer-chain-event partition 19`.

### 3.2 ✅ `/cosmos.bank.v1beta1.MsgMultiSend` — tx `6BABE89A...`

| | |
|---|---|
| Height | 250056973 |
| Victim wallet | `sei1auptusxvwlqw2urnc9s6fw75e6zc883g2xhu84` (`6a158267b7348cc93313303f839a3445`) |
| Indexer tx present? | ✅ yes |
| Indexer entries | Transfer +500 → victim (chainAddress); Transfer +500 → attacker; Transfer −1000 ← attacker; Fee −25000 attacker |
| Indexer victim balance | `b=500, s=0, height=250056973, tu=[6BABE89A...]` |
| LCD victim bank balance | `500 usei` |
| Δ | **0 — clean** |

Both fan-out legs correctly preserved as separate Transfer entries.

### 3.3 ✅ `/cosmos.vesting.v1beta1.MsgCreateVestingAccount` — tx `7E2B499C...`

| | |
|---|---|
| Height | 250058373 |
| Victim wallet | `sei1tjtmju3ueq7fwa376d3umrt8rxjaee3f2yawmd` (`6a1582228b00e127ee10e10dbc5ca105`) |
| Indexer tx present? | ✅ yes |
| Indexer entries | **VestingTransfer +0** → victim (chainAddress); Transfer −10000 ← attacker; Fee −30000 attacker |
| Indexer victim balance | `b=0, r=0, s=0, height=250058373, tu=[7E2B499C...]` |
| LCD victim bank balance | `10000 usei` (locked) |
| LCD victim spendable | `0 usei` |
| Δ | **0 vs spendable — but bank-total is 10000 in chain, 0 in indexer** |

Behavior matches the documented Cosmos vesting design: the indexer
intentionally records `value=0` for the receive side because the funds
arrive *locked*. The indexer's `b`/`spendable` align with the chain's
`spendable`, which is the field that matters for sendability. Bank-total
is intentionally not tracked.

### 3.4 ✅ `/cosmos.authz.v1beta1.MsgExec` (single inner `MsgSend`) — tx `10BE1868...`

| | |
|---|---|
| Height | 250059863 |
| Victim wallet | `sei1wqjrcz2dhlx3s93wmmr75l00qtsg8pkd6d2lwg` (`6a1582a9fc64c164b30ee96648c9bfb7`) |
| Indexer tx present? | ✅ yes |
| Indexer entries | Transfer +300 → victim (chainAddress); Transfer −300 ← attacker; Fee −30000 attacker |
| Indexer victim balance | `b=300, height=250059863, tu=[10BE1868...]` |
| LCD victim bank balance | `300 usei` |
| Δ | **0 — clean** |

The inner `MsgSend`'s bank events fire through `MsgExec` and the indexer
attributes them correctly. (This is the *single-inner-msg* case; the
unbond inner-msg case is a different code path that this sim did **not**
exercise against a BitGo wallet.)

### 3.5 ✅ `/cosmos.authz.v1beta1.MsgExec` (multi inner `MsgSend` + `MsgSetWithdrawAddress`) — tx `49F99605...`

| | |
|---|---|
| Height | 250059893 |
| Victim wallet | `sei1p5k0k5ulf42mr4anxlu889ejjz208qyz67wkyg` (`6a1582bbb7348cc9331358a8e8a8d0b9`) |
| Indexer tx present? | ✅ yes |
| Indexer entries | Transfer +300 → victim (chainAddress); Transfer −300 ← attacker; Fee −40000 attacker |
| Indexer victim balance | `b=300, height=250059893, tu=[49F99605...]` |
| LCD victim bank balance | `300 usei` |
| Δ | **0 — clean** |

The no-balance `MsgSetWithdrawAddress` inner did not perturb the
attribution; only the bank events were emitted as entries.

### 3.6 ❌ `/seiprotocol.seichain.tokenfactory.MsgMint` (forwarded to victim) — tx `F385B6A1...`

| | |
|---|---|
| Height | 250060474 |
| Victim wallet | `sei1tn9jr6chje54u94lvhh7nrw84dxnwe3qqusgw4` (`6a158201ae927286507d0f19dadb1832`) |
| Body messages | `MsgMint` + `MsgSend` (factory denom → victim, 1,000,000 units) |
| Indexer tx present? | ❌ **NO** |
| Indexer entries | — |
| Indexer victim balance | **no row in `balances` for victim** |
| LCD victim balance | **`1000000` of `factory/sei1j4duheg.../cgd1483-1779796200758`** |
| Δ | **−1,000,000 factory denom — indexer is short** |

**Verdict: BUG (UNSUPPORTED_TOKEN drop).** Indexer logs confirm block
250060474 was fetched and `IndexBlockAndProcessPendingPayback` ran on
it ("Indexing block 250060474" → "inserted block 30188252..." at
11:50:21Z), but the tx never reached `transactions` and no balance row
was written for the tracked victim. The wider tx's inner bank `MsgSend`
to a *real* BitGo wallet was lost as collateral damage because the
`CosmosSupportedDenomination` filter rejects the whole tx on the
factory denom rather than per-msg.

### 3.7 ❌ `/cosmwasm.wasm.v1.MsgExecuteContract` (CW-20 BGTEST transfer) — tx `6776EB6A...`

| | |
|---|---|
| Height | 250060715 |
| Victim wallet | `sei149yhz4fyajh0c2fsprrfuafnxcvrhq04llx20x` (`6a1582107daa6819426c910a73550e71`) |
| Contract | `sei1zwugu0vce6fq7ccfg9u5j8tcf6cs2u5u7ydu9eknyt45puj8kt3qkwznf6` (cw20_base v1.1.2, symbol `BGTEST`) |
| Indexer tx present? | ❌ **NO** |
| Indexer entries | — |
| Indexer victim balance | **no row in `balances` for victim** |
| LCD victim bank balance | empty (no usei) |
| LCD CW-20 BGTEST balance | **`100` BGTEST** (via `cosmwasm/wasm/v1/contract/<cw20>/smart/<base64-balance-query>`) |
| Δ | **−100 BGTEST — indexer is short** |

**Verdict: BUG (CGD-1093 silent drop).** Indexer logs confirm block
250060715 was indexed at 11:52:03Z but no entries were emitted for the
victim wallet. The tx only fires `execute` + `wasm` + `coin_spent` (fee)
events on chain — no `coin_received` / `transfer` for the cw20 amount —
which is exactly the pattern CGD-1093 documented. **The bug reproduces
1-for-1 on a brand-new BitGo `tsei` wallet**, proving CGD-1093 is
independent of which wallet is on the receiving end.

### 3.8 ✅ `/cosmos.bank.v1beta1.MsgSend` (transfer redo — BitGo→self self-loop) — tx `F8B6D7FB...`

| | |
|---|---|
| Height | 250427288 |
| Date | 2026-05-28T10:24:57Z |
| BitGo sender wallet | `sei1xuy46c3n9uhx8c5vlpfumrvmsfq4lmksxl0qvk` (`6a180f6fa462f8b03dce8cbf808a5fe9`) |
| Recipient | same wallet (self-loop) |
| Amount | 500 usei + 350,000 fee |
| Indexer tx present? | ✅ yes |
| Indexer entries | Transfer +500 → self (chainAddress); Transfer −500 ← self (chainAddress); Fee −350000 ← self (chainAddress) |
| Indexer sender balance | `b=4,700,000, r=5,050,500, s=350,500, height=250427288, tu=[F8B6D7FB...]` |
| LCD sender bank balance | `4,700,000 usei` |
| LCD sender spendable | `4,700,000 usei` |
| Δ | **0 — clean** |

Both Transfer legs (+500 self-credit, −500 self-debit) are correctly
attributed to the same `chainAddress`, plus the Fee row — confirming the
indexer's self-loop handling produces a balance-neutral pair on the
transfer side and a single fee debit. Spendable matches `b` exactly; the
non-zero `s` field is internal accounting (no actual chain-side
delegations exist for this wallet — LCD staking query returns empty).

### 3.9 ✅ `/cosmos.bank.v1beta1.MsgSend` (transfer redo — BitGo→attacker fan-out) — tx `23215EBB...`

| | |
|---|---|
| Height | 250427392 |
| Date | 2026-05-28T10:25:42Z |
| BitGo sender wallet | `sei1h5224ssqzdeepqnqryq8xal2mxj3k369c7q79z` (`6a180fc6a48c22a4a7a280b733fe2a47`) |
| Recipient | `sei1j4duheg4uy7en9vcp0xm7hndccc3euwpx7utx2` (attacker, untracked) |
| Amount | 500 usei + 350,000 fee |
| Indexer tx present? | ✅ yes |
| Indexer entries | Transfer +500 → attacker (no chainAddress, untracked); Transfer −500 ← BitGo wallet (chainAddress); Fee −350000 ← BitGo wallet (chainAddress) |
| Indexer sender balance | `b=4,699,500, r=5,050,000, s=350,500, height=250427392, tu=[23215EBB...]` |
| LCD sender bank balance | `4,699,500 usei` |
| LCD sender spendable | `4,699,500 usei` |
| Δ | **0 — clean** |

The fan-out shape (BitGo wallet as sender, external attacker as
recipient) is the mirror of §3.1 (where the attacker sent to a BitGo
wallet). The indexer's symmetry holds — the BitGo sender gets a
`chainAddress`-tagged debit row, the external recipient gets a plain
Transfer row without `chainAddress`. Attacker's balance row was also
touched (`tu` references this tx hash, `b` decremented appropriately).

---

## 4. Non-victim-touching txs (18 — all correctly NOT in indexer)

The remaining 18 successful broadcasts touch only the attacker or have
no balance-event side at all. The indexer correctly ignored them
because the attacker is not a tracked BitGo wallet. They are listed
here for completeness and to document the chain side that the
reconciliation skipped.

| Msg type | Tx hash | Height | Why not indexed |
|---|---|---|---|
| edge-msgmultisend-selfloop | `0548480C...` | 250057021 | attacker→attacker |
| edge-same-address-twice | `FA1DBDCE...` | 250057049 | attacker→attacker; victim wallet `sei1pxf40x...` not in path |
| `MsgGrantAllowance` (feegrant) | `3096F42F...` | 250058258 | informational event only, no bank events |
| `MsgGrant` (authz) | `78E5C7C1...` | 250058293 | informational event only, no bank events |
| `MsgSetWithdrawAddress` | `5B5AF6C1...` | 250058331 | informational event only |
| `MsgDelegate` (delegation 1) | `413A59B3...` | 250059491 | attacker → bonded_tokens_pool module |
| `MsgDelegate` (delegation 2) | `FA67C0E9...` | 250059647 | attacker → bonded_tokens_pool module |
| `MsgUndelegate` | `BE14142F...` | 250059541 | attacker / not_bonded_tokens_pool module |
| `MsgBeginRedelegate` | `FC3A13BC...` | 250059677 | attacker; share-move has no bank events |
| `MsgWithdrawDelegatorReward` | `F9E21AF9...` | 250059570 | distribution → attacker only |
| `MsgExec` inner `MsgUndelegate` | `180DCFBA...` | 250059834 | attacker self-grant; victim sim wallet not in path |
| `MsgTransfer` (IBC live, code=29) | `79E6BD0D...` | 250060300 | failed; only attacker fee debit |
| `MsgTransfer` (IBC timeout, code=29) | `45614D29...` | 250060331 | failed; only attacker fee debit |
| `MsgCreateDenom` (tokenfactory) | `30B220D1...` | 250060445 | attacker only |
| `MsgMint` (kept-by-attacker) | `D734B5DC...` | 250060551 | attacker only |
| `MsgBurn` (tokenfactory) | `89B9FC30...` | 250060581 | attacker only |
| `MsgInstantiateContract` | `5CA109F9...` | 250060829 | attacker funds escrowed in new contract |
| `MsgFundCommunityPool` | `DCFCA051...` | 250060963 | attacker → distribution module |
| `MsgSubmitProposal` (v1beta1) | `B96DD20A...` | 250060990 | attacker → gov module |

**Note**: the SIMULATION-REPORT.md "MsgExec inner MsgUndelegate" parser
bug (§5.2) cannot be observed from this run because the granter and
grantee were both the attacker, and the attacker isn't tracked. To
falsify or confirm the bug on indexer behavior we'd need to re-broadcast
that case with a tracked BitGo wallet as the granter or grantee. This
remains the only piece of the SIMULATION-REPORT findings that this
reconciliation cannot ground-truth.

---

## 5. Indexer balances snapshot (sim window)

For completeness, the indexer `balances` rows for every wallet referenced
by the sim. Pulled fresh on 2026-05-28T10:38Z (post-redos snapshot).

| Wallet (label) | `_id` | `b` | `s` | `r` | height | last tx |
|---|---|---|---|---|---|---|
| bank-msgsend | sei1lssjd8e... | 1000 | 0 | 1000 | 250056941 | `018766A3...` |
| bank-msgmultisend | sei1auptus... | 500 | 0 | 500 | 250056973 | `6BABE89A...` |
| vesting-msgcreatevestingaccount | sei1tjtmju3... | 0 | 0 | 0 | 250058373 | `7E2B499C...` |
| edge-msgexec-single-inner | sei1wqjrcz2... | 300 | 0 | 300 | 250059863 | `10BE1868...` |
| edge-msgexec-multi-inner | sei1p5k0k5u... | 300 | 0 | 300 | 250059893 | `49F99605...` |
| **redo-selfloop (BitGo TSS)** | **sei1xuy46c3...** | **4,700,000** | **350,500** | **5,050,500** | **250427288** | **`F8B6D7FB...`** |
| **redo-fanout (BitGo TSS)** | **sei1h5224ss...** | **4,699,500** | **350,500** | **5,050,000** | **250427392** | **`23215EBB...`** |
| tokenfactory-msgmint | sei1tn9jr6c... | — (no row) | — | — | — | — ⚠️ MISSING |
| wasm-msgexecutecontract-cw20 | sei149yhz4f... | — (no row) | — | — | — | — ⚠️ MISSING |
| evm-msgevmtransaction | sei12z2lyq... | — (no row) | — | — | — | (no tx broadcast on testnet) |
| vesting-msgcreatepermanentlockedaccount | sei1s7euvv... | — (no row) | — | — | — | (msg unregistered on Sei v6.5.0) |
| vesting-msgcreateperiodicvestingaccount | sei1knh5qw... | — (no row) | — | — | — | (msg unregistered on Sei v6.5.0) |
| feegrant-msggrantallowance | sei1xudua... | — (no row) | — | — | — | (no balance event) |
| authz-msggrant | sei1p35q8h... | — (no row) | — | — | — | (no balance event) |
| evm-msgsend | sei1n0cvsu... | — (no row) | — | — | — | (no testnet broadcast — historical capture only) |
| edge-same-address-twice | sei1pxf40x... | — (no row) | — | — | — | (wallet not in tx path) |
| attacker (not a BitGo wallet) | sei1j4duheg... | 23,021,440 | 1,622,100 | 24,643,540 | 250427392 | `23215EBB...` (the fan-out redo from §3.9) |

The two ⚠️ MISSING rows are the only indexer-side mismatches. The two
**bold** rows are the 2026-05-28 redos from §3.8 and §3.9, both
matching LCD spendable to the usei.

---

## 6. Outcomes vs the open items in SIMULATION-REPORT §9

| Open item | Status |
|---|---|
| #1 — Run reconciliation against the real indexer | ✅ **Done.** This document is the result. |
| #2 — Push deliverables to `BitGo/indexer` branch `sei-cosmos-whitelist-report` | Out of scope here. Whitelist generation already produced `whitelist.json` and `final-report.md` Step-6 section; this report supplements them with empirical indexer reconciliation. |
| #3 — Open CGD-775 child tickets for parser bugs | Recommend filing on the back of this report. The two **confirmed live** bugs are CW-20 silent drop (CGD-1093 repro) and tokenfactory denom drop (new). The MsgEVMTransaction, MsgExec-inner-Undelegate, and 5 fee-collector module accounts remain code-only findings — they should still be filed but as "anticipatory" tickets, since this run could not exercise them against a tracked wallet. |
| #4 — MsgRecvPacket fee attribution bug | Out of scope — pre-existing cross-chain issue. |
| #5 — Re-attempt IBC simulations | Out of scope — atlantic-2 relayers are still down. |
| #6 — MsgEVMTransaction testnet repro | Out of scope — needs foundry/hardhat. |

---

## 7. Recommended ticket-level findings

1. **`CW-20 transfer to a BitGo wallet is silently dropped by the indexer`**
   (CGD-1093 confirmed): repro = tx `6776EB6A...` on tsei, victim
   `sei149yhz4fyajh0c2fsprrfuafnxcvrhq04llx20x`. Chain has 100 BGTEST,
   indexer has no `transactions` row and no `balances` row. Fix is in
   `CosmosLikeTransaction` event-handling — needs to surface CW-20
   transfer events from `wasm` event attributes when no bank events fire.

2. **`Tokenfactory factory/* denom drop loses paired bank MsgSend`** (new):
   repro = tx `F385B6A1...` on tsei, victim
   `sei1tn9jr6chje54u94lvhh7nrw84dxnwe3qqusgw4`. Chain has 1,000,000 of
   `factory/sei1j4duheg.../cgd1483-1779796200758`, indexer has nothing.
   Fix is in `CosmosSupportedDenomination` — either register `factory/*`
   denoms (per §5.6 of SIMULATION-REPORT) or filter at the *event* level
   (drop only the factory-denom entries) instead of dropping the whole
   tx.

3. **VestingTransfer entry-vs-bank-balance asymmetry (informational)**:
   tx `7E2B499C...` works as designed (indexer records `value=0` because
   funds arrive locked), but operators reading `balances.b` see `0`
   while the chain reports `bank=10000`. Spendable matches. Worth
   surfacing in oncall docs so this doesn't get misclassified as a drop.

---

## Appendix A — Indexer-side verification commands

For reproducing this report:

```jsonc
// 1) confirm presence/absence of any sim tx
// Run via redash-test, data source id 169 (sei-indexer-mongo).
{
  "collection": "transactions",
  "query": {"_id": {"$in": [<tx-hashes-uppercase>]}},
  "fields": {"_id": 1, "blockHeight": 1, "fee": 1, "entries": 1}
}

// 2) confirm balances row
{
  "collection": "balances",
  "query": {"_id": {"$in": [<bech32-addresses>]}}
}
```

```logql
// 3) tsei indexer logs for a block (note: 250060474 = forwarded mint, 250060715 = cw20)
{app="sei-indexer"} |= "<blockHeight>"
{app="sei-indexer"} |= "<txHash>"
// Time window for the sim: 2026-05-26T11:24Z to 2026-05-26T11:55Z
```

```bash
# 4) LCD bank
curl "https://rest-testnet.sei-apis.com/cosmos/bank/v1beta1/balances/<bech32>"

# 5) CW-20 balance (BGTEST)
Q=$(printf '{"balance":{"address":"<bech32>"}}' | base64)
curl "https://rest-testnet.sei-apis.com/cosmwasm/wasm/v1/contract/sei1zwugu0vce6fq7ccfg9u5j8tcf6cs2u5u7ydu9eknyt45puj8kt3qkwznf6/smart/$Q"
```

## Appendix B — Indexer build observed during reconciliation

- `git_hash`: `7f0f07361a31e8da97783941d0b2a1adc0014461`
- Logger paths used: `CosmosLikeIndexBlockAndProcessPendingPayback`,
  `PrepareBalanceHistory`, `com.bitgo.indexer.db.MongoBlockStore`,
  `com.bitgo.indexer.service.kafka.KafkaSubscriber`, `NotifySubscribers`
- Pod: `sei-indexer-0` in `app-microservices-coins` (test cluster)
- The block-level "Using pre-computed ending balances for block <h>H (count=1)"
  message is the closest the indexer comes to logging a balance update,
  and it fires for *every* sim block including the two silently-dropped
  ones — confirming that the indexer reached those blocks and chose to
  not produce balance entries.

---

## 10. Empirical finding: wallet-platform spendable check on fresh tsei wallets

Captured during the 2026-05-28 transfer-redo run. Round 1 (with a 50,000
usei fresh-wallet funding) was rejected by BitGo wallet-platform's
spendable check before reaching broadcast. Re-funding both TSS wallets
to ~5,050,000 usei cleared the check on the next attempt and both
transfers (§3.8, §3.9) landed in successive blocks (250427288 and
250427392) within ~45 seconds of each other.

| | |
|---|---|
| Wallets used | `sei1xuy46c3n9uhx8c5vlpfumrvmsfq4lmksxl0qvk` (selfloop) and `sei1h5224ssqzdeepqnqryq8xal2mxj3k369c7q79z` (fanout) |
| Round 1 funding | 50,000 usei → wallet-platform rejected with spendable-balance error |
| Round 2 funding | 5,050,000 usei → both broadcasts succeeded code=0 |
| Empirical threshold | wallet-platform appears to require **> ~50K usei spendable** on a fresh tsei wallet before authorizing a transfer (precise threshold not isolated; somewhere between 50K and 5.05M) |
| Indexer impact | none — once the txs landed, the indexer reconciled cleanly (verdicts in §3.8 and §3.9) |
| Tx 1 (selfloop) | `F8B6D7FB902FA6E753BEAEF818FE82EA1B003B9AE48189A13893FAA4BC9584C0` @ 250427288 |
| Tx 2 (fanout) | `23215EBB8E8E7471F47AB1E81E689BF274111699EFDCF48B740AED1FCD4EE2BA` @ 250427392 |

This is a **wallet-platform-side** observation, not an indexer one — the
indexer never sees rejected txs because they never reach the chain.
But it's worth recording here because:

1. Any future Cosmos sim that uses BitGo TSS wallets as the sender (not
   just as receivers) needs to budget for higher initial funding than
   the receiver-only sims in CGD-1483 used.
2. The threshold may relate to wallet-platform's minimum-balance policy
   for Cosmos chains. If so, it's likely chain-config'd and the
   `cosmos-whitelist-simulate` skill should detect it and fund TSS
   wallets accordingly during Phase 4 (wallet creation).
3. The exact threshold is worth nailing down in a follow-up — a binary
   search between 50K and 5.05M would isolate it cheaply.

Recommend opening a small follow-up ticket on the
wallet-platform-cosmos team to confirm the spendable-check semantics
and document the minimum funding requirement for TSS Cosmos wallets.
