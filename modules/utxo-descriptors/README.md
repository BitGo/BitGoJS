# @bitgo/utxo-descriptors

A library for constructing [Bitcoin output descriptors][bip-380] (BIP-380) — descriptor strings that pair on-chain UTXOs with a derivable, parseable key-tracking expression.

This package is the canonical home for descriptor-building logic across BitGo's UTXO codebase. It deliberately stays one layer above [`@bitgo/wasm-utxo`][wasm-utxo]: that package owns descriptor parsing and miniscript compilation. This package owns the high-level _builders_ that emit valid descriptor strings for the protocols BitGo supports.

## Install

```bash
yarn add @bitgo/utxo-descriptors
```

## Module layout

```
src/
├── index.ts                  # re-exports each protocol module under a namespace
└── sbtc/                     # sBTC peg-in deposit descriptors
    ├── constants.ts
    ├── descriptor.ts
    ├── depositAddress.ts
    └── index.ts
```

Each new protocol gets its own subdirectory under `src/` and is re-exported as a namespace from [`src/index.ts`](src/index.ts), so consumers import it as `import { sbtc } from '@bitgo/utxo-descriptors'`.

---

## sBTC

The `sbtc` namespace builds descriptors for sBTC peg-in deposits — Bitcoin UTXOs whose output script is a Taproot tree with two leaves:

- a **deposit** leaf, spendable only by the sBTC signers, that commits to the Stacks recipient and the maximum signer fee
- a **reclaim** leaf, spendable by the depositor after a relative timelock, that lets the depositor recover their BTC if the signers fail to act

Both leaves are expressed as **Bitcoin miniscript fragments** inside a single `tr()` descriptor — no raw script bytes, no out-of-band leaf hashing. This is enabled by the `payload_drop(<hex>)` fragment and tap-context `r:older(N)` shipped in `@bitgo/wasm-utxo` 4.11.0 ([BitGoWASM #272](https://github.com/BitGo/BitGoWASM/pull/272)).
