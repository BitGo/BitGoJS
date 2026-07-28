# BitGo sdk-coin-pearl

SDK coins provide a modular approach to a monolithic architecture. This and all BitGoJS SDK coins allow developers to use only the coins needed for a given project.

Pearl (Duplex) is a taproot-only UTXO chain — a btcd fork using BIP-340 Schnorr signatures and BIP-341 script-path spending. It is served through `@bitgo/wasm-utxo` and, unlike the other UTXO coins, has no `@bitgo/utxo-lib` network registration.

## Installation

All coins are loaded traditionally through the `bitgo` package. If you are using coins individually, you will be accessing the coin via the `@bitgo/sdk-api` package.

In your project install both `@bitgo/sdk-api` and `@bitgo/sdk-coin-pearl`.

```shell
npm i @bitgo/sdk-api @bitgo/sdk-coin-pearl
```

Next, you will be able to initialize an instance of "bitgo" through `@bitgo/sdk-api` instead of `bitgo`.

```javascript
import { BitGoAPI } from '@bitgo/sdk-api';
import { Pearl } from '@bitgo/sdk-coin-pearl';

const sdk = new BitGoAPI();

sdk.register('pearl', Pearl.createInstance);
```

## Development

Most of the coin implementations are derived from `@bitgo/sdk-core`, `@bitgo/statics`, and coin specific packages. These implementations are used to interact with the BitGo API and BitGo platform services.

The `Pearl` and `Tpearl` classes live in `@bitgo/abstract-utxo` and are re-exported here; this package is a registration shim only.
