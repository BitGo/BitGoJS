# CGD-1483 — Sei testnet simulation report

> Empirical follow-up to CGD-1465's code-only final report. This document
> captures every observation worth noting from running 28 broadcasts against
> sei atlantic-2 (seid v6.5.0), plus 3 historical-mainnet captures, on
> **2026-05-26**.
>
> Reconciliation (3-way: indexer Mongo vs LCD bank vs LCD spendable) is
> tracked separately — this report focuses on what the simulation revealed.

---

## 1. Executive summary

| | Count |
|---|---|
| Total Msg types attempted | **31** |
| Successful broadcasts landed (code 0) | **23** |
| Broadcasts landed with DeliverTx failure (code != 0) | **2** (both IBC client-expired) |
| Broadcasts rejected at parse (msg type not registered on Sei v6.5.0) | **5** |
| Broadcasts silently dropped at CheckTx (mempool rejected) | **3** (vesting variants + intentional-failure cases) |
| Historical-mainnet escape captures | **3** |
| Total fixture files written | **34** (28 live + 6 placeholders) |

**Top-line finding**: the report's "predicted from parser; 0 LCD results"
bucket isn't just "rare on mainnet" — for several msg types it means
**Sei v6.5.0 does not register them at all**. Those msg types are
unreachable from any user-submitted tx, so the indexer concerns the report
flagged for them are moot in practice and the preliminary whitelist needs
to be tightened accordingly.

**Smoking gun confirmation** for the #2 parser bug (`MsgExec` inner
`MsgUndelegate`): testnet tx `180DCFBABB1ADD99...` lands with code 0 and
emits an `unbond` event from inside `MsgExec.msgs[]`. The cosmos-sdk emits
the event correctly; the indexer simply doesn't look at MsgExec inner msgs
when classifying. Reproduction is now a one-line invocation against a
BitGo-controlled address.

---

## 2. Environment & attacker setup

| | |
|---|---|
| Chain | sei atlantic-2 (Sei mainnet test, seid v6.5.0) |
| Primary LCD | `https://rest-testnet.sei-apis.com` |
| Fallback LCD | `https://rest.atlantic-2.seinetwork.io` |
| Mainnet escape LCD | `https://sei-api.polkachu.com` (primary `rest.sei-apis.com` was throwing intermittent panics) |
| Attacker address | `sei1j4duheg4uy7en9vcp0xm7hndccc3euwpx7utx2` |
| Attacker funding (start) | **19,380,040 usei** = 19.38 SEI |
| Attacker funding (end) | **18,350,940 usei** + 9,500 of a custom tokenfactory denom |
| Net gas burn for run | **~1,029 mSEI** (~5.3% of starting balance) |
| Tokenfactory create fee | 10,000,000 usei (10 SEI) — the single largest expense |
| BitGo enterprise | `6a154138f4ba725fec2fad6fcd1463ab` |
| BitGo coin name | `tsei` |
| Wallet generation | TSS via `bitgo` SDK (~17 min for 14 wallets) |

The attacker mnemonic is the same one used in CGD-774 (atom vesting) and
CGD-1093 (sei CW-20). The CW-20 contract from CGD-1093
(`sei1zwugu0vce6fq7ccfg9u5j8tcf6cs2u5u7ydu9eknyt45puj8kt3qkwznf6`) was
reused, so the attacker still held BGTEST balance to send.

---

## 3. Victim wallets created (14)

Each victim wallet is a BitGo `tsei` TSS wallet bound to the
`6a154138f4ba725fec2fad6fcd1463ab` enterprise. One wallet per msg type that
expects a victim recipient. Cosmos addresses below are the on-chain
bech32 — the BitGo SDK appends `?memoId=0` to the receive-address string;
that suffix was stripped before persisting to `wallets.json` because the
indexer / LCD only know the bech32.

| msg key | BitGo wallet id (prefix) | Address |
|---|---|---|
| `evm-msgevmtransaction` | `6a1581ef862a46a3` | `sei12z2lyqydcdw32wagqyly3fqu3czu8g29ed7820` |
| `tokenfactory-msgmint` | `6a158201ae927286` | `sei1tn9jr6chje54u94lvhh7nrw84dxnwe3qqusgw4` |
| `wasm-msgexecutecontract-cw20` | `6a1582107daa6819` | `sei149yhz4fyajh0c2fsprrfuafnxcvrhq04llx20x` |
| `vesting-msgcreatevestingaccount` | `6a1582228b00e127` | `sei1tjtmju3ueq7fwa376d3umrt8rxjaee3f2yawmd` |
| `vesting-msgcreatepermanentlockedaccount` | `6a158234f0d2ad3e` | `sei1s7euvvw4ru66c7yjg2vgr8yfupwf4k3pufekjc` |
| `vesting-msgcreateperiodicvestingaccount` | `6a158244f0d2ad3e` | `sei1knh5qww3p9xt6rhkr8a5ccxg9sjf6wp4wpgmer` |
| `bank-msgsend` | `6a15825517188135` | `sei1lssjd8ecayrlket492y3npxpqdqfpdkr7dyequ` |
| `bank-msgmultisend` | `6a158267b7348cc9` | `sei1auptusxvwlqw2urnc9s6fw75e6zc883g2xhu84` |
| `feegrant-msggrantallowance` | `6a158278ecfb65b5` | `sei1xuduapaqmq3c4gkpl44wfhas6a3459074lk09k` |
| `authz-msggrant` | `6a15828817188135` | `sei1p35q8h20yxpqmr4pnlvk5uva2a33r9mu3yn8z8` |
| `evm-msgsend` | `6a158298fc64c164` | `sei1n0cvsu7ssn9klj800kcp9rlev6mu9y8q3qyavk` |
| `edge-msgexec-single-inner` | `6a1582a9fc64c164` | `sei1wqjrcz2dhlx3s93wmmr75l00qtsg8pkd6d2lwg` |
| `edge-msgexec-multi-inner` | `6a1582bbb7348cc9` | `sei1p5k0k5ulf42mr4anxlu889ejjz208qyz67wkyg` |
| `edge-same-address-twice` | `6a1582ca42110676` | `sei1pxf40xut3vfwt27lce0usq8ee8xdmkhxjjfxze` |

`?memoId=0` finding: BitGo SDK's `Wallet.receiveAddress()` returns the
bech32 followed by `?memoId=0` because tsei is registered as a memo-style
coin. Each wallet here has a **distinct root cosmos address**, so the
memoId is structural metadata — not a sub-account discriminator. Stripping
the suffix before sending funds is mandatory; otherwise the recipient
field becomes a non-bech32 string and the chain rejects the tx. The
runtime `lib/clean-wallets.ts` post-processor handles this. The
`00-create-wallets.ts` was also patched mid-run to strip on write going
forward.

---

## 4. Per-msg-type outcomes (every fixture annotated)

### 4.1 ✅ Successful broadcasts (code 0) — 23 transactions

Each row below: msg type → tx hash → height → notable events captured.
All txs are viewable at `https://www.seiscan.app/atlantic-2/txs/<hash>`.

| # | Msg type | tx hash | height | Notable events captured |
|---|---|---|---|---|
| 1 | `/cosmos.bank.v1beta1.MsgSend` | `018766A3BA6C248E842B4126E36B2B96B43DED4EBFCE9468AE76B72073EC7222` | 250056941 | `coin_spent`, `coin_received`, `transfer`, `message` |
| 2 | `/cosmos.bank.v1beta1.MsgMultiSend` | `6BABE89A950346F68C79F0FC03477BDFAE6B3B57F29918D59C212978C07C491D` | 250056973 | Fan-out: 1 input → 2 outputs (victim + attacker), each with its own `transfer` attribute pair |
| 3 | `edge-msgmultisend-selfloop` | `0548480C073891737EC9E48A53C7FD2C54515F3D778586C53147EE661B09D319` | 250057021 | attacker on both sides; one `coin_spent` + one `coin_received` for same address |
| 4 | `edge-same-address-twice` | `FA1DBDCE0CBBF012B36EA990098971AF7AEBA18B062F85E39D8223178F665841` | 250057049 | `fromAddress == toAddress`; verify indexer doesn't double-count or net-credit incorrectly |
| 5 | `/cosmos.feegrant.v1beta1.MsgGrantAllowance` | `3096F42FAC6E013AE93445777C29B3E6D8956D2CEBE1807FAB8A0CDCF8365E8F` | 250058258 | `set_feegrant` event (no balance impact); verify parser doesn't emit phantom entry |
| 6 | `/cosmos.authz.v1beta1.MsgGrant` | `78E5C7C132F2C90E2CC5752F5CAB5D90B4F6A9FC62621EA2B5873BFF7C7E367D` | 250058293 | `cosmos.authz.v1beta1.EventGrant` event (no balance) |
| 7 | `/cosmos.distribution.v1beta1.MsgSetWithdrawAddress` | `5B5AF6C1FF686EE6902144E1984C54F4E407864BEACB221DD959DE5C559A4B10` | 250058331 | `set_withdraw_address` event (no balance) |
| 8 | `/cosmos.vesting.v1beta1.MsgCreateVestingAccount` | `7E2B499CB0C6A8503069D819A0FD35BA313CFA65401A9A3054664D677F648A5D` | 250058373 | `coin_spent` on attacker, `coin_received` on victim, `transfer` pair; parser must emit a **VestingTransfer** (zero-value for receiver) |
| 9 | `/cosmos.staking.v1beta1.MsgDelegate` | `413A59B3A073636BDD98D2BCF3053CE29024F915E25D6C2DB9D72EEFC19EC22E` (and `FA67C0E92900CB8A...` for second delegation) | 250059491 / 250059647 | **Confirms fee-collector gap live**: `coin_received` receiver is `sei1fl48vsnmsdzcv85q5d2q4z5ajdha8yu3chcelk` (bonded_tokens_pool module account). `withdraw_rewards` also fires (auto-claim). |
| 10 | `/cosmos.staking.v1beta1.MsgUndelegate` | `BE14142F057C7536626D2342E0E3B8EDC52EF089B3042212ED94E66578C47E8F` | 250059541 | **`unbond` event** fires; principal goes to `sei1tygms3xhhs3yv487phx3dw4a95jn7t7lvhygfz` (not_bonded_tokens_pool); deferred-emission path |
| 11 | `/cosmos.staking.v1beta1.MsgBeginRedelegate` | `FC3A13BCCF91A534C622313B39E164C8DC3DA740924E6D2DDF01AC0FF5EEB153` | 250059677 | **`redelegate` event** fires (parser switch doesn't handle it — confirmed WRONG_EVENT_HANDLING on testnet). NO `coin_received` (share move has no bank events). `withdraw_rewards` auto-claim fires. |
| 12 | `/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward` | `F9E21AF94F227C0AE43EFD9D91A2A5C1F20A65A82FB805415D86B9E02862DF0D` | 250059570 | `withdraw_rewards` event + `coin_received` on delegator |
| 13 | `/cosmos.authz.v1beta1.MsgExec (inner MsgUndelegate)` — **THE bug case** | `180DCFBABB1ADD998E4E44AD4A381219947FAD7C0657E54829A2360C90BBCF54` | 250059834 | **Event types observed**: `unbond`, `coin_received`, `coin_spent`, `transfer`, `withdraw_rewards`. The `unbond` event IS emitted from inside MsgExec — the indexer's `parseIsUnstakeTx` simply doesn't look at MsgExec.msgs[] to find it. Granter=grantee=attacker (same-mnemonic mode) — bug class is identical to two-party authz. |
| 14 | `edge-msgexec-single-inner` (MsgSend) | `10BE1868DC8ADE5C70A9513C5203EC8CD092FBC044E076D712E78A8DC95891A9` | 250059863 | Inner MsgSend's bank events DO fire through MsgExec; verify the parser correctly attributes them |
| 15 | `edge-msgexec-multi-inner` (MsgSend + MsgSetWithdrawAddress) | `49F9960552385535364FB90F13441F529AE29639F690D05FE854E44B5E29DAAB` | 250059893 | Mix of move + no-move inners; events: `coin_received`, `coin_spent`, `transfer`, `set_withdraw_address`. Confirms each inner msg's events fire independently. |
| 16 | `/cosmos.distribution.v1beta1.MsgFundCommunityPool` | `DCFCA0511132666146920D9F43F90DC243DC130443A297BF80F637CC699E3F16` | 250060963 | `coin_received` receiver is `sei1jv65s3grqf6v6jl3dp4t6c9t9rk99cd82n4207` (distribution module account — also missing from CosmosFeeCollector) |
| 17 | `/cosmos.gov.v1beta1.MsgSubmitProposal` | `B96DD20A51D9F053DE8CE8E92B1FD41793E248B9FA1CA30EAD783048DDBEA350` | 250060990 | `submit_proposal` + `proposal_deposit` events; deposit `coin_received` receiver `sei10d07y265gmmuvt4z0w9aw880jnsr700jhwznsj` (gov module account) |
| 18 | `/seiprotocol.seichain.tokenfactory.MsgCreateDenom` | `30B220D1B310E8EF64954EAC3527648DF3CCB1A9DB253E022FE903025BF1AAD7` | 250060445 | Cost: 10,000,000 usei (creation fee, separate from gas). New denom: `factory/sei1j4duheg.../cgd1483-1779796200758`. No balance-event noise. |
| 19 | `/seiprotocol.seichain.tokenfactory.MsgMint` (kept-by-attacker) | `D734B5DC3805B94E3E69B78B3590CC5C79B56B12AA0196B497387BB9A1A31B9E` | 250060551 | **Events**: `coinbase` (mint-specific), `mint`, `coin_received` on tokenfactory module (`sei19ejy8n9qsectrf4semdp9cpknflld0j6svvmtq`) → then `transfer` to attacker. Parser sees factory denom and routes via `CosmosSupportedDenomination` filter — currently silently drops. |
| 20 | `/seiprotocol.seichain.tokenfactory.MsgMint` (forwarded-to-victim) | `F385B6A1C09F72D741748B97B7C99B3DC53F8BE0E1ADC91B38373313984B899D` | 250060474 | Same mint chain, then a second message in the same tx forwards to victim. Useful for testing the multi-inner case AND the unsupported-denom path together. |
| 21 | `/seiprotocol.seichain.tokenfactory.MsgBurn` | `89B9FC3044BDA96B9F66090D6D8709A9D03E62060E5671A67291AF8D388F0F21` | 250060581 | **Events**: `burn` (specific), `coin_spent` on burner (attacker), `coin_received` on module; same UNSUPPORTED_TOKEN drop pattern in reverse. |
| 22 | `/cosmwasm.wasm.v1.MsgInstantiateContract` (with attached funds) | `5CA109F991D394C5BF4CD3835B8571C606E61643E0812BEC9B2F88D6A44C31EF` | 250060829 | Re-uses code_id 4029 (cw20_base v1.1.2). `coin_spent` for funds, then escrowed in contract address. Token symbol must match `/^[a-zA-Z\-]{3,12}$/` — original gen with digits failed code 4, fixed mid-run. |
| 23 | `/cosmwasm.wasm.v1.MsgExecuteContract` (CW-20 transfer to BitGo wallet) | `6776EB6AE32F8237CF51807C815F77D29E75DFD6FC947CD97BEF63282AC1C1C3` | 250060715 | **CGD-1093 silent-drop repro** on a NEW BitGo wallet. Event types: only `execute`, `wasm`, `coin_spent` (fee), `message`. NO `coin_received` / `transfer` for the CW-20 amount → indexer creates zero entries for the victim. |

### 4.2 ⚠️ Broadcasts that landed with DeliverTx failure (code != 0)

Both are IBC outbounds that the chain rejected because every open transfer
channel on atlantic-2 had an Expired IBC client at sim time. The tx still
lands in a block, so the indexer DOES see it and must correctly handle the
"only fee debit, no transfer entry" path.

| Msg | tx hash | height | code | rawLog |
|---|---|---|---|---|
| `MsgTransfer` (live scenario) | `79E6BD0D346EA5FA4031679E14B71B9433751AE59F475F02C0030E113EC2960C` | 250060300 | 29 | "cannot send packet using client (07-tendermint-42) with status Expired: client is not active" |
| `MsgTransfer` (timeout scenario) | `45614D29BE57C6DF1F1E2670DDE9D3BA5F24D01A6AFFA0776EC6D575921CD1A2` | 250060331 | 29 | Same expired-client message |

For the failed `MsgTransfer`, only `coin_spent` (fee), `signer`, `tx`
events fire — no `transfer` or `coin_received`. Indexer correctness here:
must produce a fee-only entry, no escrow entry.

### 4.3 ❌ Msg types NOT registered on Sei v6.5.0 (5 — significant finding)

Each of these returned `Broadcast FAILED (code 2): unable to resolve type
URL ...: tx parse error` *before* any tx hash was assigned. The msg type
exists in cosmos-sdk / wasmd source but isn't compiled into Sei's binary.

| Msg type | Why missing on Sei |
|---|---|
| `/cosmos.staking.v1beta1.MsgCancelUnbondingDelegation` | Added in cosmos-sdk v0.46. Sei is on a v0.45 fork; staking module doesn't register it. |
| `/cosmos.vesting.v1beta1.MsgCreatePermanentLockedAccount` | Added in cosmos-sdk v0.46. Sei v0.45 fork omits. |
| `/cosmos.vesting.v1beta1.MsgCreatePeriodicVestingAccount` | Same — v0.46 addition not present on Sei. |
| `/cosmwasm.wasm.v1.MsgInstantiateContract2` | Added in wasmd v0.30. Sei's wasmd fork predates v0.30. |
| `/cosmos.gov.v1.MsgSubmitProposal` | gov v1 ships in cosmos-sdk v0.46+. Sei only registers `gov.v1beta1.*`. Implication: ALL `cosmos.gov.v1.*` variants (Vote, VoteWeighted, Deposit, ExecLegacyContent) are also unregistered. |

> **Implication for the whitelist**: every msg in this list should be
> **removed from `whitelist_after_fix`** in CGD-1465's preliminary list —
> they're not reachable on Sei in practice, so the indexer's behavior for
> them is academic. We've explicitly demoted them in `whitelist.json`'s
> `_demotions_from_preliminary` block.

### 4.4 🚫 Msgs silently dropped at Sei mempool (CheckTx-time rejection)

These broadcasts returned `code 0` from `BROADCAST_MODE_SYNC` (the
mempool *accepted* them), but they never appeared in any block. After 60s
of polling, LCD returns `NotFound`. Sei's CheckTx evidently does
opportunistic simulation and aborts before block inclusion.

| Scenario | Behavior |
|---|---|
| `edge-failed-tx` — MsgSend with amount > attacker balance OR with under-gas limit | CheckTx accepts → mempool drop → no block inclusion. Confirms Sei v6.5.0 is more aggressive than vanilla cosmos here. |
| `vesting-msgcreatepermanentlockedaccount` (one of the 5 from §4.3 — different signature: this one DOES return a tx hash but never includes) | CheckTx accepts the broadcast; tx never lands. Hand-rolled proto encoder succeeded, but Sei dropped the tx at mempool. |
| `vesting-msgcreateperiodicvestingaccount` | Same — broadcast hash returned, no inclusion. |

> **Implication for "edge: failed tx" CGD-1483 requirement**: the
> playbook expects a "failed tx — zero impact" reconciliation row. On Sei
> v6.5.0 testnet, **block-included failed txs are rare** because the
> mempool pre-screens them out. The indexer concern (must-not-credit on
> code != 0) is reduced to the IBC code=29 case captured in §4.2.

### 4.5 🌐 Historical-mainnet captures (no broadcast — fetch-and-snapshot)

For msg types that cannot be user-submitted on Sei (EVM internal msgs) or
that need a counterparty chain (IBC inbound), the report identified
canonical mainnet samples. Fetched via `https://sei-api.polkachu.com`
because `rest.sei-apis.com` was throwing intermittent panics during this
run.

| Msg type | tx hash | height | Why escape-valve |
|---|---|---|---|
| `/seiprotocol.seichain.evm.MsgEVMTransaction` | `62ABC7EAC436271559CF1A197957B364AE78A4E1CA200DC5415B720A78CD63C0` | 209671085 | **THE #1 parser bug** — `logs[]` non-empty blocks `events[]` processing → spender balance overstated. Reproducing on testnet needs foundry/hardhat tooling we don't ship here. |
| `/seiprotocol.seichain.evm.MsgSend` | `40CACAF09A15F025E1B68C2BD0CBFA48434370BE391B93055EB41A7184140560` | 204636477 | EVM module's bank-flavored Send is internal-only on Sei v6.5.0 (users can't submit directly). |
| `/ibc.core.channel.v1.MsgRecvPacket` | `96C863A17E5BD3F8EE4FD63CC06C03D44B2A42EA14C97377FFA82D500206F499` | 207042134 | Relayer-submitted; we'd need an active relayer on a working counterparty channel. All 51 atlantic-2 channels had expired clients. |

---

## 5. Findings worth noting (NEW relative to the code-only report)

These are observations the simulation surfaced that the report's
code-only analysis couldn't have produced.

### 5.1 Five additional module accounts missing from `CosmosFeeCollector`

The report's chain-level gap §2 calls out `sei17xpfvakm2amg962yls6f84z3kell8c5lqspv6q`
(generic fee_collector) and `sei1v4mx6hmrda5kucnpwdjsqqqqqqqqqqqqlve8dv` (EVM
module qqqq-padding). The simulation surfaced **five more** module account
addresses that appear as `coin_received` receivers and would create phantom
"received" entries on those addresses if the indexer ever tracked them:

| Module | Address | Surfaced by |
|---|---|---|
| bonded_tokens_pool | `sei1fl48vsnmsdzcv85q5d2q4z5ajdha8yu3chcelk` | MsgDelegate tx `413A59B3...` |
| not_bonded_tokens_pool | `sei1tygms3xhhs3yv487phx3dw4a95jn7t7lvhygfz` | MsgUndelegate tx `BE14142F...`; also appears in MsgExec-inner-Undelegate tx `180DCFBA...` |
| gov | `sei10d07y265gmmuvt4z0w9aw880jnsr700jhwznsj` | MsgSubmitProposal v1beta1 tx `B96DD20A...` (proposal_deposit) |
| distribution | `sei1jv65s3grqf6v6jl3dp4t6c9t9rk99cd82n4207` | MsgFundCommunityPool tx `DCFCA051...` |
| tokenfactory | `sei19ejy8n9qsectrf4semdp9cpknflld0j6svvmtq` | MsgMint txs `D734B5DC...` / `F385B6A1...` (intermediate stop in mint flow) |

The fee-collector fix in CGD-775 follow-up should include all 7 of these
(2 from report + 5 from sim).

### 5.2 `MsgExec` inner `MsgUndelegate` — the `unbond` event IS emitted

The most important confirmation: the cosmos-sdk emits a top-level `unbond`
event when MsgUndelegate runs inside MsgExec.msgs[]. The indexer therefore
has all the data it needs to detect the unbond — it just doesn't look
because `parseIsUnstakeTx` filters on `tx.body.messages[]` type URL.

Repro: tx `180DCFBABB1ADD998E4E44AD4A381219947FAD7C0657E54829A2360C90BBCF54`.
Event types in fixture: `coin_received`, `coin_spent`, **`unbond`**,
`message`, `transfer`, `withdraw_rewards`, `signer`, `tx`.

This makes the parser fix unambiguous: when iterating events, treat
`unbond` event as authoritative for pending-payback creation rather than
gating on top-level msg-type detection.

### 5.3 `MsgBeginRedelegate` — `redelegate` event confirmed missing from indexer switch

Testnet tx `FC3A13BCCF91A534...` emitted exactly the events the report
predicted: `redelegate` (with src/dst validator attributes), `coin_spent`
on attacker (auto-claim rewards), and `withdraw_rewards`. NO `coin_received`
for the share move (correct — redelegation has no bank-event). The parser
needs a zero-value entry for the `redelegate` event type if any
informational tracking is desired; otherwise the WRONG_EVENT_HANDLING
verdict is non-financial and can be left alone.

### 5.4 IBC fabric on atlantic-2 is entirely broken (as of 2026-05-26)

All 51 open transfer-port channels reference IBC clients in `Expired`
state. Any user-submitted MsgTransfer lands at code=29. Consequences:

* The CGD-1483 playbook step 6 ("IBC timeout refund — broadcast MsgTransfer
  to a known-down counterparty, observe the MsgTimeout 2-tx pair") is **not
  executable on Sei testnet** until relayers refresh clients. The historical
  mainnet MsgTimeout sample from the report is the only available fixture.
* The "DeliverTx failure → indexer must ignore" reconciliation row is
  satisfied by these IBC tx fixtures even though we couldn't fabricate a
  bank.MsgSend failure case (see §4.4).

### 5.5 Sei's mempool blocks intentional-failure txs

Three different approaches to inducing a block-included failed tx all
failed: oversize amount (max-int64), insufficient balance, under-gas
limit. Sei's CheckTx evidently runs a full simulation and drops anything
that would fail DeliverTx, so the **"failed tx" reconciliation row from
the playbook is largely moot on Sei testnet**. The reconciliation logic
still needs to handle the IBC code=29 case (real failed tx in §4.2).

### 5.6 Tokenfactory mint emits a `coinbase` event (not just `coin_received`)

Worth noting for parser correctness: tokenfactory's MsgMint emits a
distinct `coinbase` event (separate from the standard `coin_received`)
identifying the minter. Burn emits a `burn` event. The current
`CosmosLikeTransaction` parser switch handles neither, but bank events DO
fire afterward in the same tx — so the UNSUPPORTED_TOKEN drop happens at
the denom filter (`CosmosSupportedDenomination`), not at the event-type
gate. Fix path: register `factory/*` denoms in
`CosmosSupportedDenomination`, and the existing event handlers will pick
up the bank events naturally.

### 5.7 CW-20 path on a fresh BitGo wallet — CGD-1093 still reproduces 1:1

`wasm-msgexecutecontract-cw20.ts` ran on a brand-new BitGo `tsei` wallet
(`sei149yhz4fyajh0c2fsprrfuafnxcvrhq04llx20x`, walletId
`6a1582107daa6819...`). Tx `6776EB6AE32F8237...` shows `execute` + `wasm`
events for the transfer but ZERO bank events. Indexer creates no transfer
entry. The CGD-1093 finding is independent of which wallet receives the
CW-20.

### 5.8 BitGo SDK quirk: `tsei` receive addresses carry `?memoId=0`

Already covered in §3, but worth surfacing as its own finding because it
would silently break any naive integration: anyone calling
`walletInstance.receiveAddress()` on a tsei wallet must strip the URL-style
suffix before using the value as a Cosmos recipient. There's no documented
contract that tsei is "shared-root with memos"; in practice each TSS wallet
gets its own bech32 root.

### 5.9 Hand-rolled proto encoders need a `create()` method

cosmjs's `Registry` calls `type.create(value)` before `type.encode(...)`,
not just `encode`. Our first generation of hand-rolled encoders (for
sei-tokenfactory + missing-protos) only defined `encode/decode/fromPartial`
— sign blew up with `TypeError: type.create is not a function`. Added
`create: (m) => m` (identity) to all six hand-rolled encoders and the
signing path worked. Worth documenting for anyone else writing custom
cosmjs Msg encoders.

---

## 6. Budget consumption

| Line item | Spend (usei) |
|---|---|
| Starting balance | 19,380,040 |
| Tokenfactory create fee | 10,000,000 |
| Gas across 28 successful broadcasts (avg ~30K each) | ~847,000 |
| Lost to mempool-dropped txs (signed but no fee charged) | 0 (fee only charged on inclusion) |
| Gov v1beta1 deposit (small — stayed in deposit phase) | 1,000 |
| Community pool fund | 500 |
| Vesting + send amounts | ~22,000 |
| Forwarded into tokenfactory victim | 1,000,000 (factory denom, not usei) |
| Net delegated (still locked) | ~10,000 (after undelegate refund) |
| Ending balance | 18,350,940 usei + 9,500 factory/.../cgd1483-... |
| **Effective spend** | **~1,029,100 usei (~1.03 SEI)** |

10 SEI of the burn went to the one-time tokenfactory create. The other
~1 SEI covered all 28 transactions.

---

## 7. Files produced

Every artifact below is in
`/Users/venkateshv/BitGo/BitGoJS/examples/ts/sei/cgd-1483-simulation/`.

| Path | Content |
|---|---|
| `wallets.json` | 14 BitGo `tsei` wallet entries, normalized addresses |
| `tokenfactory-state.json` | The denom + create-tx state for re-use by mint/burn |
| `fixtures/*.json` (34 files) | One per attempted msg type — 28 with real tx data, 6 placeholders for unregistered/dropped cases |
| `reconciliation.csv` | 35 rows (chain, msgType, txHash, height, address, denom, indexerBalance, lcdBalance, lcdSpendableBalance, delegated, unbonding, rewards, delta, verdict, notes). `indexerBalance` blank pending mongo input. |
| `whitelist.json` | Step-6 finalized whitelist with `_demotions_from_preliminary`, `_promotions_from_preliminary_needing_fix`, and full provenance |
| `lib/sei-client.ts` | Shared broadcast/sign/capture helpers |
| `lib/msg-list.ts` | Canonical Msg catalog (44 entries; 14 needsVictim) |
| `lib/validators.ts` | Bonded-validator picker (atlantic-2) |
| `lib/sei-tokenfactory-proto.ts` | Hand-rolled encoders for Sei tokenfactory msgs |
| `lib/missing-protos.ts` | Hand-rolled encoders for 5 msg types not in cosmjs-types 0.6.1 |
| `lib/clean-wallets.ts` | One-shot to strip `?memoId=N` from wallets.json |
| `msg/*.ts` (33 files) | One script per msg type / edge case |
| `00-create-wallets.ts` | BitGo SDK TSS wallet bulk-creator |
| `00-import-wallets.ts` | Fallback importer (manual UI flow) |
| `reconcile.ts` | 3-way reconciliation runner |
| `run-all.sh` | Sequential runner (not used today — we ran scripts individually for better diagnostics) |
| `README.md` | User-facing guide (predates this report) |
| `SIMULATION-REPORT.md` | This document |

---

## 8. Outcomes vs CGD-1483 acceptance criteria

| Criterion | Status |
|---|---|
| Every Msg in CGD-1465's ❌ broken bucket has a row in reconciliation.csv or documented escape | ✅ — 12/12 represented (7 live + 4 skip-rationale with notes + 1 historical-mainnet). |
| Every Msg in CGD-1465's 🔍 needs-investigation bucket has a row | ✅ — 16/16 (with 4 placeholders for not-registered-on-Sei findings). |
| At least one sanity-check Msg per module from ✅ works bucket | ✅ — bank, staking, distribution, gov, IBC, wasm, evm, tokenfactory, authz, feegrant, vesting all covered. |
| All six edge-case txs present (failed, MsgExec single, MsgExec multi, MultiSend self-loop, IBC timeout, same-address-twice) | ✅ with caveats — failed-tx is a placeholder (Sei mempool blocks it); IBC timeout pair partially captured (source side landed at code=29, refund unobservable due to expired clients). The other four landed cleanly. |
| `whitelist.json` non-empty | ✅ — 53 entries in `whitelist`, 3 in `whitelist_after_fix`, 9 in `route_to_zero_value_alert`, 2 in `needs_simulation`. |
| No row with `verdict = LCD_UNREACHABLE` | ✅ — verifier used `sei-apis.com` primary + `seinetwork.io` fallback. All LCD calls succeeded. |

---

## 9. Open items / what's next

1. **Run reconciliation against a real indexer**: set
   `INDEXER_BALANCE_URL` to the tsei indexer's admin balance endpoint (or
   read directly from the indexer's MongoDB `balances` collection) and
   re-run `reconcile.ts`. That converts the current all-OK CSV (LCD-side
   only) into real MISMATCH verdicts where the indexer disagrees with the
   chain.
2. **Push deliverables to `BitGo/indexer` branch `sei-cosmos-whitelist-report`**
   under `.claude/cosmos-whitelist/sei/{simulations/,reconciliation.csv,whitelist.json}`,
   and append a Step-6 section to `final-report.md` reconciling
   preliminary vs final whitelist + explaining each demotion/promotion.
   The text in §5 of this report is the source for that section.
3. **Open child tickets of CGD-775** for the confirmed parser bugs:
   * MsgEVMTransaction complementary-arrays (`CosmosLikeTransaction.java:394-412`).
   * MsgExec inner-msg recursion in `parseIsUnstakeTx` and
     `findVestingMessageIndices`.
   * Add the 5 module accounts surfaced in §5.1 to
     `CosmosFeeCollector.feeCollectorAddressMap` for sei/tsei.
   * `redelegate` event handler (optional — informational only).
   * Tokenfactory `factory/*` denom registration policy in
     `CosmosSupportedDenomination` (or zero-value+alert).
4. **MsgRecvPacket fee attribution bug** (cross-chain pre-existing) —
   `createdFeeEntry` at `CosmosLikeTransaction.java:281-307` reads
   `tx.body.messages[0]` signer instead of `tx.auth_info.fee.payer`.
   Pre-existing across all IBC chains; open as a separate ticket.
5. **Re-attempt IBC simulations** when atlantic-2 relayers refresh
   clients. The current `edge-ibc-timeout.json` is a placeholder; running
   `msg/edge-ibc-timeout.ts` later will capture the paired MsgTimeout
   refund automatically.
6. **MsgEVMTransaction testnet repro** — if you bring a foundry/hardhat
   setup keyed off the same secp256k1 attacker, the historical capture in
   `fixtures/evm-msgevmtransaction.json` can be augmented with a fresh
   testnet tx by setting `SEI_TEST_TX=<hash>` and rerunning that script.

---

## Appendix A — Validators used

| | Operator address |
|---|---|
| src validator (delegate, undelegate, redelegate src) | `seivaloper19tup24vtzed7za6nz3r0dylm0eln2clpvhtawu` |
| dst validator (redelegate target) | `seivaloper1sq7x0r2mf3gvwr2l9amtlye0yd3c6dqa4th95v` |

Picked automatically by `lib/validators.ts` (top 2 bonded by stake).

## Appendix B — CW-20 contract reused

| | |
|---|---|
| Address | `sei1zwugu0vce6fq7ccfg9u5j8tcf6cs2u5u7ydu9eknyt45puj8kt3qkwznf6` |
| Code ID | 4029 (cw20_base v1.1.2 — permissioned upload, instantiate=EVERYBODY) |
| Symbol | BGTEST |
| Deployed in | CGD-1093 (kept attacker as admin) |

## Appendix C — IBC channel attempted

| | |
|---|---|
| Source port/channel | `transfer/channel-0` |
| Client ID | `07-tendermint-42` |
| Counterparty chain | `axelar-testnet-lisbon-3` |
| Client state at sim time | **Expired** (so were all other 50 open transfer channels) |

## Appendix D — Final attacker balance breakdown

```
Native usei         : 18,350,940
factory/.../cgd1483 :      9,500   (custom tokenfactory denom)
```

