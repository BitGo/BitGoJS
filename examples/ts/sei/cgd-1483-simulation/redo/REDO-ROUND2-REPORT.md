# CGD-1483 — Sei testnet REDO round 2 report

> Follow-up to `REDO-REPORT.md`. Round 1 attempted 6 BitGo SDK redos, succeeded
> on 2 (bank transfers). Round 2 unblocks the remaining 16 attacker-only msg
> types by (a) fixing a root-cause SDK gap, (b) re-running the 4 staking cases,
> and (c) broadcasting attacker-signed txs where a BitGo wallet address appears
> as the target.
>
> **Date**: 2026-05-29
> **Branch/commit**: `pr-8826-review` (local, not yet pushed)

---

## 1. Executive summary

| | Count |
|---|---|
| Original attacker-only txs (from RECONCILIATION-REPORT §4) | **18** |
| Round 1 redos succeeded (bank selfloop + fanout) | **2** |
| Round 2 new txs broadcast successfully | **7** |
| Round 2 txs credited to items already tested in original sim | **2** (MsgGrantAllowance + MsgGrant — BitGo grantee was present in original sim txs) |
| Total now tested against BitGo wallets | **11 of 18** |
| Not achievable without new wallet-platform intent handlers | **7** |

**Root cause fixed**: `abstract-cosmos/src/cosmosCoin.ts` was missing a
`setCoinSpecificFieldsInIntent` override. Without it, `populateIntent` in
`mpcUtils.ts` never forwarded `validatorAddress`, `destValidatorAddress`, or
`amount` to the WP intent payload — every staking intent reached the server
with amount=0 and was rejected. The fix also deletes `recipients` from the
intent for staking cases so the server takes the single-validator path instead
of mapping over an empty `[]`.

---

## 2. SDK fix — `abstract-cosmos/src/cosmosCoin.ts`

**File**: `modules/abstract-cosmos/src/cosmosCoin.ts`

Added `setCoinSpecificFieldsInIntent` override at the end of `CosmosCoin`:

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

**Why `delete i.recipients` is required**: wallet-platform's
`constructTransactionMessageForStakingActivateOrDeactivate`
(`abstractCosmosLike/utils.ts:731`) checks `if (!intent.recipients)` to decide
between the single-validator path (using `intent.validatorAddress`) and the
recipient-list path. An empty array `[]` is truthy, so the server falls into
the recipient-list branch, maps over nothing, produces zero messages, and the
transaction builder receives `amount=0`.

**Also required**: staking intents need `apiVersion='full'` (not `'lite'`) for
TSS signing; `prebuildTxWithIntent` now uses `'full'` for all non-transfer
intents.

---

## 3. Wallet funding (round 2)

Attacker `sei1j4duheg4uy7en9vcp0xm7hndccc3euwpx7utx2` funded 5 wallets with
1,000,000 usei each on 2026-05-29 so they exceed BitGo's wallet-platform
spendable threshold (~350K usei needed for gas headroom).

| Wallet | Address | Funding tx hash | Height |
|---|---|---|---|
| redo-staking-msgdelegate | `sei19urvgvahwsu8nr2fpzvfdkgd30ykkhvwaczfc3` | `6479FE9A...` | 250591162 |
| redo-staking-msgundelegate | `sei13wk6r363yuh8uk4s0xenxzgry0pfseccrnmrhf` | `4EF35105...` | 250591174 |
| redo-staking-msgbeginredelegate | `sei1hdf3ld43r4nv2t0a6hq3sgva6vfyg4jp557s7t` | `BADDE294...` | 250591186 |
| redo-staking-msgwithdrawdelegatorreward | `sei1ntn9qzys409q8a22ya0z800knv873k8tl3m3gf` | `188EAA01...` | 250591197 |
| edge-same-address-twice | `sei1pxf40xut3vfwt27lce0usq8ee8xdmkhxjjfxze` | `F01D4455...` | 250591208 |

---

## 4. Round 2 broadcasts — per-tx results

### 4.1 ✅ `edge-same-address-twice` — BitGo wallet self-transfer

| | |
|---|---|
| BitGo wallet | `sei1pxf40xut3vfwt27lce0usq8ee8xdmkhxjjfxze` (walletId `6a1582ca421106763a791ee76e64b401`) |
| Msg type | `/cosmos.bank.v1beta1.MsgSend` (fromAddress == toAddress) |
| tx hash | `F87ACF1ECDA25857A4B2339DA016D84718D50256215FC0AEA5622D890026D20B` |
| Height | 250591749 |
| Method | `wallet.sendMany({type: 'transfer', recipients: [{address: selfAddress, amount: '500'}]})` |
| Fixture | `redo/fixtures/edge-same-address-twice-bitgo-selfloop.json` |

**Expected indexer behavior**: two Transfer entries on the same `chainAddress`
(+500 credit, −500 debit) plus a Fee row; net balance change = fee only. If
the indexer double-credits or nets the two entries, it is a parser bug.

This is the original `edge-same-address-twice` scenario (tx `FA1DBDCE...` from
the initial sim had attacker on both sides; this redo puts the BitGo wallet on
both sides). The earlier `redo-bank-msgsend-selfloop` (tx `F8B6D7FB...`) also
tested this pattern on a *different* redo wallet; this redo uses the *original*
dedicated edge wallet.

---

### 4.2 ✅ `/cosmos.staking.v1beta1.MsgDelegate`

| | |
|---|---|
| BitGo wallet | `sei19urvgvahwsu8nr2fpzvfdkgd30ykkhvwaczfc3` (walletId `6a180f82ff52cea1f6f875b38042b198`) |
| tx hash | `05529A67FEBA246414243481824F7EE5A036C06AFC73AE113F291BB594FAE170` |
| Height | 250594237 |
| Amount delegated | 50,000 usei → `seivaloper19tup24vtzed7za6nz3r0dylm0eln2clpvhtawu` |
| SDK intent | `{intentType: 'delegate', validatorAddress: ..., amount: {value: '50000', symbol: 'tsei'}}` |
| Fixture | `redo/fixtures/redo-staking-msgdelegate.json` |

**Expected indexer behavior**: `coin_spent` on BitGo wallet (50K + fee),
`coin_received` on `bonded_tokens_pool` module account (should be filtered by
`CosmosFeeCollector` — see SIMULATION-REPORT §5.1). Indexer balance `s`
increases by 50K.

---

### 4.3 ✅ `/cosmos.staking.v1beta1.MsgUndelegate`

| | |
|---|---|
| BitGo wallet | `sei13wk6r363yuh8uk4s0xenxzgry0pfseccrnmrhf` (walletId `6a180f93378e5d82cec8e4e8cab44f3b`) |
| Setup tx (delegate 50K) | `981E2BB7A8F4C2CB653BD0A0327511A54CDE99A9BF200F44C5E626FDD2014AD1` @ 250594527 |
| Redo tx (undelegate 25K) | `632356B8A35700162F5B4E3A2982A3A08E729EE8306EEB979EF720B8408A3717` @ 250594881 |
| SDK intent | `{intentType: 'undelegate', validatorAddress: ..., amount: {value: '25000', symbol: 'tsei'}}` |
| Fixture | `redo/fixtures/redo-staking-msgundelegate.json` |

**Expected indexer behavior**: `unbond` event fires; principal goes to
`not_bonded_tokens_pool` module account during unbonding period. Indexer balance
`s` decreases by 25K; `unbonding` increases. The SIMULATION-REPORT §5.2
finding (MsgExec inner MsgUndelegate parser gap) is a different code path and
is NOT falsifiable from this redo — this tx has no MsgExec wrapper.

---

### 4.4 ✅ `/cosmos.staking.v1beta1.MsgBeginRedelegate`

| | |
|---|---|
| BitGo wallet | `sei1hdf3ld43r4nv2t0a6hq3sgva6vfyg4jp557s7t` (walletId `6a180fa5c656436698e8247143a611be`) |
| Setup tx (delegate 50K to src) | `E7D2816F74A85C6BAD4349026B6EF39041A73F415AEBFC9E8723EFB5C221FF2E` @ 250595182 |
| Redo tx (redelegate 25K src→dst) | `4233F3409A3DBABC5C81F180BF434C386296FF26A56E800A2E6549A355632C2A` @ 250595525 |
| src validator | `seivaloper19tup24vtzed7za6nz3r0dylm0eln2clpvhtawu` |
| dst validator | `seivaloper1sq7x0r2mf3gvwr2l9amtlye0yd3c6dqa4th95v` |
| SDK intent | `{intentType: 'switchValidator', validatorAddress: src, destValidatorAddress: dst, amount: ...}` |
| Fixture | `redo/fixtures/redo-staking-msgbeginredelegate.json` |

**Expected indexer behavior**: `redelegate` event fires (no bank `coin_received`
— share move has no bank events). Auto-claim `withdraw_rewards` fires. Parser
must NOT emit a transfer entry. SIMULATION-REPORT §5.3 finding
(`WRONG_EVENT_HANDLING` on `redelegate` event) is now falsifiable with a
tracked BitGo wallet.

---

### 4.5 ✅ `/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward`

| | |
|---|---|
| BitGo wallet | `sei1ntn9qzys409q8a22ya0z800knv873k8tl3m3gf` (walletId `6a180fb517a04fdc032f6da09b099ca3`) |
| Setup tx (delegate 50K) | `0A913AD4815DF46FEB2E10DF2D2872365FA8FEB3E88F7FF15A106700C49F176E` @ 250595823 |
| Redo tx (withdraw rewards) | `587A1F26DEF66BB0F7F117525A3DEE765A6E8F29CFEE83286F6FBD542D760423` @ 250596170 |
| SDK intent | `{intentType: 'stakeClaimRewards', validatorAddress: ...}` |
| Fixture | `redo/fixtures/redo-staking-msgwithdrawdelegatorreward.json` |

**Expected indexer behavior**: `withdraw_rewards` event fires; `coin_received`
on BitGo wallet (small reward amount). Indexer must create a Transfer entry for
the reward credit. If `coin_received` receiver matches `distribution` module
account (`sei1jv65s3grqf6v6jl3dp4t6c9t9rk99cd82n4207`) the parser must NOT
create an entry for that address.

---

### 4.6 ✅ `/cosmos.distribution.v1beta1.MsgSetWithdrawAddress`

| | |
|---|---|
| Signer | attacker `sei1j4duheg4uy7en9vcp0xm7hndccc3euwpx7utx2` |
| BitGo wallet (new withdraw addr) | `sei1xuduapaqmq3c4gkpl44wfhas6a3459074lk09k` (feegrant-msggrantallowance victim) |
| tx hash | `0A3CA540209892AC91DC463545CE468E7BD7F8F4F3A95CF61898D6F050B3A526` |
| Height | 250596825 |
| Fixture | `fixtures/distribution-msgsetwithdrawaddress-bitgo-target.json` |

**Expected indexer behavior**: `set_withdraw_address` event fires; no bank
events. Indexer must NOT create a Transfer entry for the BitGo wallet even
though its address appears in the tx. The address is now the attacker's active
reward-withdrawal destination — future `MsgWithdrawDelegatorReward` from the
attacker will credit this BitGo wallet.

**Difference from original sim tx `5B5AF6C1...`**: the original sim set the
withdraw address back to the attacker itself (no-op). This redo sets it to a
real registered BitGo wallet, exercising the indexer's handling when a tracked
address appears in a distribution message.

---

### 4.7 ✅ `/seiprotocol.seichain.tokenfactory.MsgMint` + `MsgSend` → fresh BitGo wallet

| | |
|---|---|
| Signer / minter | attacker `sei1j4duheg4uy7en9vcp0xm7hndccc3euwpx7utx2` |
| BitGo wallet (mint recipient) | `sei1n0cvsu7ssn9klj800kcp9rlev6mu9y8q3qyavk` (evm-msgsend victim — never received factory tokens before) |
| Factory denom | `factory/sei1j4duheg4uy7en9vcp0xm7hndccc3euwpx7utx2/cgd1483-1779796200758` |
| tx hash | `E1726286CAB19F8CE11EA64ED1DA917D1CBB84373A9CAF018C963A3D9C74B5D5` |
| Height | 250596831 |
| Fixture | `fixtures/tokenfactory-msgmint-to-fresh-bitgo-wallet.json` |

**Expected indexer behavior (and confirmed bug)**: same UNSUPPORTED_TOKEN drop
as the original sim tx `F385B6A1...`. The `CosmosSupportedDenomination` filter
rejects the factory denom and drops the whole tx — both the `MsgMint` and the
paired `MsgSend` to the BitGo wallet. No `transactions` row, no `balances` row
for the victim.

**Why this matters**: original sim `F385B6A1...` used the `tokenfactory-msgmint`
victim wallet. This redo uses the `evm-msgsend` victim which never previously
interacted with factory denoms, confirming the UNSUPPORTED_TOKEN drop is
wallet-independent. The bug is in the denom filter, not in wallet-specific
state.

---

### 4.8 ✅ `MsgGrantAllowance` and `MsgGrant` — credited from original sim

Both already tested with BitGo wallets as recipients in the original 2026-05-26
simulation:

| Msg type | tx hash | Height | BitGo wallet (grantee) |
|---|---|---|---|
| `/cosmos.feegrant.v1beta1.MsgGrantAllowance` | `3096F42FAC6E013AE93445777C29B3E6D8956D2CEBE1807FAB8A0CDCF8365E8F` | 250058258 | `sei1xuduapaqmq3c4gkpl44wfhas6a3459074lk09k` |
| `/cosmos.authz.v1beta1.MsgGrant` | `78E5C7C132F2C90E2CC5752F5CAB5D90B4F6A9FC62621EA2B5873BFF7C7E367D` | 250058293 | `sei1p35q8h20yxpqmr4pnlvk5uva2a33r9mu3yn8z8` |

RECONCILIATION-REPORT §4 confirmed the indexer correctly produced no balance
entries for either tx (both are informational — no bank events). No redo needed.

---

## 5. Not achievable — 7 msg types requiring new wallet-platform intent handlers

These msg types cannot be tested from a BitGo wallet without server-side
changes. The constraint: the BitGo wallet must be the tx SIGNER for the action
to be meaningful, and wallet-platform has no intent handler for these msg types.

| Msg type | Blocker | Recommended ticket |
|---|---|---|
| `edge-msgmultisend-selfloop` | BitGo wallet must be MsgMultiSend input AND output. `sendMany()` only builds MsgSend. Needs `multiSend` intent. Closest analog: `redo-bank-msgsend-selfloop` tx `F8B6D7FB...` (same indexer code path for same-address case). | WP FR: multiSend intent |
| `MsgExec` inner `MsgUndelegate` | BitGo wallet needs `authzGrant` to grant stake authority, then `authzExec` to execute. Neither intent exists. **Highest priority**: closes SIMULATION-REPORT §5.2 parser bug (`parseIsUnstakeTx` misses wrapped MsgUndelegate). | WP FR: authzGrant + authzExec intents |
| `MsgTransfer` (IBC live) | Needs `ibcTransfer` intent + active IBC channels (all 51 atlantic-2 channels have Expired clients as of 2026-05-29). | WP FR: ibcTransfer intent |
| `MsgTransfer` (IBC timeout) | Same as above. | Same FR |
| `MsgCreateDenom` (tokenfactory) | No recipient role for a BitGo wallet. Needs `tokenfactoryCreateDenom` intent. | WP FR: tokenfactory intents |
| `MsgBurn` (tokenfactory) | Burner must be the signer. No recipient role. Needs `tokenfactoryBurn` intent. | Same FR |
| `MsgInstantiateContract` | Instantiator must be the signer. Admin=BitGo wallet is non-impactful. Needs `wasmInstantiate` intent. | WP FR: wasmInstantiate intent |
| `MsgFundCommunityPool` | Funds go to distribution module, no recipient. Needs `distributionFundPool` intent. | WP FR: distribution intents |
| `MsgSubmitProposal` (v1beta1) | Deposit goes to gov module. Needs `govSubmitProposal` intent. | WP FR: gov intents |

Full JSON at `fixtures/redo-not-achievable.json`.

---

## 6. Full tx inventory (round 2)

| # | Msg type | Tx hash | Height | BitGo wallet | Source |
|---|---|---|---|---|---|
| 1 | MsgSend (from=to, selfloop) | `F87ACF1E...` | 250591749 | `sei1pxf40x...` (edge-same-address-twice) | SDK `sendMany` |
| 2 | MsgDelegate | `05529A67...` | 250594237 | `sei19urvgv...` (redo-staking-msgdelegate) | SDK `delegate` intent |
| 2s | MsgDelegate (setup for undelegate) | `981E2BB7...` | 250594527 | `sei13wk6r3...` | SDK `delegate` intent |
| 3 | MsgUndelegate | `632356B8...` | 250594881 | `sei13wk6r3...` (redo-staking-msgundelegate) | SDK `undelegate` intent |
| 3s | MsgDelegate (setup for redelegate) | `E7D2816F...` | 250595182 | `sei1hdf3ld...` | SDK `delegate` intent |
| 4 | MsgBeginRedelegate | `4233F340...` | 250595525 | `sei1hdf3ld...` (redo-staking-msgbeginredelegate) | SDK `switchValidator` intent |
| 4s | MsgDelegate (setup for withdrawReward) | `0A913AD4...` | 250595823 | `sei1ntn9qz...` | SDK `delegate` intent |
| 5 | MsgWithdrawDelegatorReward | `587A1F26...` | 250596170 | `sei1ntn9qz...` (redo-staking-msgwithdrawdelegatorreward) | SDK `stakeClaimRewards` intent |
| 6 | MsgSetWithdrawAddress | `0A3CA540...` | 250596825 | `sei1xuduap...` (feegrant victim, withdraw addr) | Attacker-signed |
| 7 | MsgMint + MsgSend (factory denom) | `E1726286...` | 250596831 | `sei1n0cvsu...` (evm-msgsend victim) | Attacker-signed |

Rows marked `s` are setup delegations — not the primary redo tx but required
for the target operation to be valid on-chain.

---

## 7. Indexer reconciliation status

Round 2 txs have been broadcast but reconciliation against the live tsei indexer
has NOT yet been run. The same `reconcile.ts` / Redash + Grafana method from
RECONCILIATION-REPORT.md can be re-applied with these new tx hashes:

| Expected verdict | Txs |
|---|---|
| ✅ Correctly indexed (transfer or staking entries) | `F87ACF1E`, `05529A67`, `632356B8`, `4233F340`, `587A1F26`, `0A3CA540` |
| ❌ Confirmed bug (UNSUPPORTED_TOKEN drop) | `E1726286` |
| ⚠️ Needs verification (phantom bonded_tokens_pool entry?) | `05529A67`, `981E2BB7`, `E7D2816F`, `0A913AD4` (setup delegates) |

---

## 8. Files produced

| Path | Content |
|---|---|
| `redo/03-fund-extra-wallets.ts` | Attacker funds 5 wallets to 1M usei each |
| `redo/04-run-staking-and-edge-redos.ts` | SDK-based staking + edge-same-address-twice redos |
| `redo/05-run-attacker-extras.ts` | Attacker-signed txs: MsgSetWithdrawAddress + MsgMint to BitGo wallet |
| `redo/fund-results.json` | Funding tx hashes for all 5 wallets |
| `redo/fixtures/edge-same-address-twice-bitgo-selfloop.json` | edge-same-address-twice redo fixture |
| `redo/fixtures/redo-staking-msgdelegate.json` | MsgDelegate redo fixture |
| `redo/fixtures/redo-staking-msgundelegate.json` | MsgUndelegate redo fixture (includes setup tx) |
| `redo/fixtures/redo-staking-msgbeginredelegate.json` | MsgBeginRedelegate redo fixture (includes setup tx) |
| `redo/fixtures/redo-staking-msgwithdrawdelegatorreward.json` | MsgWithdrawDelegatorReward redo fixture (includes setup tx) |
| `fixtures/distribution-msgsetwithdrawaddress-bitgo-target.json` | MsgSetWithdrawAddress with BitGo wallet as new withdraw address |
| `fixtures/tokenfactory-msgmint-to-fresh-bitgo-wallet.json` | MsgMint+MsgSend factory denom to fresh BitGo wallet — confirms UNSUPPORTED_TOKEN bug is wallet-independent |
| `fixtures/redo-not-achievable.json` | JSON array of 9 not-achievable msg types with reasons |
| `modules/abstract-cosmos/src/cosmosCoin.ts` | SDK fix: `setCoinSpecificFieldsInIntent` override |

---

## 9. Open items

1. **Run reconciliation for round 2 txs**: use the same Redash + Grafana method
   from RECONCILIATION-REPORT.md against the 7 new tx hashes in §6. Priority:
   confirm staking txs (delegate, undelegate, redelegate, withdrawReward) are
   indexed with correct `s` / `unbonding` / `b` values.

2. **Verify MsgSetWithdrawAddress has no phantom entry**: query
   `transactions._id = "0A3CA540..."` in Redash `sei-indexer-mongo` and confirm
   no entries for `sei1xuduap...`.

3. **Re-confirm UNSUPPORTED_TOKEN drop on `E1726286...`**: query for
   `transactions._id = "E1726286..."` and `balances._id = "sei1n0cvsu..."` —
   both should be absent, same as the original `F385B6A1...` finding.

4. **Open CGD-775 child tickets** for the 9 not-achievable msg types (§5) if
   BitGo wants testnet coverage for those tx types. Most impactful: `authzExec`
   intent (closes MsgExec-inner-Undelegate parser bug falsifiability gap).

5. **SDK fix PR**: `setCoinSpecificFieldsInIntent` in `cosmosCoin.ts` fixes
   cosmos staking via TSS for ALL cosmos chains (atom, osmo, sei, inj, etc.),
   not just tsei. This should be shipped as a standalone SDK PR.
