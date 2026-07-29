# Migrating from the `bitgo` Megapackage

> **This package is deprecated for new projects.** Use `@bitgo/sdk-api` and `@bitgo/sdk-core` instead,
> importing only the coin modules you need.

## What the Megapackage Provides

The `bitgo` package (`@bitgo/bitgo` / `@bitgo-beta/bitgo`) is a convenience wrapper that re-exports:

- **`@bitgo/sdk-api`** — the `BitGoAPI` class (REST client, authentication, session management)
- **`@bitgo/sdk-core`** — core types, utilities, TSS primitives, wallet interfaces
- **All 80+ `@bitgo/sdk-coin-*` packages** — individual coin implementations

It also provides the `BitGo` class, which extends `BitGoAPI` with automatic registration of every
supported coin via `GlobalCoinFactory`. This means `new BitGo().coin('btc')` works out of the box,
but at the cost of bundling every coin module whether you use it or not.

## When to Use This Package

**Use it** if you are maintaining a legacy project that already depends on it and migration is not
yet planned.

**Do not use it** for new projects. Instead, use the modular approach described below.

## Migration Guide

### 1. Replace `BitGo` with `BitGoAPI`

```typescript
// Before
import { BitGo, BitGoOptions } from 'bitgo'
const sdk = new BitGo({ env: 'prod' })

// After
import { BitGoAPI, BitGoAPIOptions } from '@bitgo/sdk-api'
const sdk = new BitGoAPI({ env: 'prod' })
```

`BitGoOptions` is `BitGoAPIOptions & { useAms?: boolean }`. If you don't use the `useAms` flag,
`BitGoAPIOptions` is a drop-in replacement.

### 2. Move Type Imports to `@bitgo/sdk-core`

All types that the megapackage re-exports from `@bitgo/sdk-core` can be imported directly:

```typescript
// Before
import { SignatureShareRecord, CommitmentShareRecord, CustomSigningFunction } from 'bitgo'

// After
import { SignatureShareRecord, CommitmentShareRecord, CustomSigningFunction } from '@bitgo/sdk-core'
```

Common types that move: `SignatureShareRecord`, `CommitmentShareRecord`,
`EncryptedSignerShareRecord`, `SignatureShareType`, `CommitmentType`,
`EncryptedSignerShareType`, `CustomSigningFunction`, `AddressFormat`, `MessageStandardType`.

### 3. Replace `bitcoin.HDNode` / `bitcoin.hdPath`

```typescript
// Before
const BitgoJS = require('bitgo')
const node = BitgoJS.bitcoin.HDNode.fromBase58(xprv)
const derived = BitgoJS.bitcoin.hdPath(node).derive(path)

// After
import { bip32 } from '@bitgo/secp256k1'
const node = bip32.fromBase58(xprv)
const derived = node.derivePath(path)
```

### 4. Register Coins On Demand

With `BitGoAPI`, coins are not pre-registered. You must register them before calling `sdk.coin()`.
Use dynamic imports for lazy loading:

```typescript
import { BitGoAPI } from '@bitgo/sdk-api'
import type { BaseCoin } from '@bitgo/sdk-core'

const sdk = new BitGoAPI({ env: 'prod' })

// Register a coin family on first use
async function getCoin(name: string): Promise<BaseCoin> {
  try {
    return sdk.coin(name)
  } catch {
    // Not registered yet — dynamically import and register
  }

  const { coins } = await import('@bitgo/statics')
  const family = coins.get(name).family

  switch (family) {
    case 'btc': {
      const { register } = await import('@bitgo/sdk-coin-btc')
      register(sdk)
      break
    }
    case 'eth': {
      const { register } = await import('@bitgo/sdk-coin-eth')
      register(sdk)
      break
    }
    // ... add cases for each coin family you need
  }

  return sdk.coin(name)
}
```

See `bitgo-retail/packages/retail-sdk-client/src/coinFactory.ts` for a complete reference
implementation covering all coin families.

### 5. Update `package.json`

Remove `bitgo` (or `@bitgo-beta/bitgo`) and add the modular dependencies:

```jsonc
{
  "dependencies": {
    // Remove:
    // "@bitgo/bitgo": "..."

    // Add core packages:
    "@bitgo/sdk-api": "...",
    "@bitgo/sdk-core": "...",
    "@bitgo/statics": "...",

    // Add only the coin modules you use:
    "@bitgo/sdk-coin-btc": "...",
    "@bitgo/sdk-coin-eth": "..."
    // ...
  }
}
```
