# @realfi-co/realfi-partner-sdk

## 2.14.0

### Minor Changes

- Support SundaeSwap V4 swaps on equal-weight constant-sum pools.

  `quoteSwap` now accepts those V4 pools alongside V3 and Stableswaps, so callers
  no longer branch on `pool.version` to quote. A constant-sum pool holds its price
  whatever the order size, so the quote is exact and `priceImpact` is `0`. Other
  V4 curves are not priced — see below.

  The V4 quote cannot go through `SundaeUtils.getSwapOutput`, which dispatches on
  `pool.curve` — a field the Sundae API never populates, so it falls through to
  `Unsupported v4 pool curve: undefined`. Instead we run `ConstantSumPool`'s
  arithmetic from `@sundaeswap/math` directly, carrying the pool's shared price
  weight through the fee and the quotient rather than dividing it out (the two
  roundings only collapse at a weight of `1`). Two settlements captured live from
  `api.preview.sundae.fi` pin it to what Sundae's engine actually produces.

  A V4 pool's swap math follows its invariant module, not its contract version, so
  "V4" does not by itself mean constant-sum. The quote refuses any pool it cannot
  confirm is constant-sum with equal price weights — including one whose `curve`
  or `prices` are simply absent, since absent means unasked rather than 1:1. The
  error names pool discovery, which supplies both.

  `slippage` is validated and then ignored on the V4 path. A linear pool has no
  price movement to buffer, and the surplus above a V4 order's `min_received` is
  unbound on chain: the scooper keeps whatever the fill clears the floor by. Slack
  in the floor is therefore not a safety margin, it is skimmable, so
  `minReceived` sits exactly at `estimatedReceived`. For the same reason the quote
  does not cap its output at the quoted pool's reserve, though `ConstantSumPool`
  does — a V4 order is bound to no pool, so capping would silently lower the
  owner's only guarantee.

  New `quoteSwapInput` is the inverse of `quoteSwap`: it returns the smallest
  supply that still yields a wanted output. A swap form needs this direction when
  the user edits the receive field rather than the pay field, and
  `SundaeUtils.getSwapInput` fails on a V4 pool for the same missing-`curve`
  reason as `getSwapOutput`. Like the forward direction it is version-aware, so
  callers use one function for all supported pools.

  New `buildSwapIntentTx` places a V4 swap. It takes no pool, because a V4 order
  names none: it is an offer and a floor, and the scooper decides how to fill it.
  It routes through `swapIntent` rather than `swap`, since `TxBuilderV4.swap`
  throws by design — a swap order carries the route constraint, which is outside
  the audited launch surface. `buildSwapOrderTx` now rejects V4 with a pointer to
  it rather than the misleading "unsupported version".

  Version support becomes a table keyed by every Sundae contract version, with a
  column per question: `swap` (can we quote it and place an order) and
  `buildAgainstPool` (does the order name the pool). A new Sundae version now
  fails to compile until both are answered, rather than defaulting to unsupported
  because nobody remembered a second list. `isSupportedSundaeSwapVersion` reads
  the second column and still excludes V4; the new
  `isSwappableSundaeSwapVersion` reads the first and includes it.

  Pool discovery's `buildable` scope now uses the first column, so a V4 pool is
  discoverable through `buildable` and `curated` rather than only through `all`.
  `buildable` means "the SDK can build an order for this pool", and for V4 that
  order is a pool-less intent. The operational pool-selection scripts are
  unaffected: they re-check `isSupportedSundaeSwapVersion` themselves, so they
  still resolve exactly one pool per pair.

  Pool discovery now fills in `curve` and `prices` itself. Sundae's own pool
  query selects neither, so every v4 pool arrived with both undefined and anything
  downstream had to assume the curve rather than check it. A small second request
  supplies them, and it only runs for pools that are missing the fields — so the
  day Sundae selects them upstream the request stops firing on its own and the
  module is pure cleanup to delete.

  Weights are only mapped when they can be mapped safely: a v4 pool may hold up to
  16 assets while `IPoolData.prices` is a two-tuple, so an unequal set that cannot
  be aligned to the pair is left unset rather than guessed at.

  New `selectV4QuotePool` picks which V4 pool's fee should quote a swap. It takes
  a mixed candidate list, ignores every non-V4 pool and every V4 pool the quote
  would refuse, and returns the cheapest of what is left — or undefined, meaning
  the caller should fall back to another version. Cheapest is the safe rule as
  well as the best rate: a pool overstating its fee would lower `min_received`,
  so a hostile pool can only win by genuinely being the cheapest.

  It exists so the eligibility rules have one home. A caller choosing its own V4
  pool has to reproduce all of them — curve, price weights, decimals, fee, usable
  reserves — and gets no error until quoting, by which point it has already
  skipped the working Stableswap pool it could have used instead. Checking only
  the curve is the easy version of that mistake, and it is not enough: discovery
  reads the curve from the invariant module but leaves `prices` unset when the
  weights cannot be aligned to the pair, so a pool can carry a constant-sum curve
  and still be unpriceable. Selection is deliberately a little stricter than the
  quote — it requires both reserves, where a single quote only checks the side it
  pays out, because a swap form trades in both directions against one pool.

  Requires `@sundaeswap/core` 2.13.1, which is where V4 lands.

## 2.13.1

### Patch Changes

- Fix transaction building around timelocks and protocol settings:
  - Resolve the native-script shape from a timelock UTxO's locking address, allowing claims from both retail and treasury/multisig unstake flows.
  - Retry transient not-found responses when reading singleton NFT UTxOs, including the protocol settings proxy, while preserving the provider error if the retry budget is exhausted.
  - Reserve the required minimum ADA before re-locking a V1.1 settings datum, so settings updates remain balanced when the datum grows.

## 2.13.0

### Minor Changes

- Let `protocolValidators` carry more than one generation of a deployment, so a
  consumer can span a script cutover instead of failing closed across it.

  A cutover changes the proxy datum's `logic` hash on chain, and consumers learn
  the new hashes from config, which cannot land in the same instant. With a
  single generation, every consumer is failing closed for the width of a deploy —
  observed as a full transaction outage on preprod.

  Pass an array of blueprint maps and detection selects the generation whose
  protocol orchestrator matches the deployed `logic` hash, applying that
  generation whole. Passing a single map behaves exactly as before, and when no
  generation matches, detection still fails closed rather than guessing.

  Listing both generations in one map cannot work and is unsafe: the override
  reads exact keys, so one generation's hashes would be applied regardless of
  which matched, and the SDK would build against addresses the chain is not
  using. The array is what keeps version and script hashes from different
  generations from ever being mixed.

## 2.12.3

### Patch Changes

- Resolve deployed reference scripts when a provider omits script metadata from address-level UTxO responses. Reference-script lookup failures other than an unused address (rate limits, outages, malformed responses) now surface to the caller instead of being reported as a missing deployment.
- Reattach an NFT singleton's datum inline when a provider reports it as a datum
  hash. A lagging `inline_datum` on the proxy, treasury or staking-vault read
  previously left the UTxO unusable: a vault or treasury read failed batch
  execution with `addInput: When spending datum hash, must provide datum (3rd
arg)`, and a proxy read failed every batch with `No proxy datum found`. Every
  singleton read now goes through one repair, so this covers all versions from
  V0_1 to V1_1_Rc1.

## 2.12.2

### Patch Changes

- Identify a deployment by the validators it runs, not by the artifacts this
  package bundles.

  `detectParams` accepts an optional `protocolValidators` map, keyed as in
  `backend/config/env/<env>.protocol.yaml`. When supplied it decides the protocol
  version and, more importantly, overrides the script hashes and addresses the SDK
  would otherwise derive — including the order address funds are locked at. Every
  identity was previously computed from the bundled Plutus artifacts, which is
  correct only while those bytes match the ones on chain; where they do not, an
  order transaction (metadata plus `lockAssets`, with no on-chain validation)
  would build, sign and submit into an address nothing watches.

  Omitted, behaviour is unchanged.

- Allow current V1 SDK instances to recover signature-owned orders from a
  superseded same-schema order validator by resolving the reference scripts from
  the supplied order UTxOs.

## 2.12.1

### Patch Changes

- Require Sundae Core 2.13.1 or newer so clean SDK installations avoid the
  incompatible Core 2.13.0 and Sundae Math 0.2.2 pairing.

## 2.12.0

### Minor Changes

- Add a version-neutral Sundae swap-to-stake composer that selects V3 or
  Stableswaps from the supplied pool, uses Sundae's guaranteed USDr output for
  the RealFi stake continuation, and preserves cancellation and excess-output
  destinations. Deprecate the lower-level, V3-only
  `createTxFlowBuilder().sundaeV3SwapToStake` helper in favor of the new composer.
- Expose the decimal price impact on Sundae swap quotes.
- Add network-scoped Sundae pool discovery with a runtime-configured curated
  default, every pool supported by the installed builders, and the complete raw
  discovery set.
- Expose diffusion-aware sUSDr exchange-rate inputs, unstake claim transaction hashes, and `InvalidMinReceived` orders through the partner API.
- Add `RealfiSDK.api.getPartnerConfig()` for the authoritative USDr asset ID,
  validated runtime swap asset lists, and non-negative integer mint/redeem UX
  limits shared with each deployed RealFi environment. Asset IDs use Sundae's
  dotted `policyId.assetName` representation so they can be passed directly to
  the SDK's Sundae discovery and builder APIs.
- Add a version-neutral partner API for quoting and building standalone Sundae V3 and Stableswaps orders. Large swap minimums retain bigint precision, and the public `SundaeSwap` namespace exports the construction values and types partners need.

### Patch Changes

- Ship the patched V1.0 validators that reject unsigned treasury reserve outflows
  during mint and withdraw operations.

## 2.11.1

### Patch Changes

- Upgrade `@cardano-sdk/core` to 0.46.15, removing the obsolete Ogmios client and
  its vulnerable transitive NanoID dependency. This resolves
  [GHSA-28wg-ghj8-5hjv](https://github.com/advisories/GHSA-28wg-ghj8-5hjv) and
  [GHSA-2v37-7h3g-55p8](https://github.com/advisories/GHSA-2v37-7h3g-55p8).

## 2.11.0

### Minor Changes

- Add an SDK-backed Sundae V3 swap-to-stake continuation flow for RealFi V1.0
  and V1.1. The helper validates the swap's guaranteed USDr output, derives the
  live request address and exchange rate, and computes the RealFi stake floor.

## 2.10.0

### Minor Changes

- Add the V1.1 deposit-batch alpha signing helpers. Batch creators can identify
  whether alpha is required with `batchNeedsAlpha`, compute it once with
  `computeDepositAlpha`, and pass the creator-selected value to
  `getSignedPayloadFromOrderInputs` so every co-signer signs the batch's stored
  alpha. First-party consumers can also import `IYieldSplitAlpha` from the
  internal SDK entry point.

## 2.9.0

### Minor Changes

- Refuse to create or package an order that would crash the batch it joins
  (WTB-1764). Every v1-family validator predicate that reads `min_received`
  requires it to be strictly positive, and those predicates run inside a
  `zip_fold` that `expect`s each request in turn — so one order with a zero floor
  crashes the ENTIRE execution transaction, killing every valid order bundled
  alongside it. Order creation is permissionless and has no on-chain gate, which
  made this a cheap, repeatable denial-of-service against the execution pipeline
  (738 Stake batch failures in 72h on preprod, all traced to a single order).

  `buildMintOrderTx`, `buildRedeemOrderTx`, `buildStakeOrderTx` and
  `buildUnstakeOrderTx` now throw on a non-positive `min_received`, whether it was
  passed explicitly or computed. That closes two paths the SDK itself could take:
  a dust stake whose floor rounds to zero at a high vault rate, and a full-forfeit
  unstake, which `computeUnstakeMinReceived` nets to zero (`unstake.ak`'s own
  comment defers that case to `min_received > 0`, i.e. the batch-wide crash).
  `computeStakeMinReceivedFromVaultRatio` in the tx-builder flow throws on the
  same condition.

  New `screenOrderAction` on the internal entry is the off-chain mirror of the
  validators' per-request predicates, so a candidate order can be screened before
  it is batched. `getSignedPayloadFromOrderInputs` applies it and reports which
  order ref is unexecutable, instead of letting the batch reach the validator and
  fail with an opaque crash.

  The screen covers two kinds of abort, because the datum alone cannot detect
  both. `screenOrderAction` handles the `process_*_requests` per-request
  predicates. `screenOrderUtxoFacts` handles the value-dependent ones: an order
  UTxO locking less of the consumed asset than its datum claims
  (`utilities.ak:416`, and the equivalent inside mint/burn's `and {}`), and a
  `min_received` above the deliverability ceiling `validate_destination_value`
  enforces (`utilities.ak:594`). The first is the cheapest batch-killer of all —
  min-ADA and none of the consumed asset. `screenOrderForExecution` on the SDK
  family runs both and is what consumers should call; it reads settings for the
  mint/burn reserve multiplier, off the memoised proxy datum.

### Patch Changes

- Route every time→slot conversion through one shared helper so slot alignment
  cannot silently no-op. `provider.unixToSlot` does not floor — it returns a
  fractional slot for any time that is not exactly on a slot boundary, which makes
  the natural "snap to slot" round-trip `slotToUnix(unixToSlot(t))` the identity on
  `t`, and lets a fractional slot reach the tx builder where CBOR truncates it
  silently. That divergence crashed a v1_1_rc1 windowed deposit on preview: the
  vault output's `diffusion_start` kept the sub-slot remainder while the tx's
  validity lower bound was floored, so `validate_deposit_diffusion`'s
  `diffusion_start == now` check failed. `slotFloor` and `slotAlignedTimeMs` (new,
  on the internal entry's `Utils`) are now the only place `unixToSlot` is called,
  and v1_1_rc1's execution validity bounds plus the order-creation scripts go
  through them.

## 2.8.0

### Minor Changes

- `detectParams` (and `detectSDKParams`) accept a network name (`"mainnet"`, `"preprod"`, `"preview"`) in place of an explicit config — partners can now target a network by name (`RealfiSDK.cardano.detectParams(provider, "preprod")`) without sourcing bootstrap references themselves. Explicit configuration remains available for custom deployments. The built-in presets are exported as `NETWORK_REGISTRY`.

### Patch Changes

- COSE (CIP-8) signature handling reads the COSE_Sign1 with the CBOR primitives already in the dependency tree, including indefinite-length encodings of the array, maps, and byte strings. The Emurgo WASM message-signing packages and their environment-conditional (`typeof window`) dynamic import are removed, so the SDK loads in runtimes without WASM-bundled dependencies (e.g. React Native / Lace mobile). The unused internal utility `stripCborBstrWrapper` is removed.
- Export `RealfiSDKV1Family` (value) and the `IVaultDatumLike` type from the `/internal` entry, so first-party consumers can narrow a detected SDK to the V1 protocol family structurally with `instanceof` instead of matching version strings.
- Surface diffusion-window shortfalls when executing a v1_1_rc1 deposit. A deposit
  order's `diffusion_end` is absolute and fixed at order creation, so delay before
  the execute lands (batching, cold/multisig signing) eats the window — and once it
  is gone the validator collapses it, settling the staked yield instantly. That is a
  valid on-chain outcome, so nothing used to report it. The SDK now warns (naming
  `diffusion_end`, the execution time, and the consequence) when a deposit execution
  would collapse a window, including the case where an unwindowed deposit clears a
  window that is still live. Two new optional params tune it:
  `diffusionShortfallThresholdMs` also flags a window that survives execution with
  almost nothing left, and `throwOnDiffusionWindowShortfall` refuses the build
  instead of warning.

## 2.7.0

### Minor Changes

- Additive API surface for operating a v1_1_rc1 protocol.
  - The `/internal` barrel now exports the diffusion and yield-split maths so
    first-party consumers can reproduce on-chain figures instead of re-deriving
    them: `pendingRemaining` and `settledBacking` (verbatim ports of the
    `utilities.ak` helpers) and `calculateYieldShares`.
  - `yieldOracleBootstrap` is now **optional** in the V1_1_Rc1 params. A
    deployment that defers the yield oracle can omit the seed entirely, and both
    `create()` and version detection fall back to
    `YIELD_ORACLE_BOOTSTRAP_PLACEHOLDER` — a permanently un-consumable
    `OutputReference` (all-zeros tx hash) now exported from the root barrel. The
    orchestrator hash stays real, deterministic and reproducible by every
    consumer, and no bootstrap UTxO has to be reserved and protected from fee
    selection. Supplying a real seed continues to override it. The placeholder is
    frozen, since it is shared by reference across every omitted-seed
    reconstruction in the process.
  - The V1 family gained batched bootstrap helpers, so a fresh protocol's script
    deployments and stake registrations can be submitted as a few batched
    transactions rather than one per script, while staying under the 16 KB
    transaction limit.

- Add public version-agnostic accessors on the V1 SDK family: `getSettingsConfig()`
  reads the shared settings config (`reserve_assets`, `unstaked_yield_pot`) across
  v1_0 and v1_1 datum layouts, `classifyOrderUtxo()` decodes and classifies a single
  open-order UTxO with the active version's order schema (no same-action-type
  constraint, for scanning mixed batches), and `parseOrders()` is the public
  same-type batch wrapper over the order parser. The supporting types
  (`IOnChainOrderInfo`, `IClassifiedOrderAction`, `IClassifiedOrderUtxo`,
  `TV1SettingsConfig`) are exported from the internal entry.

### Patch Changes

- Fix two v1_1_rc1 execution-timing defects that only reproduce against a real
  network — the emulator's injected clock is already slot-aligned, so neither
  appeared in the emulator suite.
  - **Slot-align the pinned execution time.** `provider.unixToSlot` does not floor:
    for a wall-clock time off a slot boundary it returns a _fractional_ slot, so
    `slotToUnix(unixToSlot(now))` round-tripped back to the raw millisecond.
    The transaction body stores `invalid_before` as an **integer** slot, so
    on-chain the validator reads `slotToUnix(floor(slot))` while the vault output's
    `diffusion_start` kept the sub-slot remainder. `validate_deposit_diffusion`
    requires `diffusion_start == now`, so a **windowed deposit crashed the
    orchestrator at `Withdraw[0]`**. The slot is now floored when pinning the
    execution time.
  - **Open a vault-touching execution's validity interval slightly in the past.**
    A submitter whose clock runs a few seconds fast produced a premature
    transaction, rejected by the node with `OutsideValidityIntervalUTxO`. The
    back-off is **execution-scoped** rather than a global clock shift: `now`
    remains real wall-clock time, so duration-based diffusion windows keep their
    requested length, and the forward `validUntil` bound is not shifted. Because
    the validator welds `diffusion_start` to the validity lower bound, all three
    values continue to derive from the same pinned instant. An injected clock
    (emulator and tests) disables the back-off entirely, so deterministic time
    assertions still hold.

  Because the back-off widens the effective validity span, the constructor now
  rejects a configuration where the back-off plus `executionValidityWindowMs`
  would exceed one hour (`MAX_DIFFUSION_RATE_SPAN_MS`) — previously such a span
  was accepted here and only failed later on-chain, inside `diffusion_rate_time`.

  Also clarifies that a deposit's diffusion window is measured from **order
  creation**, not execution: `buildDepositOrderTx` resolves `diffusionDurationMs`
  against the order-creation time and writes an absolute `diffusion_end` into the
  order datum, so any delay before the execute lands shortens the effective
  window, and a window that fully elapses beforehand collapses the deposit to
  instant on-chain.

- Expose the v1_1_rc1 diffusion-aware sUSDr exchange-rate helper from the SDK and
  normalize nested v1_1 proxy settings through `getSettings()`. First-party
  frontends can now compute `susdrExchangeRateInputs` with the same linear
  pending-yield diffusion math used by the validators instead of reimplementing it
  locally.

## 2.6.0

### Minor Changes

- Add the in-place v1_0 → v1_1_rc1 protocol upgrade to `RealfiSDKV1_1Rc1`: `create()` wires the protocol-migration withdraw validator (registry-gated, exposed as `migrationScriptHash`), with `deployMigration()` and `registerMigrationStake()` for setup, `getMigrateStatePayload()` for the signed `MigrateState` authorization, and `buildMigrateStateTx()` to migrate the staking-vault datum in place — the vault is re-locked at the same address and value with the v1_1 datum shape, preserving `circulating_susdr`. The treasury, staking-vault, and USDr-policy scripts are hash-identical across the two versions, so no funds move during the upgrade.

### Patch Changes

- Resolve datums by hash when an NFT-located UTxO carries a datum hash instead of an inline datum: `getDatumFromNFT` falls back to the provider's datum resolution, so datum reads no longer fail for outputs created with hashed datums.
- Complete the partner-facing type surface for V1_1_Rc1: `IRealfiCardanoSDKV1_1Rc1`, a `TRealfiCardanoSDK` union member, and a `create` overload resolving to the narrowed instance type. The V1_1_Rc1 partner method set matches V1_0/V1_0_Rc1 — `create` and version detection already dispatched to V1_1_Rc1 correctly, but the class was missing from the curated partner types.
- Reconcile `RealfiSDKV1_1Rc1` with the audited v1_1 contracts: regenerated v1_1_rc1 types; the orchestrator withdraw redeemer is wrapped in `ExecuteOrders`; deposit execution signs and echoes the exact `alpha` staked-yield share the vault applies; `create()` wires the yield-oracle validator hash into the orchestrator (exposed as `yieldOracleScriptHash`); settings datums gain the migration registry and permission fields; version detection recomputes the orchestrator hash accordingly.

## 2.5.0

### Minor Changes

- Add `RealfiSDKV1_1Rc1` — order execution (mint, redeem, stake, unstake, deposit, withdraw, direct mint/burn) for the v1*1_rc1 protocol, including **time-diffused yield**. Deposited staked yield releases into the staking-vault exchange rate linearly over a window (`diffusion_start`→`diffusion_end`) instead of instantly, so stake/unstake rates are quoted against \_settled* backing (balance minus the not-yet-diffused `pending_yield`).

  The class extends the shared `RealfiSDKV1Family` and reuses its V1_0-semantics tx-builders, overriding only the diffusion seams: the four-field vault datum, the nested settings adapters, `settledVaultBacking`, the `diffusion_end` treasury request, the deposit vault-window update, the `diffusion_end` deposit-order parameter, and the execution validity bounds. The deposit-order builder gains optional `diffusionEnd` / `diffusionDurationMs` parameters (default: instant), preserving call-compatibility with V1_0's deposit builder. `V1_1_Rc1` is wired into version detection (matched first), the create facade, cancel, and the normalized version map.

### Patch Changes

- Attach the required unstake indexer metadata (label 55534472) when building treasury-managed unstake order transactions. Previously only the retail unstake builder attached it, so treasury unstake orders were never indexed.

## 2.4.2

### Patch Changes

- Apply the configured slippage tolerance to default V1 unstake `min_received` values.
- Build payment outputs directly instead of using Blaze payment helpers.

## 2.4.1

### Patch Changes

- Fix batch execution failing with "assertPaymentsAddress: address payment credential cannot be a script hash" when the protocol's unstaked_yield_pot is a script address. Deposit-yield and unstake-forfeit pot payments are now built as direct outputs (like order payouts) instead of routing through Blaze's payAssets, which rejects script payment credentials.

## 2.4.0

### Minor Changes

- Attach provenance metadata (label 55534473) to every built order transaction, identifying the SDK source ("partner-sdk" or "internal-sdk") and version. Unstake orders carry both this label and the existing timelock label (55534472) in a single auxiliary-data write.
- API calls now carry a client identifier in the GraphQL request body (`extensions.clientId`), set to `"<source>/<version>"` (e.g. `"partner-sdk/2.3.0"` or `"internal-sdk/2.3.0"`). The RealFi API records the identifier as a structured `clientId` field in request logs.
- Automatic protocol-version detection at order build on the partner facade: every `build*Tx` call re-resolves the live protocol version (~1 provider lookup per build, following the proxy's one-shot NFT) and dispatches to the matching version instance, so the same call keeps building the right version's order across an on-chain protocol upgrade with no re-init. `create` accepts an optional `{ versionDetection?: "per-build" | "at-init", onVersionChange?: (previous, next) => void }` — `"at-init"` opts out and freezes the instance at the version it was created with. Read helpers (`get*`) never re-detect.

## 2.3.1

### Patch Changes

- Internal refactor: extract a shared `RealfiSDKV1Family` base class from `RealfiSDKV1_0` and `RealfiSDKV1_0Rc1`. The family is generic over the settings and vault-datum statics, with version-overridable seams for vault datum construction (`buildInitialVaultDatum`/`buildUpdatedVaultDatum`), settings access (`settingsConfig`/`settingsRegistry`), and execution validity bounds (`applyExecutionValidityBounds`, no-op today) — groundwork for the upcoming `v1_1_rc1` execution SDK with its 4-field yield-diffusion vault. No public API or behavior change.

## 2.3.0

### Minor Changes

- The unsupported `./internal` entry is not part of the published package: importing `@realfi-co/realfi-partner-sdk/internal` fails to resolve. The supported surface is the package root and `./tx-builder`.

## 2.2.0

### Minor Changes

- Add `v1_1_rc1` generated types and a protocol settings admin SDK. `RealfiProtocolSettingsAdmin` (exposed via the `./internal` entry) builds and authorizes governance changes to the on-chain protocol settings — change permissions, config, or logic/registry; shutdown and restore; and migrate to another settings validator — using COSE (CIP-8) signed redeemers collected out-of-band (two-phase: `getSettingsAuthPayloadHash` then `buildChangeX({ signatures })`).

## 2.1.0

### Minor Changes

- Partner Cardano SDK instances expose their `version` (`"V0_4" | "V1_0" | "V1_0_Rc1"`), making `TRealfiCardanoSDK` a discriminated union — a held instance now narrows to its version-specific surface, replacing 1.x `instanceof` checks.

## 2.0.4

### Patch Changes

- Export `IRawProxyDatumResult` — the declared return type of `getRawProxyDatum` — from the public entry point.

## 2.0.3

### Patch Changes

- Preserve surplus order UTxO value in V1.0 execution destination outputs.

## 2.0.2

### Patch Changes

- Automatically attach required unstake order metadata when building retail unstake order transactions.

## 2.0.1

### Patch Changes

- Ship `CHANGELOG.md` in the published package.

## 2.0.0

### Major Changes

- `@realfi-co/realfi-partner-sdk` succeeds `@realfi-co/realfi-sdk` 1.x as the curated partner surface. Deployment, operator, and signing APIs are not exposed; the public entry is the partner facade (`RealfiSDK.cardano` + `RealfiSDK.api`). Also not carried over from 1.x: the direct mint/burn order builders (use the standard mint/redeem order flow), the superseded `V0`–`V0_3` protocol versions and their types, and the root-level shared helpers (the kept set lives under `Utils`).

### Minor Changes

- `buildClaimTimelockTx` accepts optional `owner` and `destination`, so a custodian holding a user's key can claim the user's unstaked USDr and deliver it — including accrued yield — to the user. Both default to the connected wallet; funds route to `owner` when only an owner is given.
- Add `RealfiSDK.api` — off-chain GraphQL reads with per-network endpoints built in: order status (`getOrdersByOwner`), stake times and the unstake cooldown slot, yield breakdown, order fees, points balance, and referral reads. No Blaze instance required.
