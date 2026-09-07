# @bitgo/utxo-pox5

PoX-5 local protocol and Wallet Platform integration harness. The package's
live tests are opt-in and send real transactions when run against shared
networks. See `test/integration/pox5/README.md` for the full operator guide.

## Bond index

A PoX-5 **bond** is a registration slot in the Stacks PoX-5 contract. A BTC
lockup that stakes through PoX-5 must reference one bond by its **bond index**.
The bond determines:

- whether the stake can be registered at all (the bond must exist and be `open`),
- the staker's allowance for that bond (the staker must be allowlisted for at
  least the stake amount), and
- the **L1 unlock height** that the lockup's `OP_CHECKLOCKTIMEVERIFY` locktime
  must match. The contract is the source of truth for this height.

The index is not a constant. It advances with the Stacks reward cycle, so a
bond that was open earlier may be `finished` later. Never hardcode an index
without rechecking it against the chain immediately before a broadcast.

### How the current index is derived

Bonds are spaced by `BOND_GAP_CYCLES` reward cycles. The stacks.js PoX-5 module
exposes the spacing and the first PoX-5 cycle:

```text
currentBondIndex = floor((rewardCycleId - firstPox5RewardCycle) / BOND_GAP_CYCLES)
```

- `rewardCycleId` comes from `fetchPoxInfo` on the Stacks node.
- `firstPox5RewardCycle(poxInfo)` gives the first cycle with PoX-5 bonds.
- `bondGapCycles` is read from the module's `BOND_GAP_CYCLES`.

Bonds near `currentBondIndex` are the only realistic candidates. Each bond can
be in one of several states:

| Status | Meaning for a new stake |
|---|---|
| `open` | Registration accepted. The only usable state. |
| `locked` | Registration closed; the bond is waiting for its unlock. |
| `unlocked` | Unlock height reached; no new stakes. |
| `finished` | Bond complete; no new stakes. |

### Discovery procedure

`findAllowlistedBondIndex()` in `test/integration/pox5/scenario.ts` implements
the discovery used by the paired-stake scenario:

1. Read `fetchPoxInfo` and compute `currentBondIndex` as above.
2. Scan `currentBondIndex - R` through `currentBondIndex + R`, where
   `R = POX5_BOND_SCAN_RADIUS` (default `8`).
3. For each bond, call `fetchBond`. Skip absent bonds.
4. Call `fetchBondAllowance` for the staker address and skip bonds whose
   allowance is below the stake amount.
5. Call `fetchBondStatus`. Return the first bond whose status is `open`.
6. If bonds exist and the staker is allowlisted but none is open, fail with a
   "wait for the next registration window" error. Setting `POX5_BOND_INDEX`
   cannot bypass this check.

`scenario.ts` and the CLI share this scan through `test/integration/pox5/bond-discovery.ts`
(`scanBondWindow`, `openAllowlistedBonds`).

### Read-only CLI

```bash
yarn --cwd modules/utxo-pox5 integration-test:pox5:bonds --coin tbtcstxsignet \
  --staker <STX_ADDRESS> --amount-sats 30000 [--radius 8]
```

The command prints the reward cycle, the current bond index, every existing bond
in the window with its staker allowance and status, the open allowlisted bonds,
and a `selection` of `unique`, `none`, or `ambiguous`. It reads Stacks state only:
no BitGo calls, no wallets, no transactions. Staker and amount default to
`POX5_STACKS_STAKER_ADDRESS` and `POX5_LIVE_STAKE_SATS`.

### Live matrix fallback

- If `POX5_LIVE_BOND_INDEX_<COIN>` is set, the live matrix uses that index.
- If it is unset, the live matrix runs the same scan with `POX5_STACKS_STAKER_ADDRESS`
  and `POX5_LIVE_STAKE_SATS`. It proceeds only when exactly one bond is open and
  allowlisted for the staker. Otherwise it returns `NOT_READY` and lists the
  candidates; it never chooses among several open bonds.
- Either way, the selected bond is re-verified immediately: `fetchBondStatus` must
  return `open`, and the unlock height is read from the contract. The run report
  records `bondIndex` and `bondSource` (`CONFIGURED` or `DISCOVERED`).

### Unlock height and safety bounds

`resolveProtocolBond()` in `test/integration/pox5/live-matrix-network.ts`:

- rejects a configured index that is not a non-negative integer,
- requires `fetchBond` to return a bond and `fetchBondStatus` to return `open`,
- reads the unlock height with `fetchBondL1UnlockHeight`,
- checks the Stacks chain ID and burnchain height against the matching BTC tip
  (`verifiedLiveTip`), and
- calls `assertProtocolUnlock()`, which requires the unlock height to be above
  the current tip and no more than `POX5_LIVE_MAX_LOCK_BLOCKS` ahead.

The unlock height is never derived from `latestBlockHeight + 1`.

## Signet block schedule

`tbtcstxsignet` (Hiro's staking-testnet signet, Stacks chain ID 1280) produces
blocks about every **10 minutes**, not every minute. Use these values for
timeouts, cycle expectations, and operator planning.

- **Target spacing: 600 s.** Bitcoin Core's signet consensus params set
  `nPowTargetSpacing = 10 * 60` and `nPowTargetTimespan = 2 weeks`
  (`SigNetParams` in `src/kernel/chainparams.cpp`, v29.0 tag). Difficulty retargets
  every 2016 blocks. These values are compiled into Core, so they cannot be changed
  through `bitcoin.conf` or any runtime flag. BitGo's fullnodes run unpatched Core v29.0
  and sync this chain, so the chain follows the same rules.
- **Observed:** 584 s mean between blocks from the 2026-10-01 retarget (height 12096)
  through height 13810 (2026-10-13), n = 1714 intervals. Median 405 s. Longest gap
  4304 s (~72 min). Early blocks (heights ~9000-10000) averaged ~68 s only because
  difficulty was about 16x lower. Two 4x retargets (heights 10080 and 12096) raised it
  to 1.1536, and the average has since settled near the target.
- **Derived durations at 10 minutes per block:**

  | Interval                                 | Burn blocks | Approx. duration |
  | ---------------------------------------- | ----------- | ---------------- |
  | PoX reward cycle (15 reward + 5 prepare) | 20          | ~3.3 h           |
  | New bond (every 2 cycles)                | 40          | ~6.7 h           |
  | Bond completion (every 12 cycles)        | 240         | ~40 h            |

- **Test timeouts:** the signet confirmation default is 2 h
  (`HIRO_SIGNET_CONFIRMATION_TIMEOUT_MS`), about 12 blocks. The live-matrix
  `POX5_LIVE_TIMEOUT_MS` default is 2 h for `tbtcstxsignet` and 20 min for the regtest
  coins. Do not set it below 2 h for signet.

Measured 2026-10-13 from `https://mempool.bitcoin.staking-testnet.hiro.so/api`
(`/blocks/tip/height`, `/v1/blocks/:height`, `/difficulty-adjustment`) and
`https://api.staking-testnet.hiro.so` (`/v2/info`, `/v2/pox`).

## Configuration

| Variable | Used by | Purpose |
|---|---|---|
| `POX5_LIVE_BOND_INDEX_<COIN>` | `resolveProtocolBond()`, live matrix `pairedStake` | Optional operator-chosen bond index for one network (for example `POX5_LIVE_BOND_INDEX_TBTCSTXSIGNET`). When unset, the bond is discovered at run time. |
| `POX5_STACKS_STAKER_ADDRESS` | Bond discovery (CLI and live fallback) | Stacks address whose allowance is checked. Required when discovering. |
| `POX5_LIVE_STAKE_SATS` | Bond discovery (CLI and live fallback) | Stake amount; a bond counts only if the allowance covers it. |
| `POX5_BOND_INDEX` | `bitgo-api.wp-sign.integration.ts`, `config.ts`, `scenario.ts` | Bond index for the hot Wallet Platform signing suite and the Stacks scenario. Must be explicitly allowlisted for the staker. |
| `POX5_BOND_SCAN_RADIUS` | `findAllowlistedBondIndex()` | Scan radius around the current index. Default `8`. |
| `POX5_LIVE_MAX_LOCK_BLOCKS` | `resolveProtocolBond()` | Maximum allowed lock duration ahead of the tip. |
| `POX5_LIVE_STACKS_URL_<COIN>` | `liveEndpoints()` | Stacks API base URL override. |
| `STACKS_JS_ROOT`, `POX5_STACKS_BITCOIN_STAKING_MODULE` | `loadStacksBitcoinStaking()` | Location of the `@stacks/bitcoin-staking` build that exposes the bond functions. |

Bond index zero is valid. Configure a bond only for a network and environment
where it has been verified as `open` for the intended staker.

## Code map

| Concern | Location |
|---|---|
| Stacks PoX-5 bond reads (`fetchBond`, `fetchBondStatus`, `fetchBondAllowance`, `fetchBondL1UnlockHeight`, `bondGapCycles`, `firstPox5RewardCycle`) | `test/integration/pox5/stacks-js.ts` (`loadStacksBitcoinStaking`) |
| Shared discovery scan around the current index | `test/integration/pox5/bond-discovery.ts` (`scanBondWindow`, `openAllowlistedBonds`) |
| Scenario bond selection | `test/integration/pox5/scenario.ts` (`findAllowlistedBondIndex`) |
| Read-only bond window CLI | `test/integration/pox5/run-bond-discovery.ts` (`integration-test:pox5:bonds`) |
| Configured-or-discovered bond verification and unlock safety bounds | `test/integration/pox5/live-matrix-network.ts` (`resolveProtocolBond`, `discoverLiveBondIndex`, `assertProtocolUnlock`, `verifiedLiveTip`, `liveEndpoints`, `liveStakingAdapter`) |
| Offline discovery tests | `test/integration/pox5/bond-discovery.test.ts` |
| Paired-stake operation that consumes the verified bond | `test/integration/pox5/live-matrix-live.ts` (calls `resolveProtocolBond`) |
| Hot signing path that takes `POX5_BOND_INDEX` | `test/integration/pox5/bitgo-api.wp-sign.integration.ts` |

## Recording a discovery

Discovery results change quickly. When a bond index is used for a live run,
record the network, bond index, observed status, unlock height, BTC tip, and
time in the run report, and recheck the status immediately before any
broadcast. Historical observations are not valid inputs for a later run.
