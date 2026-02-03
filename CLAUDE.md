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

## Tools guide

## Code editing and discovery

- **Serena MCP** — Use for all code editing and code discovery:
  - Edit code via Serena’s symbolic or file-based editing tools.
  - Find code by names, symbols, and patterns (e.g. `find_symbol`, `get_symbols_overview`, `search_for_pattern`).
  - Prefer Serena over raw file reads when navigating or changing the codebase.

## Definitions and references

- **Knowledge-graph MCP** — Use whenever you need to understand code:
  - Finding definitions or references of symbols, types, or files.
  - Understanding how code is used and where it is referenced.
  - Rely on the knowledge-graph as the primary source for "where is this defined?" and "who uses this?".

## After code changes

- **Knowledge-graph `index_project`** — After any code update:
  - Call the knowledge-graph **index_project** (or equivalent) tool so the graph stays in sync with the codebase.
  - Do this as part of your post-edit workflow so future lookups remain accurate.

## Quick codebase understanding

- **Knowledge-graph repo-map** — When you need a fast, high-level picture:
  - Use the knowledge-graph **repo-map** (or equivalent) to grasp structure and relationships quickly.
  - Use it at the start of saga work or when switching context to a new area of the codebase.

## Research and documentation

- **Perplexity MCP** — Use for online search:
  - Searching for resources, patterns, solutions, or documentation on the web.
  - Prefer Perplexity when the answer is likely to be in articles, docs, or discussions.

- **Fetch (e.g. mcp web_fetch)** — Use for content from external URLs:
  - Only when you need the actual content of a specific link.
  - **Always evaluate security risk first** (e.g. URL origin, protocol, and sensitivity of the task) before calling fetch.

- **Context7 MCP** — Use for up-to-date library docs:
  - Fetch current documentation for any library or framework you need.
  - Prefer Context7 when documenting or analyzing a specific library or stack.
