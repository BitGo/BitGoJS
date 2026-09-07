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

The opt-in Mocha test lists wallets for `POX5_NETWORK`, creates a hot,
fixed-script wallet if none are eligible, selects an existing wallet at random,
requests BTC from the matching Hiro faucet, and waits for both chain confirmation
and the output to appear in BitGo wallet unspents. It only receives funds; it
does not sign or submit a wallet transaction or call Stacks APIs. It unlocks the
test/staging BitGo session with the seven-zero test OTP before wallet operations.

Set `POX5_NETWORK` to `tbtcstx` or `tbtcstxprivate1` to select the BitGo coin and
Hiro endpoints. `POX5_BITGO_API_ENV` selects BitGo `test` or `staging` and
defaults to `staging`; export the corresponding `BITGO_TOKEN_TEST` or
`BITGO_TOKEN_STAGING`. If no eligible wallet exists, the test also requires
`BITGO_WALLET_PASSPHRASE`. A sole accessible enterprise is selected
automatically; if the user has multiple accessible enterprises, set
`POX5_BITGO_ENTERPRISE_ID` to choose one.

Run this separately from `unit-test`; it performs remote wallet/address and
faucet operations and leaves the wallet and faucet deposit in place:

```bash
export POX5_NETWORK=tbtcstxprivate1
export POX5_BITGO_API_ENV=staging
# Export BITGO_TOKEN_STAGING from your secret store.
yarn --cwd modules/utxo-pox5 integration-test:pox5:bitgo-api:fund
```

`POX5_NETWORK=local` is rejected because the local profile has no Hiro faucet.

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
otherwise set `POX5_BITGO_ENTERPRISE_ID`. `BITGO_WALLET_PASSPHRASE` defaults to
the disposable test phrase `too many secrets` and can be set to use a dedicated
wallet passphrase.

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
deterministically from `BITGO_WALLET_PASSPHRASE` (defaulting to the
disposable `too many secrets`), the BitGo environment, and the coin; set
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
