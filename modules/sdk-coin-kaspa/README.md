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
- TSS/MPC support (ECDSA algorithm)
- Full serialization round-trip (hex/JSON)

## Installation

```bash
yarn add @bitgo/sdk-coin-kaspa
```

## Usage

### Register with BitGo SDK

```typescript
import { register } from '@bitgo/sdk-coin-kaspa';
register(bitgo);
```

### Key Pair

```typescript
import { KeyPair } from '@bitgo/sdk-coin-kaspa';

// Generate a random key pair
const kp = new KeyPair();
const { pub, prv } = kp.getKeys();

// Derive address
const mainnetAddress = kp.getAddress('mainnet');
const testnetAddress = kp.getAddress('testnet');
```

### Build and Sign a Transaction

```typescript
import { TransactionBuilderFactory } from '@bitgo/sdk-coin-kaspa';
import { coins } from '@bitgo/statics';

const factory = new TransactionBuilderFactory(coins.get('kaspa'));
const builder = factory.getBuilder();

builder
  .addInput({
    transactionId: '<prev-tx-id>',
    transactionIndex: 0,
    amount: '100000000', // 1 KASPA in sompi
    scriptPublicKey: '<spk>',
    sequence: '0',
    sigOpCount: 1,
  })
  .to('<recipient-kaspa-address>', '99998000')
  .fee('2000');

const tx = await builder.build();
tx.sign(Buffer.from(privateKeyHex, 'hex'));

const broadcastPayload = tx.toBroadcastFormat(); // JSON string for RPC
```

## Module Structure

```
src/
├── kaspa.ts                    # Kaspa mainnet coin class
├── tkaspa.ts                   # Kaspa testnet coin class
├── register.ts                 # SDK registration
├── index.ts
└── lib/
    ├── constants.ts            # Chain constants (prefixes, decimals, fees)
    ├── iface.ts                # TypeScript interfaces
    ├── keyPair.ts              # secp256k1 key pair
    ├── sighash.ts              # Blake2b-256 Schnorr sighash
    ├── transaction.ts          # Transaction class (sign/verify/explain)
    ├── transactionBuilder.ts   # UTXO transaction builder
    ├── transactionBuilderFactory.ts
    ├── utils.ts                # Address validation and encoding
    └── index.ts
test/
├── fixtures/
│   ├── kaspa.fixtures.ts       # Deterministic test vectors
│   └── kaspaFixtures.ts        # Synthetic test fixtures
└── unit/
    ├── coin.test.ts
    ├── keyPair.test.ts
    ├── transaction.test.ts
    ├── transactionBuilder.test.ts
    ├── transactionFlow.test.ts
    └── utils.test.ts
```

## Address Format

Kaspa uses a custom cashaddr-like bech32 encoding:

- Mainnet: `kaspa:<bech32-encoded-data>`
- Testnet: `kaspatest:<bech32-encoded-data>`
- Version byte `0` = Schnorr P2PK (x-only secp256k1 pubkey)

## Signing

Kaspa uses **Schnorr signatures over secp256k1** with a **Blake2b-256** sighash. The sighash preimage follows the Kaspa BIP-143-like specification. Each input is signed independently, producing a 65-byte signature: 64 bytes Schnorr + 1 byte sighash type.

## References

- [Kaspa Website](https://kaspa.org/)
- [Kaspa BIP-143-like SigHashes](https://github.com/kaspanet/docs/blob/main/Specs/BIP143-like%20SigHashes.md)
- [Kaspa RPC API](https://kaspa.aspectron.org/docs/)
