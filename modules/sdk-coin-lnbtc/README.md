# BitGo sdk-coin-lnbtc

SDK coins provide a modular approach to a monolithic architecture. This and all BitGoJS SDK coins allow developers to use only the coins needed for a given project.

## Installation

All coins are loaded traditionally through the `bitgo` package. If you are using coins individually, you will be accessing the coin via the `@bitgo/sdk-api` package.

In your project install both `@bitgo/sdk-api` and `@bitgo/sdk-coin-lnbtc`.

```shell
npm i @bitgo/sdk-api @bitgo/sdk-coin-lnbtc
```

Next, you will be able to initialize an instance of "bitgo" through `@bitgo/sdk-api` instead of `bitgo`.

```javascript
import { BitGoAPI } from '@bitgo/sdk-api';
import { Lnbtc } from '@bitgo/sdk-coin-lnbtc';

const sdk = new BitGoAPI();

sdk.register('lnbtc', Lnbtc.createInstance);
```

## Development

Most of the coin implementations are derived from `@bitgo/sdk-core`, `@bitgo/statics`, and coin specific packages. These implementations are used to interact with the BitGo API and BitGo platform services.

You will notice that the basic version of common class extensions have been provided to you and must be resolved before the package build will succeed. Upon initiation of a given SDK coin, you will need to verify that your coin has been included in the root `tsconfig.packages.json` and that the linting, formatting, and testing succeeds when run both within the coin and from the root of BitGoJS.
