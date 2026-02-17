# BitGo sdk-core

Core library functions for the BitGoJS SDK. This package provides the base classes, interfaces, and shared functionality used across all BitGoJS coin implementations.

## Installation

```shell
npm i @bitgo/sdk-core
```

## Usage

```javascript
import { BaseCoin, BitGoBase, common } from '@bitgo/sdk-core';
```

## Development

`@bitgo/sdk-core` provides the foundational classes and interfaces that coin-specific packages extend. It includes:

- Base coin class definitions
- Transaction building interfaces
- Wallet management utilities
- Cryptographic primitives
- TSS (Threshold Signature Scheme) support
- MPC (Multi-Party Computation) utilities
- Common error types
- API interaction layer

When making changes to `sdk-core`, ensure that the linting, formatting, and testing succeeds when run both within the package and from the root of BitGoJS.
