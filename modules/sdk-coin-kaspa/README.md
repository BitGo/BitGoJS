# @bitgo/sdk-coin-kaspa

BitGo's SDK module for the **Kaspa (KASPA)** blockchain.

## Overview

Kaspa is a proof-of-work blockchain based on the GHOSTDAG protocol (a generalization of Nakamoto consensus), enabling high block rates. This module implements Kaspa's UTXO model with **secp256k1 Schnorr signatures** (BIP-143-like sighash) and the custom **kaspa/kaspatest** bech32 address format.

Supported coin identifiers:

- `kaspa` — Kaspa mainnet
- `tkaspa` — Kaspa testnet

## Features

- Key pair generation (secp256k1)
- Address derivation (kaspa bech32 P2PK Schnorr)
- UTXO transaction building
- Schnorr signing and verification (Blake2b-256 sighash)
- TSS/MPC support (ECDSA algorithm, per-input DKLS sessions)
- Full serialization round-trip (hex/JSON)

## Installation

```bash
yarn add @bitgo/sdk-coin-kaspa
```

## Usage

### 1. Register with BitGo SDK

```typescript
import { BitGo } from 'bitgo';
import { register } from '@bitgo/sdk-coin-kaspa';

const bitgo = new BitGo({ env: 'prod' });
register(bitgo);

const kaspa = bitgo.coin('kaspa');
const tkaspa = bitgo.coin('tkaspa'); // testnet
```

Alternatively, instantiate directly (useful in tests or scripts):

```typescript
import { Kaspa, Tkaspa } from '@bitgo/sdk-coin-kaspa';

const kaspa = Kaspa.createInstance(bitgo);
const tkaspa = Tkaspa.createInstance(bitgo);
```

---

### 2. Key Generation

```typescript
// Random key pair
const kp = kaspa.generateKeyPair();
console.log(kp.pub); // 66-char hex compressed secp256k1 public key
console.log(kp.prv); // 64-char hex private key

// Deterministic from a 32-byte seed
const seed = Buffer.from('...32 bytes...', 'hex');
const kpFromSeed = kaspa.generateKeyPair(seed);

// Validation
kaspa.isValidPub(kp.pub); // true
kaspa.isValidPrv(kp.prv); // true
```

Using `KeyPair` directly:

```typescript
import { KeyPair } from '@bitgo/sdk-coin-kaspa';

const keyPair = new KeyPair(); // random
const { pub, prv } = keyPair.getKeys();
```

---

### 3. Address Generation

```typescript
import { KeyPair } from '@bitgo/sdk-coin-kaspa';

const keyPair = new KeyPair({ prv: '<64-char-hex-private-key>' });

const mainnetAddress = keyPair.getAddress('mainnet'); // kaspa:qq...
const testnetAddress = keyPair.getAddress('testnet'); // kaspatest:qq...

kaspa.isValidAddress(mainnetAddress); // true
```

Computing the P2PK `scriptPublicKey` for a key (required when constructing UTXO inputs):

```typescript
import { compressedToXOnly, buildP2PKScriptPublicKey } from '@bitgo/sdk-coin-kaspa';

const xOnlyPub = compressedToXOnly(Buffer.from(pub, 'hex'));
const scriptPublicKey = buildP2PKScriptPublicKey(xOnlyPub).toString('hex');
```

---

### 4. Building a Transaction

```typescript
import { TransactionBuilderFactory, Transaction } from '@bitgo/sdk-coin-kaspa';
import { coins } from '@bitgo/statics';
import type { KaspaUtxoInput } from '@bitgo/sdk-coin-kaspa';

const utxo: KaspaUtxoInput = {
  transactionId: '<64-char-hex-prev-tx-id>',
  transactionIndex: 0,
  amount: '100000000',      // 1 KASPA in sompi (1e8)
  scriptPublicKey: '<hex>', // P2PK script of the sender's key
  sequence: '0',
  sigOpCount: 1,
};

const factory = new TransactionBuilderFactory(coins.get('kaspa'));
const builder = factory.getBuilder();

builder
  .addInput(utxo)
  .to('kaspa:qq...recipient...', '99998000') // amount in sompi
  .fee('2000');

const tx = (await builder.build()) as Transaction;
```

Multiple inputs:

```typescript
builder
  .addInput(utxo1)
  .addInput(utxo2)
  .to(recipientAddress, '299996000')
  .fee('4000');
```

---

### 5. Signing — Path A: Direct Private Key (non-TSS)

```typescript
// `tx.sign` takes a 32-byte Buffer (raw private key)
tx.sign(Buffer.from(privateKeyHex, 'hex'));

// Signs every input at once. Fully signed → txHex; partial → halfSigned
const signedTxHex = tx.toHex(); // SDK-internal format for round-trips

// Or via the coin interface:
const result = await kaspa.signTransaction({
  txPrebuild: { txHex: unsignedTxHex },
  prv: privateKeyHex,
} as any) as { txHex: string };
```

---

### 6. Signing — Path B: TSS / MPC (per-input DKLS sessions)

Kaspa is UTXO-based: every input has its own sighash (Blake2b-256, BIP-143-like).
Each input **requires an independent DKLS session** — there is no way to produce N valid
Schnorr signatures from a single signing operation.

```typescript
const unsignedTx = (await builder.build()) as Transaction;
const txHex = unsignedTx.toHex();

// Step 1: one sighash Buffer per input — the messages for each DKLS session
const sighashes: Buffer[] = unsignedTx.signablePayloads; // Buffer[N]

// Step 2: run N DKLS sessions in parallel (one per sighash)
// Each session produces a 64-byte raw Schnorr signature

// Step 3: collect results and call signTransaction
const signatures = sighashes.map((hash, inputIndex) => ({
  inputIndex,
  pubKey: compressedPubKeyHex,          // 33-byte hex
  signature: dklsSession(hash),         // 64-byte hex Schnorr sig
}));

const result = await kaspa.signTransaction({
  txPrebuild: { txHex },
  signatures,
} as any) as { txHex: string } | { halfSigned: { txHex: string } };

// result.txHex      → all inputs signed
// result.halfSigned → some inputs still unsigned (partial TSS round)
```

---

### 7. Broadcasting

```typescript
// toBroadcastFormat() returns the Kaspa RPC-compatible JSON string
const broadcastPayload = tx.toBroadcastFormat();

// toHex() is the SDK-internal round-trip format (preserves amount + scriptPublicKey
// on inputs for sighash recomputation). Do NOT send this to the Kaspa node directly.
const internalHex = tx.toHex();
```

---

### 8. Explaining / Parsing a Transaction

```typescript
// Human-readable breakdown
const explained = await kaspa.explainTransaction({ txHex });
console.log(explained.outputs);      // [{ address, amount }]
console.log(explained.outputAmount); // total sent (sompi)
console.log(explained.fee);          // fee (sompi)

// Structured parse — inputs and outputs tagged with coin name
const parsed = await kaspa.parseTransaction({ txHex } as any);
// { inputs: [{ amount, coin: 'kaspa' }], outputs: [{ address, amount, coin: 'kaspa' }] }
```

---

### 9. Verifying a Transaction

```typescript
const valid = await kaspa.verifyTransaction({
  txPrebuild: { txHex },
  txParams: {
    recipients: [{ address: 'kaspa:qq...', amount: '99998000' }],
  },
} as any);

console.log(valid); // true
```

---

### 10. Coin Properties

```typescript
kaspa.getChain();        // 'kaspa'
kaspa.getFamily();       // 'kaspa'
kaspa.getFullName();     // 'Kaspa'
kaspa.getBaseFactor();   // 100_000_000  (sompi per KASPA)
kaspa.supportsTss();     // true
kaspa.getMPCAlgorithm(); // 'ecdsa'

tkaspa.getChain();       // 'tkaspa'
tkaspa.getFullName();    // 'Testnet Kaspa'
```

---

## Key Constants

| Property | Value |
|---|---|
| 1 KASPA | `100_000_000` sompi |
| `getBaseFactor()` | `1e8` |
| Mainnet address prefix | `kaspa:` |
| Testnet address prefix | `kaspatest:` |
| Address type | P2PK Schnorr (x-only secp256k1) |
| Signature algorithm | Schnorr (Blake2b-256 sighash) |
| TSS algorithm | `ecdsa` (DKLS) |
| Multisig type | `onchain` |

---

## Module Structure

```
src/
├── kaspa.ts                    # AbstractKaspaLikeCoin, Kaspa, Tkaspa classes
├── register.ts                 # SDK registration helper
├── index.ts
└── lib/
    ├── constants.ts            # Chain constants (prefixes, decimals, default fee)
    ├── iface.ts                # TypeScript interfaces
    ├── keyPair.ts              # secp256k1 key pair + address derivation
    ├── sighash.ts              # Blake2b-256 Schnorr sighash + script utilities
    ├── transaction.ts          # Transaction class (sign / verify / explain / serialize)
    ├── transactionBuilder.ts   # UTXO transaction builder
    ├── transactionBuilderFactory.ts
    ├── utils.ts                # Address validation and encoding
    └── index.ts
test/
├── fixtures/
│   └── kaspa.fixtures.ts       # Deterministic test vectors
└── unit/
    ├── coin.test.ts
    ├── keyPair.test.ts
    ├── transaction.test.ts
    ├── transactionBuilder.test.ts
    └── utils.test.ts
```

## Address Format

Kaspa uses a custom cashaddr-like bech32 encoding:

- Mainnet: `kaspa:<bech32-encoded-data>`
- Testnet: `kaspatest:<bech32-encoded-data>`
- Version byte `0` = Schnorr P2PK (x-only secp256k1 pubkey)

## Signing

Kaspa uses **Schnorr signatures over secp256k1** with a **Blake2b-256** sighash. The sighash preimage follows the Kaspa BIP-143-like specification. Each input is signed independently, producing a 65-byte signature: 64 bytes Schnorr + 1 byte sighash type (`0x01` = SIGHASH_ALL).

## References

- [Kaspa Website](https://kaspa.org/)
- [Kaspa BIP-143-like SigHashes](https://github.com/kaspanet/docs/blob/main/Specs/BIP143-like%20SigHashes.md)
- [Kaspa RPC API](https://kaspa.aspectron.org/docs/)
