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
- A funded Stacks account for live registration scenarios. The dashboard can
  derive its first Stacks testnet address from the entered BIP39 phrase; the
  CLI still accepts `POX5_STACKS_STAKER_ADDRESS` and `POX5_STACKS_PRIVATE_KEY`.

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

The yargs-based debugging CLI is available as:

```bash
yarn --cwd modules/utxo-pox5 pox5-debug --help
yarn --cwd modules/utxo-pox5 pox5-debug --network tbtcstxprivate1 status
```

The dashboard defaults to direct mode and can be started with:

```bash
yarn --cwd modules/utxo-pox5 pox5-dashboard
```

Open `http://127.0.0.1:4175`, select a network and `Direct RPC / no
indexer-utxo`, then use **Start fullnode**. The dashboard's Fullnode and Wallet
cards query Bitcoin Core directly; they do not query an indexer API.

The dashboard is split into three pages:

- **Nodes & network**: fullnode lifecycle, Bitcoin Core stats, Stacks node state, and endpoints.
- **Wallets**: development seed phrase, direct BTC wallet address/balance/transactions, and derived STX address/account/transactions.
- **Staked funds**: PoX-5 membership and stake, early-exit, and late-exit controls.

Network and fullnode mode settings are kept on **Nodes & network**. The seed
phrase is kept on **Wallets**, where it controls the derived STX wallet and
staker address.

The Wallets page also provides the `Private-1 public fixture / account5`
preset. It selects the disposable allowlisted account published in the
`stacks.js-pox5` test fixtures without placing its private key in browser
markup. It is only for the shared private-1 testnet and must never be used for
real funds.

The dashboard derives the first Stacks account at
`m/44'/5757'/0'/0/0` using `@bitgo/wasm-utxo` BIP32. Valid BIP39 input is used
unchanged. Other input, including the default `too many secrets`, is normalized,
hashed to 256-bit entropy, and deterministically converted to a 24-word BIP39
mnemonic first. This is convenient for development but does not increase the
security of a low-entropy phrase, so use high-entropy disposable text only. The
phrase is sent only in request bodies and is not persisted, logged, or returned.

Useful debugging commands include:

```bash
yarn --cwd modules/utxo-pox5 pox5-debug --network tbtcstxprivate1 up
yarn --cwd modules/utxo-pox5 pox5-debug --network tbtcstxprivate1 logs --service tbtcstxprivate1-bitcoin
yarn --cwd modules/utxo-pox5 pox5-debug --network tbtcstxprivate1 smoke
yarn --cwd modules/utxo-pox5 pox5-debug --network tbtcstxprivate1 fund
yarn --cwd modules/utxo-pox5 pox5-debug --network tbtcstxprivate1 register
yarn --cwd modules/utxo-pox5 pox5-debug --network tbtcstxprivate1 down --volumes
```

The CLI never prints secret environment values. `mine` is rejected for the
shared Hiro profiles and is available only with `--network local`.

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

For CLI registration, set `POX5_STACKS_PRIVATE_KEY` and
`POX5_STACKS_STAKER_ADDRESS` explicitly. The dashboard derives both from its
request-scoped phrase. The dashboard discovers an allowlisted bond index when
`POX5_BOND_INDEX` is omitted. `tbtcstxprivate1` also defaults to the deployed
shared signer-manager; `tbtcstx` requires its deployment-specific
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

The registration E2E layer now funds a real lock, retrieves its SPV inputs, and
submits `register-for-bond`. Stacks protocol exits remain separate from the
BitGo API BTC-construction commands below.

## BitGo API BTC CLI

The `pox5-debug api` command group exercises BitGo wallet-platform transaction
construction only. It does not call Stacks APIs, require `STACKS_JS_ROOT`, or
announce a Stacks delegation. It is restricted to BitGo `test` and `staging`
environments and defaults to `staging` / `tbtcstxprivate1`.

The API token must already be exported as `BITGO_TOKEN_TEST` or
`BITGO_TOKEN_STAGING`. Wallet passphrases are prompted without echo. The early
exit key and principal preimage are read from regular files with mode `0600`;
they are never accepted inline or printed.

Check auth and discover the selected coin's wallets:

```bash
yarn --cwd modules/utxo-pox5 pox5-debug api auth
yarn --cwd modules/utxo-pox5 pox5-debug api wallet list
```

Create a hot, fixed-script wallet, then build a BTC PoX-5 lockup. The preimage
is hashed locally to form the lockup commitment; no Stacks address or contract
call is involved:

```bash
yarn --cwd modules/utxo-pox5 pox5-debug api wallet create \
  --label pox5-cli-test --enterprise <enterprise-id>
yarn --cwd modules/utxo-pox5 pox5-debug api stake build \
  --wallet-id <wallet-id> --amount-sats 30000 --unlock-height <future-height> \
  --principal-preimage-file /path/to/principal-preimage.hex \
  --early-exit-key-file /path/to/disposable-early-exit-key.wif \
  --build-only --psbt-out /path/to/lockup.psbt
```

Wallet-platform creates and links the paired descriptor wallet during the
staking transaction build. Even `--build-only` makes that wallet-platform
change, but it does not sign or broadcast the BTC transaction. Without
`--build-only`, the CLI displays all outputs and the fee, then requires a
separate confirmation before signing and submitting.

Inspect the fixed-script wallet, paired wallet, and its BTC UTXOs:

```bash
yarn --cwd modules/utxo-pox5 pox5-debug api stake status --wallet-id <wallet-id>
```

Build a post-CLTV recovery for one mature paired-wallet UTXO:

```bash
yarn --cwd modules/utxo-pox5 pox5-debug api exit late \
  --wallet-id <wallet-id> --outpoint <txid:vout> --build-only \
  --psbt-out /path/to/late-exit.psbt
```

Build the BTC early-exit branch using the matching commitment preimage and the
disposable test key:

```bash
yarn --cwd modules/utxo-pox5 pox5-debug api exit early \
  --wallet-id <wallet-id> --outpoint <txid:vout> \
  --principal-preimage-file /path/to/principal-preimage.hex \
  --early-exit-key-file /path/to/disposable-early-exit-key.wif \
  --build-only --psbt-out /path/to/early-exit.psbt
```

Early exit adds the local test-key signature to the wallet-platform PSBT before
the normal fixed-script wallet signing step. Use only disposable test keys and
test wallets. `--yes` is intended only for scripted runs against the supported
test/staging environments. These BTC-side commands construct or submit Bitcoin
transactions; they do not register, announce, or verify a Stacks stake.

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
