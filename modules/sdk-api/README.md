# BitGo sdk-api

REST wrapper for the BitGoJS SDK. This package provides the `BitGoAPI` class used to initialize the SDK and register coin implementations.

## Installation

```shell
npm i @bitgo/sdk-api
```

## Usage

`@bitgo/sdk-api` is used as the entry point for accessing individual coin modules:

```javascript
import { BitGoAPI } from '@bitgo/sdk-api';
import { Btc } from '@bitgo/sdk-coin-btc';

const sdk = new BitGoAPI();

sdk.register('btc', Btc.createInstance);
```

## Development

This package provides the REST API layer for communicating with the BitGo platform services. It handles authentication, request signing, and session management.

When making changes to `sdk-api`, ensure that the linting, formatting, and testing succeeds when run both within the package and from the root of BitGoJS.
