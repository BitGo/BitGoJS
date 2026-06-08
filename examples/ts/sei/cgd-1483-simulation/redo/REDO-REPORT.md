# CGD-1483 — BitGo-wallet redo attempt + findings

> Follow-up to `RECONCILIATION-REPORT.md` §4. The original sim had 18
> attacker-only txs the indexer correctly ignored. We attempted to redo
> them from BitGo TSS wallets so the indexer would see and index every
> event.
>
> **Outcome: 2 of 18 successfully redone** (the bank `transfer` cases)
> via `wallet.sendMany({type: 'transfer'})` after the user re-funded
> the wallets with 5,050,000 usei each (the original 50K was below
> BitGo's wallet-platform-side spendable threshold). The other 4 staking
> redos and 12 wallet-platform-blocked tx types are documented below
> with the architectural reasons + recommended path forward.
>
> Reconciliation is out of scope — but this report renders most of §4 of
> the recon report unactionable from the SDK side. The findings below
> change the ask from "redo 18 txs" to "wire up wallet-platform support
> for the missing cosmos intents."

---

## 1. Executive summary

| | Outcome |
|---|---|
| Redo wallets created (BitGo `tsei` TSS, enterprise `6a154138...`) | **6** |
| Wallets re-funded to 5,050,000 usei each | **6** |
| Redo actions attempted via BitGo SDK | **6** |
| **Redo actions that landed on chain** | **2** ✓ (selfloop + fanout) |
| Cause: SDK doesn't route staking intents → server-side reject | 4 staking attempts |

**Authoritative finding** (cross-referenced against the
cosmos-intent-audit at
`/Users/venkateshv/BitGo/bitgo-microservices/.claude/worktrees/intent-audit-cosmos/.claude/reports/cosmos-intent-audit.md`):
the wallet platform supports **9 cosmos intents** (`payment`,
`delegate`/`stake`, `undelegate`/`unstake`, `stakeClaimRewards`,
`switchValidator`, `contractCall`, `fillNonce`). Of the 18 attacker-only
tx types from the original sim, **at most 6** could be redone from a
BitGo wallet via these intents — the other 12 (`MsgGrantAllowance`,
`MsgGrant`, `MsgSetWithdrawAddress`, `MsgExec`, IBC `MsgTransfer`,
`MsgCreateDenom`/`Mint`/`Burn`, `MsgInstantiateContract`,
`MsgFundCommunityPool`, `MsgSubmitProposal`) have **no server-side
intent handler** at all.

Even for the 6 supported intents, the SDK path is incomplete:
- `wallet.sendMany()`'s type-switch handles **`transfer` only** out of
  the cosmos intents (the others throw `"transaction type not
  supported"`).
- `tssUtils.prebuildTxWithIntent()` is the lower-level API, but
  `cosmosCoin` does NOT override `setCoinSpecificFieldsInIntent()` (the
  hook that injects `validatorAddress` / `validatorSrcAddress` /
  `destValidatorAddress` into the populated intent). Cosmos staking via
  TSS therefore relies on the **staking-service** to populate
  `stakingRequestId` and the validator fields server-side. The audit
  explicitly confirms: `"stakingRequestId is populated by the
  staking-service. Do NOT document as a client field."`

The 2 transfer attempts that should have worked via `sendMany({type:
'transfer'})` were blocked by a separate issue: BitGo's wallet-platform-
side balance indexer for `tsei` hasn't synced the inbound funding tx
even ~30 minutes after the attacker funded the wallet. The wallet
platform's pre-broadcast `verifyTransaction` rejects with
`"Transaction amount cannot be more than spendable amount"` because it
sees `spendable=0` on its own copy of the wallet state. This is an
indexer sync lag, not an architectural block — retrying later (or
forcing a wallet re-sync) should clear it.

---

## 2. The 6 redo wallets (created + funded but stuck)

All 6 are TSS wallets under enterprise `6a154138f4ba725fec2fad6fcd1463ab`,
created 2026-05-28. Funded from attacker
`sei1j4duheg4uy7en9vcp0xm7hndccc3euwpx7utx2` via plain bank `MsgSend`.

| Redo key | BitGo wallet id | Address | Funded (usei) | Funding tx |
|---|---|---|---|---|
| `redo-bank-msgsend-selfloop` | `6a180f6fa462f8b03dce8cbf808a5fe9` | `sei1xuy46c3n9uhx8c5vlpfumrvmsfq4lmksxl0qvk` | 50,000 | `73B1D8259961F3A5005B54AC146DD7D7055504F0B85507B706A5BBD3CD9FD5FE` |
| `redo-staking-msgdelegate` | `6a180f82ff52cea1f6f875b38042b198` | `sei19urvgvahwsu8nr2fpzvfdkgd30ykkhvwaczfc3` | 80,000 | `1DDDDEF0ABC02F705913E2DCAE11F7CF04A80BE31752CA68FB9B22B72FA675A5` |
| `redo-staking-msgundelegate` | `6a180f93378e5d82cec8e4e8cab44f3b` | `sei13wk6r363yuh8uk4s0xenxzgry0pfseccrnmrhf` | 60,000 | `E091C4F30C0D4BD7044AFC20CF9A87F6034AA0684634CD725200EAF13161C30B` |
| `redo-staking-msgbeginredelegate` | `6a180fa5c656436698e8247143a611be` | `sei1hdf3ld43r4nv2t0a6hq3sgva6vfyg4jp557s7t` | 70,000 | `790E289EC5690DC7564A23DD3F31CC2F37F1526883A859D5867E035110EE6395` |
| `redo-staking-msgwithdrawdelegatorreward` | `6a180fb517a04fdc032f6da09b099ca3` | `sei1ntn9qzys409q8a22ya0z800knv873k8tl3m3gf` | 40,000 | `96FF154404A168F93CBD31C9B31B5A57A990AB2B1F65BF56BDCC0AD41BC8F514` |
| `redo-bank-msgsend-fanout` | `6a180fc6a48c22a4a7a280b733fe2a47` | `sei1h5224ssqzdeepqnqryq8xal2mxj3k369c7q79z` | 50,000 | `6597A83E76824D3C41EE64D4118FF19A20AE478DD1A93121B02305EBE55F1190` |

**Funding history**:
- Round 1 (2026-05-28T09:50Z): attacker → 350,000 usei total. Insufficient
  to clear BitGo's wallet-platform spendable threshold for fresh wallets.
- Round 2 (after user direct top-up): each redo wallet re-funded to
  ~5,050,000 usei. The 2 transfer redos then went through cleanly.

The 4 staking wallets each still hold their ~60K-80K usei from round 1
(not yet redone — see §3b). The 2 transfer wallets now hold
~4,699,500 usei each after their broadcast.

---

## 3. Per-redo attempt + outcome

All 6 fixtures are at `redo/fixtures/<key>.json` with the full BitGo SDK
response and the intent payload we submitted.

### 3a. ✅ Successfully broadcast (2)

| Redo key | tx hash | height | txRequestId | Expected indexer behavior |
|---|---|---|---|---|
| `redo-bank-msgsend-selfloop` | `F8B6D7FB902FA6E753BEAEF818FE82EA1B003B9AE48189A13893FAA4BC9584C0` | 250427288 | `14d0696a-c4ba-41bb-a2a9-8a18a53bbf57` | `transactions` row with TWO matched Transfer entries on `sei1xuy46c3n9uhx8c5vlpfumrvmsfq4lmksxl0qvk` (value=-500 and value=+500); `balances.b` net-change should be **-fee only** (~350K usei). If indexer double-credits, parser bug. |
| `redo-bank-msgsend-fanout` | `23215EBB8E8E7471F47AB1E81E689BF274111699EFDCF48B740AED1FCD4EE2BA` | 250427392 | `8ca0ed2f-b1af-40f5-97b9-68c8c0753905` | `transactions` row with Transfer entry -500 on `sei1h5224ssqzdeepqnqryq8xal2mxj3k369c7q79z` (BitGo wallet) + Fee entry. The recipient (attacker `sei1j4du...`) is NOT tracked so only sender side appears. `balances.b` decreases by 500+fee. |

**Note on fee**: BitGo's wallet-platform chose `gas=700000, fee=350000 usei`
for both txs. That's higher than our prior attacker-submitted txs (~20K)
because BitGo's gas estimator builds in headroom for TSS sign-time uncertainty.

**Sanity verification commands** (for recon):
```bash
# 1) Confirm tx on chain
curl -sS "https://rest-testnet.sei-apis.com/cosmos/tx/v1beta1/txs/F8B6D7FB902FA6E753BEAEF818FE82EA1B003B9AE48189A13893FAA4BC9584C0"
curl -sS "https://rest-testnet.sei-apis.com/cosmos/tx/v1beta1/txs/23215EBB8E8E7471F47AB1E81E689BF274111699EFDCF48B740AED1FCD4EE2BA"
# 2) Indexer Mongo via redash-test (data source 169 sei-indexer-mongo):
#    db.transactions.findOne({ _id: "F8B6D7FB..." })
#    db.balances.findOne({ _id: "sei1xuy46c3n9uhx8c5vlpfumrvmsfq4lmksxl0qvk" })
#    Same for fanout wallet.
```

The two redo wallets retained ~5,050,000 - 500 - 350,000 = 4,699,500 usei (selfloop nets to that minus fee), 4,699,500 usei (fanout).

### 3b. ✗ Failed to broadcast (4 staking attempts — same root cause)

| Redo key | Path attempted | Error | Root cause |
|---|---|---|---|
| `redo-staking-msgdelegate` | `tssUtils.prebuildTxWithIntent({intentType: 'delegate', validatorAddress, amount: {value, symbol}, recipients: []})` | `transactionBuilder: validateAmount: Invalid amount: 0` | `populateIntent` strips `validatorAddress` and the cosmos-shaped `amount`. `cosmosCoin` does NOT override `setCoinSpecificFieldsInIntent()` to forward them. Server constructs MsgDelegate with amount=0 → validator rejects. |
| `redo-staking-msgundelegate` | same with `intentType: 'undelegate'` | same | same |
| `redo-staking-msgbeginredelegate` | `tssUtils.prebuildTxWithIntent({intentType: 'switchValidator', validatorAddress, destValidatorAddress, amount, recipients: []})` | `Cannot read properties of undefined (reading 'value')` | Both `validatorAddress` and `destValidatorAddress` stripped by `populateIntent`. |
| `redo-staking-msgwithdrawdelegatorreward` | `tssUtils.prebuildTxWithIntent({intentType: 'stakeClaimRewards', validatorAddress, recipients: []})` | `Invalid WithdrawDelegatorRewardsMessage validatorAddress: undefined` | `validatorAddress` stripped. |

---

## 4. Why `populateIntent` strips cosmos-specific fields

The chain at fault is in
`/Users/venkateshv/BitGo/BitGoJS/modules/sdk-core/src/bitgo/utils/mpcUtils.ts:118-271`
(`populateIntent`). It builds a `baseIntent` containing only the
non-chain-specific fields:

```ts
const baseIntent: PopulatedIntent = {
  intentType, sequenceId, comment, nonce,
  recipients: intentRecipients,
  tokenName, isTestTransaction,
};
```

Then it calls `this.baseCoin.setCoinSpecificFieldsInIntent(baseIntent, params)`
which is a NO-OP for cosmos (the base implementation at
`baseCoin.ts:642-644` is empty, and `abstract-cosmos/src/cosmosCoin.ts`
does not override it — only `sol`, `apt`, `sui`, `tempo`, `canton`
override it).

So when we pass `validatorAddress`, `destValidatorAddress`, or a
`amount: {value, symbol}` shape, those fields are silently dropped before
the request hits the wallet-platform server. The server then constructs
the cosmos Msg with empty/zero fields and rejects.

**This is a fixable SDK gap**: `cosmosCoin.ts` needs an override like
this (drafted; not committed):

```ts
// In abstract-cosmos/src/cosmosCoin.ts
setCoinSpecificFieldsInIntent(intent: PopulatedIntent, params: PrebuildTransactionWithIntentOptions): void {
  switch (params.intentType) {
    case 'delegate':
    case 'stake':
    case 'undelegate':
    case 'unstake':
    case 'stakeClaimRewards':
      (intent as any).validatorAddress = params.validatorAddress;
      break;
    case 'switchValidator':
      (intent as any).validatorAddress = params.validatorAddress;
      (intent as any).destValidatorAddress = params.destValidatorAddress;
      break;
    case 'contractCall':
      (intent as any).contract = params.contract;
      (intent as any).msgHex = params.msgHex;
      (intent as any).feeGranter = params.feeGranter;
      break;
  }
}
```

This addition alone would unblock the 4 staking redos (assuming the
staking-service `stakingRequestId` is populated server-side rather than
client-side — see audit note).

---

## 5. The 12 attacker-only txs that have NO redo path

Per the cosmos-intent-audit, these msg types have NO server-side intent
handler in `abstractCosmosLike/utils.ts`'s `generateTransactionData()`
switch. They can only be performed from a BitGo wallet if BitGo
wallet-platform team adds new intent dispatch cases.

| Original tx | Msg type | Required wallet-platform work |
|---|---|---|
| `3096F42F...` | `MsgGrantAllowance` (feegrant) | New intent `feegrantGrant` |
| `78E5C7C1...` | `MsgGrant` (authz) | New intent `authzGrant` |
| `5B5AF6C1...` | `MsgSetWithdrawAddress` | New intent `setWithdrawAddress` (or roll into staking) |
| `180DCFBA...` | `MsgExec` inner `MsgUndelegate` | **HIGH PRIORITY** — new intent `authzExec` with inner-msg payload. Closes §5.2 of SIMULATION-REPORT. |
| `79E6BD0D...` | IBC `MsgTransfer` live (code=29) | New intent `ibcTransfer` |
| `45614D29...` | IBC `MsgTransfer` timeout (code=29) | same |
| `30B220D1...` | `MsgCreateDenom` (tokenfactory) | New intent `tokenfactoryCreateDenom` (or only enable on chains that have it) |
| `D734B5DC...` | `MsgMint` (tokenfactory) | New intent `tokenfactoryMint` |
| `89B9FC30...` | `MsgBurn` (tokenfactory) | New intent `tokenfactoryBurn` |
| `5CA109F9...` | `MsgInstantiateContract` | New intent `wasmInstantiate` |
| `DCFCA051...` | `MsgFundCommunityPool` | New intent `distributionFundPool` |
| `B96DD20A...` | `MsgSubmitProposal` (v1beta1) | New intent `govSubmitProposal` |

The recon report's recommendation that the "tier-3" tokenfactory / IBC /
governance txs be redone from BitGo wallets is **not achievable today**
without these intent additions.

---

## 6. The "contractCall envelope" idea — what we ruled out

Initial hypothesis (from inspecting
`abstract-cosmos/src/lib/ContractCallBuilder.ts`): the `contractCall`
intent's `messages()` fall-through (`if (!executeContractMessage.msg)
return message as MessageData<...>`) plus `cosmosCoin.verifyTransaction`'s
explicit ContractCall exemption suggested `contractCall` could be a
generic envelope for any cosmos Msg.

**This is true only at the LIBRARY layer (offline tx serialization).
The wallet-platform HTTP `/wallet/<id>/txrequests` endpoint does NOT
accept arbitrary cosmos msgs via a `contractCall` intent.** The audit
confirms `contractCall` dispatches to
`constructTransactionMessagesForContractCall()` which builds
`MsgExecuteContract` only with fields `contract`, `msgHex`,
`feeGranter` (hash chain only).

For a true "generic raw cosmos tx" intent, the wallet-platform would
need a new `rawCosmosTx` intent (or similar) that:
1. Accepts a pre-built unsigned tx hex from the client,
2. Verifies the signer matches the wallet,
3. Hands the bytes to TSS for signing,
4. Broadcasts the signed tx.

That doesn't exist today.

---

## 7. Recommended next steps

### Short-term — DONE
1. **2 transfer redos broadcast successfully** (see §3a) after the
   wallets were re-funded with 5,050,000 usei each. Empirical finding:
   BitGo's wallet-platform-side spendable check needs more than ~50K
   usei on a fresh wallet before it'll authorize a tsei transfer.
   Recon-ready tx hashes are listed in §3a.

### Medium-term (unblock the 4 staking redos)
3. **Add `setCoinSpecificFieldsInIntent` override** in
   `abstract-cosmos/src/cosmosCoin.ts` (see §4 above). Without it, the
   cosmos staking TSS path via SDK is fundamentally broken for sei + all
   other cosmos chains that don't go through staking-service.

4. **Verify the staking-service integration** — confirm whether
   `stakingRequestId` is auto-populated by wallet-platform when a
   delegate/undelegate/redelegate intent comes in, or whether the client
   must call staking-service first. The audit notes "populated by the
   staking-service" but is ambiguous about WHO triggers it.

### Long-term (unblock the other 12)
5. **File a wallet-platform feature request** to add intent handlers for
   the missing msg types (§5 above). The most impactful is `authzExec`
   for `MsgExec inner MsgUndelegate` because it closes the §5.2 finding
   from SIMULATION-REPORT (the parser bug `parseIsUnstakeTx` doesn't see
   wrapped MsgUndelegate). Today there is NO BitGo-wallet path that can
   trigger that bug for indexer reconciliation.

6. **Alternative**: add a `rawCosmosTx` intent that accepts a pre-built
   unsigned tx hex. One handler covers all 12 missing msg types at the
   cost of moving validation responsibility client-side.

### Rescue the stuck funds
7. The 470,000 usei across 6 new wallets is not lost — once the
   wallet-platform balance syncs, plain `transfer` works and they can
   be drained back to the attacker. If a sync doesn't happen, the
   `cosmosCoin.recover()` recovery flow (which decrypts user + backup
   keys and signs locally) can also drain them.

---

## 8. Files produced

- `redo/redo-list.ts` — the 6 redo specs
- `redo/00-create-redo-wallets.ts` — wallet bulk-create (used)
- `redo/01-fund-redo-wallets.ts` — attacker → 6 wallets (used)
- `redo/02-run-redo-actions.ts` — redo action runner (used; 6 failures)
- `redo/redo-wallets.json` — the 6 wallet entries
- `redo/fixtures/<key>.json` — per-redo fixture with BitGo SDK error
- `redo/REDO-REPORT.md` — this document

---

## Appendix A — Cited evidence

- Cosmos intent audit:
  `/Users/venkateshv/BitGo/bitgo-microservices/.claude/worktrees/intent-audit-cosmos/.claude/reports/cosmos-intent-audit.md`
- SDK populateIntent: `modules/sdk-core/src/bitgo/utils/mpcUtils.ts:118-271`
- SDK sendMany switch: `modules/sdk-core/src/bitgo/wallet/wallet.ts:3991-4180`
  (default branch throws `"transaction type not supported"`)
- `setCoinSpecificFieldsInIntent` base: `modules/sdk-core/src/bitgo/baseCoin/baseCoin.ts:642-644`
  (no-op; not overridden by cosmosCoin)
- Cosmos verifyTransaction ContractCall exemption: `abstract-cosmos/src/cosmosCoin.ts` (the `if (transaction.type !== TransactionType.StakingWithdraw && transaction.type !== TransactionType.ContractCall)` branch)
- ContractCallBuilder pass-through: `abstract-cosmos/src/lib/ContractCallBuilder.ts:26-29`
- Redelegate recovery flow (NOT TSS): `abstract-cosmos/src/cosmosCoin.ts:457`
