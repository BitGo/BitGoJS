# PoX-5 Stacks Regtest Harness

This directory contains test-only integration tooling for both Hiro-operated
Stacks PoX-5 regtest networks. It does not add Docker, Stacks, or Bitcoin
dependencies to the published `@bitgo/utxo-staking` package.

The network is selected with `POX5_NETWORK`:

| Profile           | Stacks API                      | Bitcoin service           | Chain ID     | PoX-5 activation |
| ----------------- | ------------------------------- | ------------------------- | ------------ | ---------------- |
| `tbtcstx`         | `https://api.testnet.hiro.so`   | `tbtcstx-bitcoin`         | `0x80000000` | `2702`           |
| `tbtcstxprivate1` | `https://api.private-1.hiro.so` | `tbtcstxprivate1-bitcoin` | `0x100`      | `202`            |
| `local`           | Dockerized Stacks node          | Dockerized Bitcoin Core   | `0x80000000` | local config     |

Shared profiles support two fullnode modes:

| Mode      | Compose source                                               | `indexer-utxo` required | Use                                                  |
| --------- | ------------------------------------------------------------ | ----------------------- | ---------------------------------------------------- |
| `direct`  | Package-owned Bitcoin-only Compose file                      | No                      | Query the localhost Bitcoin Core RPC directly        |
| `indexer` | `indexer-utxo/containers/docker-compose.develop-tbtcstx.yml` | Yes                     | Reuse the existing indexer development Compose setup |

The first two profiles use separate local BitGo-owned Bitcoin Core processes
connected to their corresponding Hiro peer. They must never run
`generatetoaddress`: local mining would fork the shared burnchain and make
Stacks SPV proofs invalid. The `local` profile remains available for fully
disposable deterministic development and is the only profile that permits
manual mining.

## Prerequisites

- Node 22 or newer.
- Docker and Docker Compose v2.
- `indexer-utxo` checkout for the two-network Bitcoin Compose file.
- Pinned `stacks.js-pox5` checkout, built with `@stacks/bitcoin-staking`.
- A funded Stacks account for live registration scenarios, configured with
  `POX5_STACKS_STAKER_ADDRESS` and `POX5_STACKS_PRIVATE_KEY`.

Create an untracked environment file:

```bash
cp modules/utxo-pox5/test/integration/pox5/.env.example \
  modules/utxo-pox5/test/integration/pox5/.env.local
set -a
. modules/utxo-pox5/test/integration/pox5/.env.local
set +a
```

Set `POX5_NETWORK=tbtcstx` or `POX5_NETWORK=tbtcstxprivate1` and use
`POX5_FULLNODE_MODE=direct` to avoid an `indexer-utxo` checkout entirely. The
direct mode starts only the selected package-owned Bitcoin Core service and all
status, wallet, and funding reads go through its localhost JSON-RPC endpoint.
Set `STACKS_JS_ROOT` to a checkout containing the pinned
`@stacks/bitcoin-staking` build. The network profile supplies the canonical
Stacks endpoint, Bitcoin RPC port, coin name, chain ID, and activation height;
all can be overridden explicitly for test fixtures.

To retain the previous Compose setup, use `POX5_FULLNODE_MODE=indexer` and set
`POX5_INDEXER_UTXO_ROOT` to the local `indexer-utxo` checkout.

For the deterministic local profile, also set `STACKS_CORE_ROOT`,
`STACKS_REGTEST_ENV_ROOT`, and use `POX5_NETWORK=local`.

## Commands

The harness is driven by the package's integration-test scripts. Use
`integration-test:pox5:up`, `:fund`, `:register`, and `:down` for the shared Hiro
profiles; use `test:pox5-local` or its `:mine` and `:status` variants for the
disposable local profile. Shared Hiro profiles must never mine.

Run the service-free BitGoJS descriptor and witness scenario:

```bash
yarn --cwd modules/utxo-pox5 integration-test:pox5:offline
```

Start the selected Bitcoin service. For `tbtcstx` and `tbtcstxprivate1`, this
starts only the matching local fullnode and waits for it to sync its Hiro peer.
For `local`, it starts the complete disposable Stacks/Bitcoin stack:

```bash
yarn --cwd modules/utxo-pox5 integration-test:pox5:up
```

Run the readiness and canonical-script smoke scenario:

```bash
yarn --cwd modules/utxo-pox5 integration-test:pox5
```

Fund and confirm one real PoX-5 lock output on a shared Hiro profile:

```bash
yarn --cwd modules/utxo-pox5 integration-test:pox5:fund
```

This calls the selected profile's BTC faucet, waits for the faucet transaction
to confirm, uses the local Core wallet to fund the BitGoJS-generated lock
address, and waits for that lock transaction to confirm. It does not submit
`register-for-bond` yet; the next lifecycle step consumes the confirmed
transaction and its SPV proof.

Submit the confirmed lock to PoX-5 on private-1:

```bash
yarn --cwd modules/utxo-pox5 integration-test:pox5:register
```

For registration, set `POX5_STACKS_PRIVATE_KEY` and
`POX5_STACKS_STAKER_ADDRESS` explicitly. `tbtcstxprivate1` defaults to the
deployed shared signer-manager; `tbtcstx` requires its deployment-specific
`POX5_SIGNER_MANAGER` override. The private key is never printed or sent to
Bitcoin Core.

Run the complete selected-profile flow and tear down on exit:

```bash
yarn --cwd modules/utxo-pox5 test:pox5-local
```

Inspect selected endpoints and container state:

```bash
yarn --cwd modules/utxo-pox5 test:pox5-local:status
```

`test:pox5-local:mine` is valid only for `POX5_NETWORK=local`. Shared Hiro
profiles reject the command explicitly.

## Hiro BTC Faucet Smoke Tests

The local regtest profile stays hermetic and funds with local Bitcoin Core
mining. Separate opt-in smoke tests check the Hiro BTC faucets for all three
`tbtcstx*` coins and verify each faucet accepts an address and returns a
transaction ID:

| Coin              | Faucet                                                        |
| ----------------- | ------------------------------------------------------------- |
| `tbtcstx`         | `https://api.testnet.hiro.so/extended/v1/faucets/btc`         |
| `tbtcstxprivate1` | `https://api.private-1.hiro.so/extended/v1/faucets/btc`       |
| `tbtcstxsignet`   | `https://api.staking-testnet.hiro.so/extended/v1/faucets/btc` |

These tests send test BTC and leave the resulting transactions on the shared
Hiro networks. Run them only with disposable, network-valid destination
addresses configured for each coin:

```bash
export POX5_HIRO_FAUCET_SMOKE=1
export POX5_HIRO_FAUCET_ADDRESS_TBTCSTX='<bcrt1 address>'
export POX5_HIRO_FAUCET_ADDRESS_TBTCSTXPRIVATE1='<bcrt1 address>'
export POX5_HIRO_FAUCET_ADDRESS_TBTCSTXSIGNET='<tb1 signet address>'
yarn --cwd modules/utxo-pox5 integration-test:pox5:hiro-faucets
```

The smoke tests are skipped unless `POX5_HIRO_FAUCET_SMOKE=1`; normal unit
tests use mocked HTTP responses and never contact Hiro.

## Test Layers

The offline scenario constructs the canonical BitGo PoX-5 descriptor and native
`wasm-utxo` PSBT, then exercises the post-CLTV and principal-preimage branches.

The shared-network smoke scenario verifies:

- Bitcoin Core reports `regtest` and the expected profile endpoint is reachable;
- the Stacks `/v2/info` chain ID matches the selected network;
- PoX-5 is active at the configured activation height;
- the selected PoX-5 contract interface is available;
- BitGoJS and `@stacks/bitcoin-staking` produce identical lock scripts and
  output scripts for the selected STX principal and unlock height.

The registration E2E layer funds a real lock, retrieves its SPV inputs, and
submits `register-for-bond`. Stacks protocol exits remain separate from BitGo
API integration coverage.

## BitGo API Fund Integration Test

The faucet-only Mocha suite supports all three `tbtcstx*` coins:
`tbtcstx`, `tbtcstxprivate1`, and `tbtcstxsignet`. With `POX5_NETWORK` unset,
it funds and confirms each coin in the selected BitGo environment. Set
`POX5_NETWORK` to one coin to narrow the run. Funding uses a dedicated
environment/coin-labeled hot wallet; it never selects a random accessible
wallet. Existing dedicated wallets are reused. If a confirmed indexed UTXO is
already present, the test revalidates its tx on the coin's matching chain and
does not request another faucet deposit. Otherwise, it requests faucet BTC to
a newly generated address and waits for chain confirmation and BitGo indexing.
Set `POX5_FUND_FORCE_FAUCET=1` to request another faucet deposit even when that
dedicated wallet already has confirmed funds.

The two Hiro regtest coins use their corresponding regtest faucet/confirmation
profiles. `tbtcstxsignet` uses the independent Hiro staking-testnet signet
faucet, checks a pinned signet block checkpoint and canonical confirmation,
then verifies the exact deposit was indexed by BitGo. No regtest RPC is used
for signet; it requests Hiro's `xlarge=true` mode for enough BTC to cover the
default paired-stake amount and fee cap. The actual payout remains controlled
by Hiro. The suite only receives funds; it does not sign or submit a wallet
transaction or call Stacks APIs. Since the 2026-10 chain reset the staking
signet has produced blocks on a steady ~2-minute cadence (observed 2026-10-15:
15 consecutive blocks exactly 120s apart; the pre-reset docs assumed ~10
minutes). That pace holds only until the first difficulty adjustment —
Bitcoin's 2016-block retarget should pull it back toward the ~600 s nominal
target — so the signet confirmation wait still defaults to 2 hours;
see
`modules/utxo-pox5/README.md#signet-block-schedule`.

`POX5_BITGO_API_ENV` selects BitGo `test` or `staging` and defaults to
`staging`; export the corresponding `BITGO_TOKEN_TEST` or
`BITGO_TOKEN_STAGING`. The wallet passphrase has no default; set the environment-specific or
common `BITGO_WALLET_PASSPHRASE` variable. A sole accessible enterprise is selected by the dedicated
wallet helper only when an enterprise ID is not supplied; set
`POX5_BITGO_ENTERPRISE_ID`, `POX5_BITGO_ENTERPRISE_ID_TEST`, or
`POX5_BITGO_ENTERPRISE_ID_STAGING` when needed.

Run this separately from `unit-test`; faucet deposits and wallets remain in
the selected BitGo environment:

```bash
export POX5_BITGO_API_ENV=staging
# Export BITGO_TOKEN_STAGING from your secret store.
yarn --cwd modules/utxo-pox5 integration-test:pox5:bitgo-api:fund
```

To target only signet or run test instead of staging:

```bash
POX5_NETWORK=tbtcstxsignet POX5_BITGO_API_ENV=staging yarn --cwd modules/utxo-pox5 integration-test:pox5:bitgo-api:fund
POX5_NETWORK=tbtcstxprivate1 POX5_BITGO_API_ENV=test yarn --cwd modules/utxo-pox5 integration-test:pox5:bitgo-api:fund
```

## BitGo API Testnet Wallet-Creation Integration Test

The opt-in wallet-creation test creates or verifies one hot on-chain wallet on
each Stacks Bitcoin test coin: `tbtcstx`, `tbtcstxprivate1`, and `tbtcstxsignet`.
It authenticates and unlocks the selected BitGo `test` or `staging` environment,
then checks each wallet through its coin-specific API. It does not require a
local Bitcoin or Stacks node, request faucet funds, or broadcast transactions.
The wallets remain in the selected BitGo account and are reused by label on
subsequent runs.

Enable it explicitly with `POX5_ENABLE_LIVE_WALLET_CREATION=1`. The BitGo
environment defaults to `staging`; export the matching `BITGO_TOKEN_STAGING` or
`BITGO_TOKEN_TEST`. A sole accessible enterprise is selected automatically;
otherwise set `POX5_BITGO_ENTERPRISE_ID`. `BITGO_WALLET_PASSPHRASE` has no
default; set it to the dedicated wallet's passphrase.

```bash
export POX5_ENABLE_LIVE_WALLET_CREATION=1
export POX5_BITGO_API_ENV=staging
# Export BITGO_TOKEN_STAGING from your secret store.
yarn --cwd modules/utxo-pox5 integration-test:pox5:bitgo-api:wallet-creation
```

## BitGo API Fake-Stake Integration Test

This is a separate end-to-end BTC test. It uses a dedicated fixed-script wallet,
funds it from the selected Hiro faucet, builds and submits a 30,000-sat PoX-5
lock transaction with `unlockHeight = currentHeight + 1`, then builds both the
late-exit and controlled early-exit PSBT paths. It submits the early exit and
waits for the BTC to return to the main wallet. The principal preimage and
early-exit key are deterministically derived from `BITGO_WALLET_PASSPHRASE`,
the BitGo API environment, and `POX5_NETWORK`; they are kept in memory and are
not printed.
Building a late-exit PSBT here is not a post-CLTV sweep: only the early-exit
branch is submitted. A successful run would not count as paired post-CLTV
recovery in the live matrix.

This test reuses a confirmed wallet unspent when one is large enough for the
stake and fee; otherwise it funds the wallet from the faucet. It broadcasts
real Bitcoin test-network transactions and incurs their fees, but does not call
Stacks APIs or register a PoX-5 stake. It is separate from both `unit-test` and
the faucet-only `:fund` suite. It reuses a dedicated wallet labeled for the
selected coin and recovers matching interrupted fake stakes before starting a
new round trip.
`BITGO_WALLET_PASSPHRASE` is required for signing. If the account has multiple
accessible enterprises, set `POX5_BITGO_ENTERPRISE_ID` when the test creates
its dedicated wallet. Set `POX5_FAKE_STAKE_WALLET_LABEL` to isolate a run from
existing labeled test wallets with different recovery material.
For a recovery-only diagnostic retry, set
`POX5_FAKE_STAKE_RECOVERY_ONLY=1` and pin the sole target with
`POX5_FAKE_STAKE_RECOVERY_OUTPOINT=<txid>:<vout>`. The test then skips faucet
funding and new stake creation. On early-signing failure it logs only the
outpoint match, locktime/sequence, witness-script and UTXO hashes, key-match
booleans, and signature counts; it never logs PSBT bytes, scripts, keys, or
preimages.

```bash
export POX5_NETWORK=tbtcstxprivate1
export POX5_BITGO_API_ENV=staging
export BITGO_WALLET_PASSPHRASE
# Export BITGO_TOKEN_STAGING from your secret store.
yarn --cwd modules/utxo-pox5 integration-test:pox5:bitgo-api:fake-stake
```

## Standalone PoX-5 Descriptor-Wallet Spend Integration Test

This opt-in integration exercises the PoX-5 conditional P2WSH spend through
Wallet Platform signing without the paired-wallet flow or the Staking
Service. It creates a dedicated hot descriptor wallet whose first descriptor
is an ordinary 2-of-3 receive/change pair followed by a canonical PoX-5
lockup descriptor with a minimal locktime, plus a dedicated fixed-script main
wallet. The main wallet is faucet-funded and sends the lock amount to a
registered PoX-5 receive address of the descriptor wallet. After the chain
reaches the lockup's unlock height, the test builds a one-input post-CLTV
sweep back to a main-wallet address, reviews the PSBT shape and the native
PoX-5 locktime policy, then signs and submits it through the wallet send
path, which routes through the HSM signer. A failed sweep submission
surfaces the Wallet Platform and HSM signing errors, which is the
WAL-2088 reproduction.

The test is guarded by `POX5_ENABLE_LIVE_DESCRIPTOR_SPEND=1` and is
restricted to `POX5_NETWORK=tbtcstx` or `tbtcstxprivate1` with BitGo `test`
or `staging`. It broadcasts two real transactions (the lockup funding send
and the sweep) and pays their fees. Wallets and recovered funds remain in
the BitGo test account afterward. The descriptor wallet's unlock height is
fixed when it is created, so later runs reuse the wallet, register a fresh
receive address, and spend immediately. The recovery material is derived
deterministically from `BITGO_WALLET_PASSPHRASE`, the BitGo environment, and the coin; set
`POX5_DESCRIPTOR_WALLET_LABEL` to a fresh label to start over with
different material.

```bash
export POX5_NETWORK=tbtcstx
export POX5_BITGO_API_ENV=staging
export POX5_ENABLE_LIVE_DESCRIPTOR_SPEND=1
# Export BITGO_TOKEN_STAGING from your secret store.
yarn --cwd modules/utxo-pox5 integration-test:pox5:bitgo-api:descriptor-spend
```

## Live Wallet Platform Signing Integration

This opt-in integration exercises Wallet Platform's PoX-5 build and signing
paths rather than the controlled fake-stake builder. Hot wallets use the
Staking Service request flow and sign the ready PSBT through the BitGo wallet
API. Custodial wallets use the Wallet Platform `tx/initiate` flow and inspect
the unsigned PSBT in its pending approval. Custodial HSM signing occurs after
approval, which this no-broadcast test deliberately rejects rather than
approving. Both modes check the P2WSH lockup output and paired descriptor wallet.

The test is guarded by `POX5_ENABLE_LIVE_WP_SIGNING=1`. It uses a dedicated hot
or custodial on-chain wallet; if the matching labeled wallet is missing, it
creates one. If the wallet has no sufficiently large confirmed input, the test
requests test BTC from the selected Hiro faucet. Wallet creation, faucet
funding, and paired wallet creation remain in the BitGo test/staging account
after the test. No stake is broadcast, but cleanup failures can leave a pending
staking request or approval; the request/approval ID is printed for inspection.

`POX5_WP_SIGN_WALLET_TYPE` selects `hot` (the default) or `custodial`. The hot
path creates a Staking Service request and signs its ready PSBT through the BitGo
wallet API. It requires an allowlisted `POX5_STX_WALLET_ID`, bond index, signer
manager, and a wallet passphrase. The custodial path calls Wallet Platform's
`tx/initiate` flow with UTXO `stakingParams`, checks the unsigned PSBT and
`awaitingSignature` state in the resulting pending approval, then rejects it
without broadcasting. That path does not require the Stacks wallet ID, bond
index, signer manager, or a wallet passphrase. Both paths verify paired-wallet
descriptor persistence.

For failure diagnosis, run the opt-in test with
`DEBUG=bitgo:v2:stakingWallet`. This dumps prebuild and signed transaction
payloads, including PSBT hex and signatures. Treat the output as sensitive and
keep it local. The harness reports the failing outer stage and keeps the
original stack frames while redacting the configured API token and wallet
passphrase. Set `POX5_WP_SIGN_WALLET_ID` to pin the exact main wallet; the wallet
type must match `POX5_WP_SIGN_WALLET_TYPE`. When `POX5_BITGO_ENTERPRISE_ID` is
also set, the harness verifies the wallet belongs to that enterprise. A local
`.env` file supplies defaults without overriding values explicitly passed in
the process environment.

For hot-wallet mode, set an explicit bond index and signer manager for the
selected deployment. Bond index zero is valid. The test uses
`BITGO_WALLET_PASSPHRASE` and the token matching `POX5_BITGO_API_ENV` (`staging`
by default):

```bash
export POX5_NETWORK=tbtcstxprivate1
export POX5_BITGO_API_ENV=staging
export POX5_ENABLE_LIVE_WP_SIGNING=1
export POX5_WP_SIGN_WALLET_TYPE=hot
export POX5_BOND_INDEX=0
export POX5_SIGNER_MANAGER='<deployed signer-manager principal>'
export BITGO_WALLET_PASSPHRASE
# Export BITGO_TOKEN_STAGING from your secret store.
yarn --cwd modules/utxo-pox5 integration-test:pox5:bitgo-api:wp-sign
```

To exercise the custodial initiate path, set
`POX5_WP_SIGN_WALLET_TYPE=custodial`; the test creates or selects a custodial
on-chain wallet and does not need the hot-wallet passphrase or Stacks bond
settings:

```bash
export POX5_NETWORK=tbtcstxprivate1
export POX5_BITGO_API_ENV=staging
export POX5_ENABLE_LIVE_WP_SIGNING=1
export POX5_WP_SIGN_WALLET_TYPE=custodial
# Export BITGO_TOKEN_STAGING from your secret store.
yarn --cwd modules/utxo-pox5 integration-test:pox5:bitgo-api:wp-sign
```

The hot path covers Staking Service request creation; the custodial path covers
Wallet Platform transaction initiation. Neither path broadcasts BTC or
registers a stake on Stacks. The fake-stake test separately covers live Bitcoin
broadcast, confirmation, and recovery; the standalone Stacks registration
scenario remains separate.

## Dedicated Live Matrix (BTC Only)

`integration-test:pox5:live-matrix` is a separate **broadcasting** command. It
does not run from `unit-test` or the local protocol harness. By default it
attempts all 12 `test|staging` x `tbtcstx|tbtcstxprivate1|tbtcstxsignet` x
`hot|custodial` cells, with six independently reported operations per cell:
fresh wallet creation, faucet deposit plus chain confirmation and BitGo
indexing, paired-wallet BTC stake, paired-wallet post-CLTV recovery,
standalone descriptor BTC lock, and standalone post-CLTV HSM-style recovery.
The last two operations have **no paired-wallet pointer or Staking Service
request**. No operation registers a bond on Stacks; BTC lockup is not evidence
of a `register-for-bond` call or membership.

The matrix operation names are `pairedPostCltvRecovery` and
`standalonePostCltvRecovery`; neither runs the early-exit branch. The separate
`bitgo-api:fake-stake` diagnostic uses an **early exit** with a preimage and
early-exit-key signature plus wallet signatures. Its BTC-only result must not
be counted as a post-CLTV matrix recovery. Early exit is follow-up coverage,
not part of the six required operations per cell; staging HSM currently
rejects its half-signed PSBT, so a successful early-exit sweep is not claimed.

Configure distinct `BITGO_TOKEN_TEST` and `BITGO_TOKEN_STAGING`,
`POX5_LIVE_ENTERPRISE_TEST` and `_STAGING`, separate
`BITGO_APPROVER_TOKEN_TEST` and `_STAGING`. No OTP or passphrase is committed:
set `BITGO_TEST_OTP` (the test-environment OTP from your secret store), which
is used for the SDK unlock and the Wallet Platform pending-approval code;
`POX5_LIVE_UNLOCK_OTP_TEST` / `_STAGING` and `POX5_LIVE_APPROVER_OTP_TEST` /
`_STAGING` override either one. A separate approver token is still required. Also configure optional stable overrides
for `POX5_LIVE_RECOVERY_SEED_TEST` and
`_STAGING` (at least 16 characters). For a fresh dedicated wallet, recovery
material defaults to the effective hot-wallet passphrase; an override must
remain stable when reusing descriptors. Set `BITGO_WALLET_PASSPHRASE_TEST` or
`_STAGING` to use a different passphrase per environment.
The approver must be a **different authenticated user** from the initiator. The
test/staging initiating and approver SDK sessions use `/user/me` and unlock
with the unlock OTP. The approval OTP is sent to the Wallet Platform
pending-approval endpoint; its override changes only that approval code, not the
SDK unlock code.

Set `POX5_LIVE_ENTERPRISE_STAGING` explicitly for staging. The runner checks the
configured enterprise against the selected coin's accessible enterprise list
before creating a wallet; it blocks rather than using an inaccessible generic
enterprise fallback.

For custodial paired-stake runs, if the approver is not an enterprise member,
the harness creates a V2 enterprise invitation with no permission field and
accepts it using the approver token and the approval OTP. The accepted
membership is verified as `permissions: []` before continuing. BitGo may send its
standard enterprise-invitation email, but no UI acceptance is required. The harness then
creates a wallet share for the dedicated custodial wallet with `admin,view`
only, skips keychain sharing and email, accepts the share through the approver
token, and verifies wallet access before initiating a transaction. This adds no
enterprise admin permission and grants no `spend` key material. Invite and share
approval IDs are checkpointed for interrupted-run reconciliation.

Creating the V2 enterprise invite requires the initiator to be an enterprise
admin or organization service user and its access token to include
`user_manage` or `enterprise_manage_all`. The approver token is used only to
accept the no-permission invitation and the wallet share. UMS-managed
enterprises reject this V2 invite path; adding users there requires the UMS
organization API and an organization admin/service-user role.

Provision the dedicated staging signet custodial wallet and approver access
without funding or initiating a transaction:

```sh
fnm exec --using=22.22.0 yarn --cwd modules/utxo-pox5 integration-test:pox5:provision-approver \
  --environment staging --create-enterprise --create-wallet \
  --report /tmp/kilo/pox5-live-staging-signet-custodial-approver-provision.json
```

The provisioning-only command loads the local `.env`, refuses to overwrite an
existing report, and only creates the enterprise or wallet when the corresponding
flag is supplied. `--create-enterprise` saves the returned ID as
`POX5_LIVE_ENTERPRISE_STAGING` in the local `.env`; omit that flag on subsequent
runs. It checks custodial-wallet capability and blocks if the enterprise is not
licensed for custodial wallets; it does not change enterprise entitlements. It
never funds, builds, signs, or broadcasts a transaction.
An account that cannot unlock is not approved by assumption. Do not put real
secrets in `.env.example`, terminal logs, reports, or Linear comments.

Set **all** `POX5_LIVE_*` safety caps from `.env.example` in the command's
environment, including stake sats, maximum stake/faucet/recovery sats,
maximum fee, fee rate, maximum future lock blocks, bounded confirmation
timeout, and pace. For `tbtcstxsignet`, set the confirmation timeout to at least
`7200000` ms (2 h). Since the 2026-10 chain reset the staking signet currently
produces blocks on a ~2-minute cadence (pre-reset docs assumed ~10 minutes);
that pace holds only until the first 2016-block difficulty adjustment, so 2 h
covers both regimes. Build the pinned `stacks.js-pox5` checkout and set
`STACKS_JS_ROOT` or `POX5_STACKS_BITCOIN_STAKING_MODULE`. Set
`POX5_LIVE_BOND_INDEX_<COIN>` to pin a bond, or leave it unset to discover the
single open bond the staker is allowlisted for (`POX5_STACKS_STAKER_ADDRESS`,
`POX5_LIVE_STAKE_SATS`); see `modules/utxo-pox5/README.md#bond-index`. The runner
reads the PoX-5 contract's `get-bond-l1-unlock-height`, checks the bond is open,
checks Stacks chain ID and burnchain tip against its **network-matched BTC
tip**, and enforces the configured future-duration cap. It never uses
`latestBlockHeight + 1` as a live bond locktime. No default or fabricated
bond is substituted; if discovery finds zero or several candidates, the run is
`NOT_READY`.

For a fresh paired staking wallet, the descriptor index defaults to 0; the
runner verifies the resulting output script against that descriptor index
before broadcasting. Override with
`POX5_LIVE_PAIRED_DESCRIPTOR_INDEX_<ENV>_<COIN>_<TYPE>` only when reusing a
fixture with a nonzero paired lockup index.
To reuse existing confirmed BTC in a dedicated fixture wallet, pin the exact
`POX5_LIVE_PAIRED_INPUT_OUTPOINT_<ENV>_<COIN>_<TYPE>` or
`POX5_LIVE_STANDALONE_INPUT_OUTPOINT_<ENV>_<COIN>_<TYPE>`. Without a pinned
input, the runner requests a new faucet deposit into that dedicated wallet
and may only spend the exact indexed outpoint from that deposit; it never
selects another unspent from the wallet.
Post-CLTV recovery requires a **separate, pre-existing** confirmed fixture.
Configure `POX5_LIVE_PAIRED_RECOVERY_OUTPOINT_<ENV>_<COIN>_<TYPE>`; its
descriptor name and derivation index are discovered from the confirmed BitGo
unspent and cross-checked with `getAddress`. An optional
`POX5_LIVE_PAIRED_RECOVERY_DESCRIPTOR_INDEX_<ENV>_<COIN>_<TYPE>` is an
assertion against that discovered index. Standalone recovery requires
`POX5_LIVE_STANDALONE_DESCRIPTOR_WALLET_ID_<ENV>_<COIN>_<TYPE>`,
`POX5_LIVE_STANDALONE_RECOVERY_OUTPOINT_<ENV>_<COIN>_<TYPE>`, and
`POX5_LIVE_STANDALONE_RECOVERY_UNLOCK_HEIGHT_<ENV>_<COIN>_<TYPE>`.
Both paths verify the actual indexed descriptor, ownership, maturity,
outpoint, transaction shape, destination and fee before spending. A newly
created bond lockup is not expected to mature during this run. Keep original
recovery seeds available for previously provisioned descriptors.

```bash
# Export the secrets, enterprise IDs, safety caps, network bond IDs and fixture
# identifiers from a controlled environment before running this command.
export POX5_LIVE_REPORT=/tmp/kilo/pox5-live-controlled.json
yarn --cwd modules/utxo-pox5 integration-test:pox5:live-matrix

# Explicitly restrict scope or resume a previously written report:
yarn --cwd modules/utxo-pox5 integration-test:pox5:live-matrix --environment test --coin tbtcstx --wallet-type hot --report /tmp/kilo/pox5-live-controlled.json

# Run only the bond-aware paired BTC lockup operation; it may fund the dedicated
# stake wallet and broadcast one BTC lock. It does not run early exit or recovery.
POX5_LIVE_BOND_INDEX_TBTCSTXSIGNET=325 yarn --cwd modules/utxo-pox5 integration-test:pox5:live-matrix --environment staging --coin tbtcstxsignet --wallet-type hot --operation pairedStake --report /tmp/kilo/pox5-live-signet-stake.json
```

Repeat `--operation` to select multiple rows. In explicit operation mode the
command returns nonzero unless every selected cell passes; unselected matrix
rows are not created or counted. Verify the bond remains open immediately
before an authorized broadcast. Bond 325 was discovered open on Hiro signet on
2026-10-09, with L1 unlock height 13510 at BTC tip 13264; the index and unlock
height are re-read from chain when the operation runs.

The command requires a stable `POX5_LIVE_REPORT` or `--report` path so that
rerunning the command cannot silently create a new attempt. It prints the
path before any network writes and creates its parent directory when needed;
the sanitized JSON file is mode `0600`. A named report allows inspecting a partial attempt; completed
operations are never rerun, and interrupted operations become `BLOCKED`
until their wallet/request/approval/tx IDs are **manually reconciled**. The
report stores IDs, labels, heights, satoshi amounts and status, never raw SDK
objects, passphrases, signatures or preimages. Use a new report after
reconciliation; wallet fixtures have environment/coin/type-scoped labels.
Creation uses a separate per-run label and only passes if a new wallet was
created. Reusing a dedicated staking fixture never counts as create coverage.
Funding never chooses an arbitrary accessible wallet.

`PASS`, `FAIL`, `NOT_READY`, `BLOCKED`, and `UNSUPPORTED` are separate
outcomes. A verified missing optional fixture or unopened bond is
`NOT_READY`; missing mandatory credentials, missing separate approver, a
failed attempted operation, an interrupted broadcast, or unsupported
signing/chain paths leave a nonzero strict result. Custodial standalone
descriptor signing currently returns `UNSUPPORTED`, not a fake pass. Custodial
paired post-CLTV recovery initiates the exit on the paired custodial descriptor
wallet, inspects the pending-approval PSBT (same checks as the hot path),
checkpoints the approval ID and approves it as the distinct approver; it then
ends `BLOCKED` while the approval awaits the offline BitGo Trust signature
(OVC), because the harness never fakes that signature. The awaiting-signature
approval is the late-exit export to feed OVC. With the flags below the harness
can sign that export with the real OVC code and, behind a second flag, upload
it; the recovery cell only offers the upload once the tip is at or above the
descriptor CLTV height, keeping the exit broadcast final. **`tbtcstxsignet` is Hiro's independent
staking-testnet signet**, not public Bitcoin signet and not Hiro regtest. Its
faucet, Bitcoin explorer (`https://mempool.bitcoin.staking-testnet.hiro.so/api`),
and `tstxsignet` Stacks API share that independent chain. The runner checks a
pinned height-100 Bitcoin block hash and the Stacks burnchain tip before a
bond-dependent write. Public signet can share address encoding and genesis
without being the same chain; `mempool.space/signet` is deliberately excluded.

### Custodial offline signing via OVC (`POX5_LIVE_OVC_*`)

Custodial approvals wait in `awaitingSignature` for the BitGo Trust user-key
signature. By default the matrix ends that cell `BLOCKED`, leaving the approval
as the export to sign in the real Offline Vault Console. Two opt-in flags drive
the loop with the real OVC signing code instead:

- `POX5_LIVE_OVC_SIGN=true` — after the policy authorization the harness fetches
  the awaiting-signature export, spawns the OVC `sign-export` CLI against it, and
  cross-checks the CLI result against the inspected PSBT: same pending approval,
  the expected recipient and amount, the inspected fee and locktime, an
  unchanged unsigned transaction id, and a user signature present. The cell then
  still ends `BLOCKED` (signed, not uploaded) with `signedWith: OVC` in the
  evidence.
- `POX5_LIVE_OVC_UPLOAD=true` (implies `SIGN`) — the harness uploads the
  half-signed transaction via the **custodyadmin** session and the cell proceeds
  through the normal confirmation and indexing checks.

Actor split (verified on the test env): the upload is itself an approve
resolution, and Wallet Platform allows one resolution per user, so the policy
approver cannot upload their own authorization (`cannot approve an action
multiple times`). The harness therefore uploads as `custodyadmin@test.bitgo.com`,
mirroring the BitGo Trust operational split. Configure in
`test-env.config.json` under `users.custodyadmin` and create the session with
the same `bitgo-http login` flow as the other users; a missing or expired
custodyadmin session leaves the upload `BLOCKED` and never breaks sign-only runs.

Runner configuration (no OVC checkout is needed for the unit tests; they use a
fake runner):

- `POX5_OVC_DIR` — path to the offline-vault-console checkout (repo root) that
  includes the `sign-export` CLI
- `POX5_OVC_COMMAND` — optional runner prefix; the harness appends
  `sign-export <mode> ...` (default `yarn`, e.g. `fnm exec --using=24.15.0 yarn`)
- `POX5_OVC_KEY_FILE` — optional key file override (defaults to the OVC test
  custody key, which derives the real test-env custodial user key)
- `POX5_OVC_KEY_PASSWORD` — the OVC test custody key password; handed to the
  CLI through its environment, never through argv
- `POX5_OVC_TIMEOUT_MS` — spawn timeout (default 120000)

CLI exit codes map to matrix outcomes: input-shape and OVC policy refusals
(exit 2/3) are `FAIL`s; key/password errors, refused environments, runner
problems and timeouts (exit 4/5) are `BLOCKED` prerequisites. All error text is
redacted against the configured secrets.

Track the 12-cell run, fixture blockers and sanitized artifact summary in
[WAL-2144](https://linear.app/bitgo/issue/WAL-2144/validate-live-pox-5-btc-staking-and-recovery-matrix-across-bitgo).
The dedicated matrix command has not run. Targeted staging BTC-only tests ran
separately; their early-exit failure did not produce a recovery transaction.

## Test environment config (`test-env.config.json`)

`test-env.config.json` is the source of truth for the BitGo **test** environment
custodial run. It holds non-secret identifiers only: the enterprise, the initiator
and approver usernames and user IDs, the custodial wallet (`label` and `id`), and
the staker address. `loadLocalPox5Environment()` reads it and overlays these keys
on the environment (after `.env`):

- `POX5_LIVE_ENTERPRISE_TEST` from `enterprise.id`
- `BITGO_TOKEN_TEST` and `BITGO_APPROVER_TOKEN_TEST` from the users' session files
- `BITGO_CUSTODYADMIN_TOKEN_TEST` from the optional `custodyadmin` user's session
  file (omitted when absent, which leaves the opt-in OVC upload `BLOCKED`)
- `POX5_LIVE_APPROVER_USERNAME_TEST`, `POX5_LIVE_APPROVER_USER_ID_TEST`, and `POX5_LIVE_INITIATOR_USER_ID_TEST`
- `POX5_STACKS_STAKER_ADDRESS` from `staker.address`

Sessions are created by the standalone `bitgo-http` CLI (`~/src/BitGo/bitgo-http`, no bgadmin
dependency) with `BITGO_PASSWORD` set in the environment, for example:

```bash
BITGO_PASSWORD='...' bitgo-http login --env test --username test-user+1@test.bitgo.com --otp "$BITGO_TEST_OTP"
bitgo-http sessions
```

It saves sessions under `~/.local/state/bitgo-http/sessions` (override with `BITGO_SESSION_DIR`), which is
the `sessionDir` in `test-env.config.json`. If your shell has both `--use-openssl-ca` in `NODE_OPTIONS`
and `NODE_USE_SYSTEM_CA` set, Node 24.22 refuses to start; run `env -u NODE_USE_SYSTEM_CA bitgo-http ...`.

The test users are the seeded accounts described in the Confluence page
"Test users and wallets" (ENG space). Its credentials are not copied here; use the
password from that page as `BITGO_PASSWORD` for each login.

The loader refuses sessions that are missing, invalid, or expire within five
minutes, and says which login to rerun. The custodial stake wallet is found by the
dedicated label `pox5-live-test-tbtcstxsignet-custodial-stake` in the configured
enterprise, so the run uses the pinned wallet. The `staging` path still reads `.env`.

### Funding order for stake and standalone runs

1. `POX5_LIVE_PAIRED_INPUT_OUTPOINT_<ENV>_<COIN>_<TYPE>` (or `STANDALONE_INPUT_OUTPOINT_...`), if set. It must be usable or the run stops.
2. The smallest confirmed unspent on the dedicated wallet that covers the stake plus the fee cap.
3. A new faucet deposit, only when neither exists.

The report records `fundingSource` as `PINNED`, `EXISTING`, or `FAUCET`.
