# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

### Installation
```bash
yarn install
```

### Development
```bash
# Watch mode for development (compiles all TypeScript packages and watches for changes)
yarn dev

# Single build of all packages
yarn
```

### Linting
```bash
# Lint all packages
yarn lint

# Lint only changed files
yarn lint-changed

# Fix linting issues
yarn lint-fix

# Commit lint
yarn check-commits
```

### Testing
```bash
# Run all unit tests
yarn unit-test

# Run unit tests for a specific module
yarn run unit-test --scope bitgo

# Run unit tests for files containing specific string
yarn run unit-test -- -- --grep "keyword"

# Run unit tests only for changed modules since master
yarn unit-test-changed

# Run integration tests
yarn integration-test

# Generate test coverage
yarn coverage
```

### Browser Compatibility
```bash
# Run browser tests
yarn browser-tests

# Build for production
yarn compile

# Build for development
yarn compile-dbg
```

## Dual ESM/CJS Builds

For modules that need browser support (especially those using `@bitgo/wasm-utxo`), see [docs/esm.md](docs/esm.md) for the dual ESM/CJS build pattern.

## Code Style

### Commits
BitGoJS uses conventional commits. All commits MUST pass the spec described in `commitlint.config.js`.

### TypeScript Guidelines
- **Avoid `any` type**: Use specific types, interfaces, or union types instead of `any`. If absolutely necessary, prefer `unknown` and use type guards for safety.

## Code Architecture

BitGoJS is a monorepo composed of multiple modules, each implementing specific functionality:

### Core Modules
- `bitgo`: Main module providing authentication, wallet management, cryptographic primitives, and coin interfaces
- `@bitgo/sdk-core`: Core SDK functionality, base classes, and interfaces
- `@bitgo/sdk-api`: API client utilities
- `@bitgo/statics`: Static configuration values used across the platform

### Coin Implementation Modules
- `@bitgo/sdk-coin-*`: Individual cryptocurrency implementations (e.g., btc, eth, sol, etc.)
- `@bitgo/abstract-eth`, `@bitgo/abstract-utxo`, etc.: Abstract base classes for similar coin families

### Transaction Building and Signing
- `@bitgo/account-lib`: Build and sign transactions for account-based coins
- `@bitgo/utxo-lib`: Build and sign transactions for UTXO-based coins

### Other Utility Modules
- `@bitgo/blockapis`: Access public block explorer APIs for various coins
- `@bitgo/express`: Local BitGo transaction signing server and proxy
- `@bitgo/unspents`: Utilities for UTXO chains

## Architecture Overview

The BitGoJS SDK follows a modular architecture:

1. **Coin Factory Pattern**: The `CoinFactory` allows dynamic registration and instantiation of different cryptocurrency implementations

2. **Multi-signature Wallets**: Core functionality revolves around creating and managing multi-signature wallets across various blockchains

3. **Transaction Building**: Each coin type has builders for constructing, signing, and broadcasting transactions

4. **Abstraction Layers**: Common functionality shared across similar blockchains is abstracted into base classes (e.g., `abstractEthLikeCoin`, `abstractUtxoCoin`)

5. **TSS (Threshold Signature Scheme)**: Support for advanced cryptographic operations, including MPC (Multi-Party Computation) for secure key management

6. **Module Independence**: Each cryptocurrency module can be used independently, allowing users to include only the functionality they need

## Adding New Coins

To implement a new coin:
```bash
yarn sdk-coin:new
```

This will generate the necessary boilerplate for a new coin implementation.

## Node.js Version Support

BitGoJS supports Node.js versions >=20 and <25, with NPM >=3.10.10.
