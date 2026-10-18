# Canton CCIP bridge examples (USD1, EVM ↔ Canton)

Client-side examples for the USD1 CCIP bridge lanes on BitGo Canton wallets,
built entirely on the standard `wallet.sendMany({ type: 'cantonCommand' })`
flow. They work for custodial wallets (access token only) and hot wallets
(token + wallet passphrase); no `unlock()` is needed for either.

- `executeCcipMessage.js` — inbound lane (Sepolia/Ethereum → Canton). Decodes
  `CCIPMessageSent` from the source-chain receipt, fetches verifier proofs from
  the CCIP indexer and disclosure blobs from the public EDS endpoints, then
  triggers the Canton-side `Execute` as the receiving wallet party.
- `sendCcipMessage.js` — outbound lane (Canton → Sepolia/Ethereum). Fetches the
  EDS send disclosures and submits the `Send` choice with explicit fee/token
  holding contract ids.

## What the platform resolves vs. what the client fetches

| Concern | Owner |
| --- | --- |
| `PerPartyRouterFactory` contract id (first-run `CreateRouter`) | IMS (EDS disclosure — the factory is ccipOwner-owned and invisible to the wallet party's ACS) |
| Wallet party's `CCIPReceiver` (payload-aware by `receiverFinalityConfig`) and `PerPartyRouter` (`routerCid`) | IMS (`resolveContracts` + `injectAs`) |
| `feeTokenInput.feeTokenTransferFactory` (outbound fee preview) | IMS (must be computed as the wallet party by the hosting validator's transfer-instruction API; clients cannot authenticate for custodial wallets) |
| Encoded message, CCV verifier results, EDS disclosure blobs | Client (public services) — blobs are passed back via `cantonCommandParams.disclosedContracts` |
| Holding selection and double-spend protection (withdrawal lock, `lockedUtxos`) | wallet-platform (Send is UTXO-consuming; pass `--tokenName`) |

## Wallet party onboarding prerequisites

Each custodial party must satisfy **all three** before bridging funds; missing
any of them surfaces as a cryptic mid-flow ledger error:

1. **Party-to-participant domain hosting** — an active PartyToParticipant
   mapping on the `global-domain`, activated by the validator admin. Without it
   Canton rejects submission with
   `NO_SYNCHRONIZER_ON_WHICH_ALL_SUBMITTERS_CAN_SUBMIT`.
2. **CCIP package vetting by ALL hosting participants** — the CCIP packages
   (`ccip-receiver-v2`, `ccip-runtime-v2`, `ccip-sender-v2`) must be
   consistently vetted by every participant hosting the party. Otherwise:
   `JSON_API_PACKAGE_SELECTION_FAILED: No package with package-name … is
   consistently vetted by all hosting participants of party …`.
3. **JSON-API user rights** — `CanActAs` on the exact party string for the app
   user performing submissions, plus `CanReadAs` on the USD1 registrar for
   pool/TAR visibility.

A party-preflight API returning
`{ isLocal, domainHostingActive, ccipPackagesVetted, canActAs }` in one call is
the tracked product follow-up so onboarding can catch all three states before a
client bridges funds.

## Usage

Run from `modules/bitgo` after `yarn install`:

```bash
# inbound: trigger Execute for an attested Sepolia→Canton message
node ../../examples/js/canton/executeCcipMessage.js \
  --accessToken=$ACCESS_TOKEN --wallet=<wallet id> \
  --txHash=0x<sepolia tx> [--env=prod] [--skipSetup] [--dryRun]

# outbound: send USD1 from Canton to an EVM address
node ../../examples/js/canton/sendCcipMessage.js \
  --accessToken=$ACCESS_TOKEN --wallet=<wallet id> \
  --amount=1 --evmReceiver=0x… --tokenName=tcanton:usd1 \
  --tokenHoldingCid=00… --feeHoldingCid=00… [--feeToken=amulet|link] [--dryRun]
```

Both scripts support `--dryRun` to print the fully assembled
`cantonCommandParams` without submitting, and `--skipSetup` after the one-time
router/receiver/sender creation. Setup steps halt on a pending approval —
approve it in the BitGo UI/API, then rerun with `--skipSetup`.

### Receiver finality (inbound)

Each `finality` value needs its own `CCIPReceiver` instance
(`OffRamp.PrepareExecute` rejects mismatches). The script selects the receiver
payload-aware via `createArgumentFilter.receiverFinalityConfig` using the
message's finality from the verifier result; when the result carries no
finality, pass `--finality=0|65536|<block depth>` explicitly, or pass
`--receiverCid` for an existing receiver (pairs with `--skipSetup`).

## Known follow-ups

- Production lane constants (`LANES.prod`) still need verification against the
  production starter-kit configuration before production enablement.
- Automatic unspent selection for outbound fee/token holdings (today:
  `--tokenHoldingCid` / `--feeHoldingCid` explicit).
- Party preflight API (see onboarding prerequisites above).
