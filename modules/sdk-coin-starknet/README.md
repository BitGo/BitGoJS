# BitGo sdk-coin-starknet

BitGo SDK coin library for [Starknet](https://www.starknet.io/) — a ZK-rollup L2 secured by Ethereum.

Native Starknet accounts at BitGo use OpenZeppelin's `EthAccountUpgradeable` contract, which validates secp256k1 ECDSA signatures on-chain via Cairo's `secp256k1_get_point_from_x_syscall`. This lets BitGo reuse its existing 2-of-3 ECDSA TSS (the same protocol used for Bitcoin, Ethereum, ICP) with no new cryptographic work.

## Installation

All coins are loaded traditionally through the `bitgo` package. If you are using coins individually, you will be accessing the coin via the `@bitgo/sdk-api` package.

In your project install both `@bitgo/sdk-api` and `@bitgo/sdk-coin-starknet`.

```shell
npm i @bitgo/sdk-api @bitgo/sdk-coin-starknet
```

Next, you will be able to initialize an instance of "bitgo" through `@bitgo/sdk-api` instead of `bitgo`.

```javascript
import { BitGoAPI } from '@bitgo/sdk-api';
import { Starknet } from '@bitgo/sdk-coin-starknet';

const sdk = new BitGoAPI();

sdk.register('starknet', Starknet.createInstance);
```

## Development

Most of the coin implementations are derived from `@bitgo/sdk-core`, `@bitgo/statics`, and coin specific packages. These implementations are used to interact with the BitGo API and BitGo platform services.

This package currently provides only the coin-class scaffold. Address derivation, transaction building, signing, and RPC client are tracked in follow-up tickets.
