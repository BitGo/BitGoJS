> **⚠️ Deprecated.** `@bitgo/utxo-core` — the glue/types layer between
> SDK-dependent modules and low-level UTXO libraries — is deprecated. Its
> functionality has been absorbed by [`@bitgo/wasm-utxo`][wasm-utxo] in the
> [BitGoWASM][bitgowasm] repository, which now owns the core UTXO types and
> primitives. New code should depend on `@bitgo/wasm-utxo`.
>
> [wasm-utxo]: https://github.com/BitGo/BitGoWASM/tree/main/packages/wasm-utxo
> [bitgowasm]: https://github.com/BitGo/BitGoWASM

# utxo-core

This repository contains core types and functions for Bitcoin-like UTXO-based cryptocurrencies.

It is the glue between SDK-dependent modules like `abstract-utxo` and low-level libraries like `utxo-lib` and
`wasm-miniscript`.
