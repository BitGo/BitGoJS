# BitGo abstract-utxo

This module provides the foundational `AbstractUtxoCoin` class and concrete implementations for Bitcoin and Bitcoin-like UTXO-based cryptocurrencies within the BitGo platform.

## Overview

The `AbstractUtxoCoin` class serves as the base implementation for all UTXO-based coins, providing common functionality for transaction building, signing, verification, and recovery operations. Each supported cryptocurrency extends this class to provide coin-specific behavior while leveraging the shared UTXO infrastructure.

## Supported Coins

Concrete implementations are provided in the `src/impl/` directory:

- **btc/** - Bitcoin (BTC) and Bitcoin testnet variants
- **bch/** - Bitcoin Cash (BCH)
- **bcha/** - Bitcoin Cash ABC (BCHA)
- **bsv/** - Bitcoin SV (BSV)
- **btg/** - Bitcoin Gold (BTG)
- **ltc/** - Litecoin (LTC)
- **dash/** - Dash (DASH)
- **doge/** - Dogecoin (DOGE)
- **zec/** - Zcash (ZEC)

## Key Features

### Transaction Operations
- **Building & Signing**: Support for both legacy and PSBT transaction formats
- **Multi-signature**: 2-of-3 multisig with various script types (P2SH, P2WSH, P2SH-P2WSH, P2TR-MuSig2)
- **Verification**: Comprehensive transaction intent verification before signing
- **Explanation**: Decode and explain transaction details (inputs, outputs, fees)

### Wallet Types
- **Fixed Script Wallets**: Traditional HD wallets with deterministic address generation
- **Descriptor Wallets**: Modern wallet format using output script descriptors
- **Distributed Custody**: Support for enterprise custody configurations

### Address Management
- Address validation and derivation verification
- Support for multiple address formats (base58, bech32, cashaddr for BCH)
- Chain/index-based address generation for fixed script wallets

### Address Derivation Schemes

Fixed script wallets derive every address from the same three root keys (user, backup, BitGo) at
`<prefix>/<chain>/<index>`, applying the identical path to all three keys. Two schemes exist; the scheme of an address
is carried in the Address document as `coinSpecific.derivationPrefix`:

| Scheme | `derivationPrefix` | Prefix used | Notes |
| ------ | ------------------ | ----------- | ----- |
| Legacy | absent | `0/0` (the wallet's existing key path) | Every wallet created so far. A missing prefix always means legacy. |
| BIP44-style | `44/<coinType>/<h1>/<h2>` | the value itself | Per-wallet: two wallets sharing the same root keys get distinct addresses. |

For the BIP44-style scheme:

- `coinType` is the coin's `bip44CoinType` from the `@bitgo/statics` registry (btc 0, ltc 2, doge 3, dash 5, zec 133,
  bch 145, btg 156, bsv 236, bcha 899; testnets inherit their mainnet's value). It is read from the coin instance
  (`coin.getConfig().bip44CoinType`), never from the wasm coin name.
- `h1`/`h2` (the "account") are derived from a SHA-256 hash of the three neutered root keys
  (`fixedScriptWallet.deriveWalletAccount`), and the whole prefix is produced by `fixedScriptWallet.deriveWalletPrefix`.
  All components are non-hardened, so addresses can be derived from xpubs alone.
- The prefix is **never trusted**. `isWalletAddress` and `deriveAddress` recompute the canonical prefix from the three
  keys and the coin type and reject any other value (strict in both directions: a legacy address presented with a
  prefix fails, and a bip44 address presented without one fails). A coin without a BIP44 coin type throws when it is
  given a prefix; `allowSkipVerifyAddress` cannot skip this check.
- PSBT outputs are classified from the full derivation path recorded in the PSBT (all components except the last two
  are the prefix), under the same canonical-equality check, so bip44 change outputs are reported as change.
- SDK versions that predate this check throw `UnexpectedAddressError` for a bip44 address.

**This is not the Safes scheme.** Safes (`@bitgo/sdk-lib-safes`) derive a child key per wallet from the enterprise key
with hardened levels and a server-side counter, so each Safe has its own keys. Here the wallet keeps the same root
keys as any other wallet that uses them; only the non-hardened prefix differs, and the account comes from a hash of
the three xpubs rather than a counter. The two share only the coin-type registry in `@bitgo/statics`.

### Recovery Operations
- **Backup Key Recovery**: Recover funds using backup key when BitGo is unavailable
- **Cross-Chain Recovery**: Recover coins sent to wrong chain (e.g., BTC sent to LTC address)
- **V1 Wallet Recovery**: Support for legacy V1 wallet recovery

### Advanced Features
- BIP322 message signing support
- MuSig2 for Taproot multisig
- Replay protection for chain splits
- Custom change address handling
- RBF (Replace-by-Fee) transaction support

## Development Setup

### VSCode Configuration

For an optimal development experience in VSCode, configure the Mocha Test Explorer with the following settings in `.vscode/settings.json`:

```json
{
  "mochaExplorer.files": "test/**/*.ts",
  "mochaExplorer.nodeArgv": ["--import", "tsx"],
  "mochaExplorer.logpanel": true
}
```

This configuration enables:
- **Test Discovery**: Automatically finds all TypeScript test files in the `test/` directory
- **TypeScript Support**: Uses `tsx` for running TypeScript tests without compilation
- **Log Panel**: Displays test output for easier debugging

### Running Tests

With the Mocha Test Explorer configured, you can:
- View and run individual tests or test suites from the VSCode Test Explorer panel
- Set breakpoints and debug tests directly in the editor
- Monitor test output in the integrated log panel
