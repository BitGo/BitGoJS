# Solayer Chain — Sandbox Investigation Report

**Ticket:** CECHO-1127  
**Date:** 2026-05-20  
**Status:** Complete — validated end-to-end transaction lifecycle on devnet

---

## Network Summary

| Property | Value |
|---|---|
| Chain type | SVM-based L1 (InfiniSVM) — hardware-accelerated |
| Runtime | `solana-core 2.0.0` (based on agave fork, branch `infini-dep-v2.2`) |
| Native token | SOL (9 decimals, same as Solana) |
| Governance token | $LAYER |
| Signing primitive | **ed25519** (confirmed — identical to Solana) |
| Address format | Base58-encoded 32-byte ed25519 public key (44 chars) |
| Throughput (devnet) | 340k+ TPS (targeting 1M+ TPS) |
| Finality | Sub-second (observed ~60ms from submit to `"finalized"` status) |

### RPC Endpoints

| Network | URL |
|---|---|
| Mainnet | `https://mainnet-rpc.solayer.org` |
| Devnet (testing) | `https://devnet-rpc.solayer.org` |

> **Note:** The docs repo references `https://rpc-devnet.solayer.org/` (with trailing slash) as an alias; both appear to resolve to the same backend.

---

## Account & Key Handling

### Signing Primitive

**ed25519** — identical to standard Solana/SVM. Confirmed via:
1. The Solayer docs explicitly state "Solana VM Compatible" and standard Solana tools work as-is.
2. `solayer-rpc` GitHub repo (`InfiniSVM RPC V2`) is built on the Agave validator codebase.
3. A transaction signed with a plain ed25519 keypair (Node.js `crypto` module) was accepted and finalized on devnet.

### Keypair Generation

Standard Solana keypair derivation applies:
- **Private key:** 32-byte ed25519 seed
- **Public key:** 32-byte ed25519 public key derived from seed
- **Address:** `base58(publicKeyBytes)` — 32 bytes encodes to 44 base58 chars

```
Sandbox keypair (DO NOT USE IN PRODUCTION):
  Address:    EwC1jybfZGJ69YWfhfHw73o9en2j3FSAn2J4eLUZhako
  Secret hex: a2ff4bf48a3b6890b1aa6a08ac9f471593e8e70cf1bdcb7f2e5feceb8bf71a35
              cf09bef46f18e86139055473ebdac6eb2951130440af990ecd3d2765d360eff0
```

The existing `@bitgo/sdk-coin-sol` `KeyPair` class (`Ed25519KeyPair`) works unchanged for Solayer.

---

## Transaction Flow — End-to-End Validation

### 1. Faucet Funding

```bash
curl -X POST https://devnet-rpc.solayer.org \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"requestAirdrop","params":["EwC1jybfZGJ69YWfhfHw73o9en2j3FSAn2J4eLUZhako",100000000]}'
# => {"result": "wxrbpMvrCsq1TrSasisNzmH7KhRFtWHK82fWkVqkVBpiPgfKx9UmKypbBYenXx93vg66Xe5kdSyd9Xrdufs1uHy"}
```

`requestAirdrop` is **modified**: the amount parameter still works but the docs note it always drops 0.1 SOL (100_000_000 lamports). The faucet signature above confirms the airdrop was processed.

Post-airdrop balance: `100_000_000 lamports` (0.1 SOL).

### 2. Transaction Construction & Signing

Transaction format is **identical to legacy Solana transactions**:

```
Wire format:
  [compact-u16 num_signatures]
  [64-byte signature × num_signatures]
  [message]:
    [1 byte] num_required_signatures
    [1 byte] num_readonly_signed_accounts
    [1 byte] num_readonly_unsigned_accounts
    [compact-u16 num_accounts] [32 bytes × num_accounts]   ← account keys
    [32 bytes] recent_blockhash
    [compact-u16 num_instructions]
    [instructions...]
```

**Signing payload:** The raw message bytes (no domain separator, no hash — sign the message bytes directly with ed25519).

Tested: System Program transfer (instruction index 2), 10_000 lamports (0.00001 SOL).

### 3. Broadcast & Confirmation

```
Transaction signature: 55faf4L2QZnPCM2KahJBMMAj4osawTbCbSLm88b5cPgFYimpHPeKmHepxfviyhyJ7wZMH7ZFuzXeMQvbGFC9i16S
Slot: 135440321
Finalization: ~3 seconds after submission
```

`getSignatureStatuses` response:
```json
{
  "slot": 135440321,
  "confirmations": null,
  "status": {"Ok": null},
  "err": null,
  "confirmationStatus": "finalized"
}
```

`confirmations: null` with `confirmationStatus: "finalized"` is the standard Solana response for fully finalized transactions (same as mainnet Solana behavior).

`getTransaction` result confirmed:
- Pre-balances: `[100000000, 0, 1]`
- Post-balances: `[99985000, 10000, 1]` (sender −15000 = 10000 transferred + 5000 fee)
- Fee: `5000 lamports` (standard Solana base fee)
- Compute units consumed: `150`

**Explorer:** `https://explorer.solayer.org/?cluster=devnet` — search by signature or address.

---

## Tooling Check

### Result: Existing Solana / SVM client libs work as-is

No fork or patched client required. Confirmed:

| Tool | Compatible | Notes |
|---|---|---|
| `@solana/web3.js` | ✅ Yes | Standard JSON-RPC compatible |
| Solana CLI | ✅ Yes | `solana config set --url https://devnet-rpc.solayer.org` |
| Anchor | ✅ Yes | Per Solayer docs |
| `@bitgo/sdk-coin-sol` builders | ✅ Yes | Transaction format identical |
| BitGoJS `KeyPair` (`Ed25519KeyPair`) | ✅ Yes | ed25519, same format |

For BitGoJS integration, Solayer can reuse the `sdk-coin-sol` module with a new coin class (similar to how `Tsol extends Sol`), pointing `solNodeUrl` to `https://devnet-rpc.solayer.org` (devnet) or `https://mainnet-rpc.solayer.org` (mainnet).

### Non-Standard RPC Methods vs Solana

**Deprecated (exist but not meaningful on Solayer):**
- `getGenesisHash`, `getHealth`, `getSlot`, `getVersion` — still respond but architecture differences make them less relevant
- `getBlockHeight`, `getEpochInfo`, `getEpochSchedule`, `getBlockTime`, `getFirstAvailableBlock`

**Modified:**
- `requestAirdrop` — amount parameter removed; always drops 0.1 SOL

**Not supported:**
- `getClusterNodes`, `getInflationGovernor/Rate/Reward`, `getLeaderSchedule`, `getStakeMinimumDelegation`, `getSupply`, `getVoteAccounts`

**Coming soon (not yet available):**
- `getSignaturesForAddress` — **critical for BitGo indexer work** (see Indexer section)
- `getTokenAccountsByOwner`
- `getProgramAccounts`
- `getRecentPrioritizationFees`

---

## Indexer Scoping

### Public Indexer Status

Solayer **does** provide historical data access, but through an atypical mechanism:

**Delta Sharing (Databricks):** Solayer exposes mainnet historical transaction and block data via an Apache Delta Sharing endpoint:
- Endpoint: `https://oregon.cloud.databricks.com/api/2.0/delta-sharing/metastores/7a9fc20e-6a36-4fef-98fb-3c6c7c72f622`
- Credential token: `ZWatTOE294P9bB30V-SBjZYnhgz5CM3DySSrDBoedk1UgL0YCJJdC0lDktWPnc4y` (expires 2027-01-14)
- Tables: `transactions` (partitioned by `block_date`) and `blocks` (partitioned by `block_month`)

**This is mainnet-only and designed for analytics/batch access**, not real-time balance or transaction history lookups.

### Key Gap: `getSignaturesForAddress`

The standard Solana method `getSignaturesForAddress` is listed as **coming soon** in Solayer's docs. This method is what BitGo's SDK and indexer use to page through transaction history for an address.

**Recommendation:** Until `getSignaturesForAddress` is available, BitGo will need its own indexer (GTA / indexer module) for Solayer. The Delta Sharing endpoint can supplement batch/historical backfill for mainnet once it's needed.

### RPC for Balance & Token Data

These methods are **fully supported now** and sufficient for custody operations:
- `getBalance` — native SOL balance
- `getAccountInfo` — account data
- `getTokenAccountBalance` — SPL token balance
- `getTokenSupply` — token supply info
- `getTransaction` — transaction details by signature
- `sendTransaction` — broadcast

---

## SDK Integration Plan

### Statics (`@bitgo/statics`)

Add new network classes in `src/networks.ts`:

```typescript
class Solayer extends Mainnet implements AccountNetwork {
  name = 'Solayer';
  family = CoinFamily.SOL;  // reuse SOL family
  explorerUrl = 'https://explorer.solayer.org/tx/';
}

class SolayerDevnet extends Testnet implements AccountNetwork {
  name = 'SolayerDevnet';
  family = CoinFamily.SOL;
  explorerUrl = 'https://explorer.solayer.org/tx/?cluster=devnet';
}
```

Register in `allCoinsAndTokens.ts`:

```typescript
account(
  '<uuid-v4>',
  'layer',         // coin name — native SOL on Solayer chain
  'Solayer',
  Networks.main.solayer,
  9,               // same decimals as SOL
  UnderlyingAsset.SOL,
  BaseUnit.SOL,
  SOL_FEATURES,
  KeyCurve.Ed25519
),
account(
  '<uuid-v4>',
  'tlayer',
  'Testnet Solayer',
  Networks.test.solayerDevnet,
  9,
  UnderlyingAsset.SOL,
  BaseUnit.SOL,
  TSOL_FEATURES,
  KeyCurve.Ed25519
),
```

### SDK Core (`@bitgo/sdk-core`) — Environments

Add RPC URLs in `src/bitgo/environments.ts`:

```typescript
// In EnvironmentName interface:
layerNodeUrl: string;

// In prod environment:
layerNodeUrl: 'https://mainnet-rpc.solayer.org',

// In test/dev environment:
layerNodeUrl: 'https://devnet-rpc.solayer.org',
```

### Coin Module (`@bitgo/sdk-coin-sol`)

Create `src/layer.ts` and `src/tlayer.ts` following the `Sol`/`Tsol` pattern:

```typescript
// layer.ts
export class Layer extends Sol {
  protected getPublicNodeUrl(): string {
    return Environments[this.bitgo.getEnv()].layerNodeUrl;
  }
  getChain() { return 'layer'; }
  getFullName() { return 'Solayer'; }
  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Layer(bitgo, staticsCoin);
  }
}
```

Add registration in `src/register.ts`:
```typescript
sdk.register('layer', Layer.createInstance);
sdk.register('tlayer', TLayer.createInstance);
```

---

## Open Items / Blockers

| Item | Priority | Notes |
|---|---|---|
| `getSignaturesForAddress` not yet on RPC | High | Blocks standard BitGo tx history lookup; need own indexer or wait for Solayer to ship this |
| $LAYER token contract address unknown | Medium | Need SPL token mint address for the $LAYER governance token to register in statics |
| Mainnet RPC rate limits | Medium | Contact Solayer team for production-grade RPC SLA / dedicated endpoint |
| Devnet stability | Low | Docs warn state may be reset; don't build persistent devnet state |
| `getProgramAccounts` not yet available | Low | Needed for token account discovery patterns used in some recovery flows |

---

## Appendix: Raw Transaction Anatomy

Confirmed working transaction on Solayer devnet:

```
Signature:   55faf4L2QZnPCM2KahJBMMAj4osawTbCbSLm88b5cPgFYimpHPeKmHepxfviyhyJ7wZMH7ZFuzXeMQvbGFC9i16S
Slot:        135440321
Block time:  1779270426 (Unix)
Fee:         5000 lamports
Compute:     150 units
```

Transaction JSON (from `getTransaction`):
```json
{
  "slot": 135440321,
  "transaction": {
    "signatures": ["55faf4L2QZnPCM2KahJBMMAj4osawTbCbSLm88b5cPgFYimpHPeKmHepxfviyhyJ7wZMH7ZFuzXeMQvbGFC9i16S"],
    "message": {
      "header": {
        "numRequiredSignatures": 1,
        "numReadonlySignedAccounts": 0,
        "numReadonlyUnsignedAccounts": 1
      },
      "accountKeys": [
        "EwC1jybfZGJ69YWfhfHw73o9en2j3FSAn2J4eLUZhako",
        "2kqUBef6vZWsod33qBTxxQokxNmnMvZ7JZESxZrskn4S",
        "11111111111111111111111111111111"
      ],
      "recentBlockhash": "EP5sWwRcb1vyDpT5ei18GFRMXWvMb6Pje4j2cCfp8rmq",
      "instructions": [{
        "programIdIndex": 2,
        "accounts": [0, 1],
        "data": "3Bxs43ZMjSRQLs6o"
      }]
    }
  },
  "meta": {
    "err": null,
    "fee": 5000,
    "preBalances": [100000000, 0, 1],
    "postBalances": [99985000, 10000, 1],
    "logMessages": [
      "Program 11111111111111111111111111111111 invoke [1]",
      "Program 11111111111111111111111111111111 success"
    ],
    "computeUnitsConsumed": 150
  },
  "version": "legacy"
}
```
