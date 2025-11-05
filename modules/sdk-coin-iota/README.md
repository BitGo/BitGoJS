# BitGo SDK Coin Implementation for IOTA

SDK coins provide a modular approach to a monolithic architecture. This package provides the BitGo SDK implementation for the IOTA cryptocurrency.

## Installation

All coins are loaded traditionally through the `bitgo` package. If you are using coins individually, you will be accessing the coin via the `@bitgo/sdk-api` package.

In your project install both `@bitgo/sdk-api` and `@bitgo/sdk-coin-iota`.

```
npm install @bitgo/sdk-api && npm install @bitgo/sdk-coin-iota
```

## Usage

```typescript
import { BitGoAPI } from '@bitgo/sdk-api';
import { Iota } from '@bitgo/sdk-coin-iota';

// Register the coin with BitGo SDK
const sdk = new BitGoAPI();
sdk.register('iota', Iota.createInstance);

// Now you can create an IOTA instance
const iota = sdk.coin('iota');
```

## Features

- Key pair generation and management
- Address validation
- Transaction building and signing
- TSS (Threshold Signature Scheme) support
- Support for IOTA tokens

## Documentation

For detailed API documentation, view the BitGo [Developer Portal](https://developers.bitgo.com/reference/overview#/).
