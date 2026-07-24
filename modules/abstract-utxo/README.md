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
