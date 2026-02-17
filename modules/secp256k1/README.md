# BitGo secp256k1

Low-level cryptographic methods used in BitGo packages for the secp256k1 curve. This package provides ECC (Elliptic Curve Cryptography), BIP32, ECPair, and MuSig2 functionality.

## Installation

```shell
npm i @bitgo/secp256k1
```

## Features

- secp256k1 elliptic curve operations via `@noble/secp256k1`
- BIP32 HD key derivation
- ECPair key management
- MuSig2 multi-signature support

## Development

When making changes to `@bitgo/secp256k1`, ensure that the linting, formatting, and testing succeeds when run both within the package and from the root of BitGoJS.
