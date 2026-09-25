# BitGo sdk-coin-canton

SDK coins provide a modular approach to a monolithic architecture. This and all BitGoJS SDK coins allow developers to use only the coins needed for a given project.

## Installation

All coins are loaded traditionally through the `bitgo` package. If you are using coins individually, you will be accessing the coin via the `@bitgo/sdk-api` package.

In your project install both `@bitgo/sdk-api` and `@bitgo/sdk-coin-canton`.

```shell
npm i @bitgo/sdk-api @bitgo/sdk-coin-canton
```

Next, you will be able to initialize an instance of "bitgo" through `@bitgo/sdk-api` instead of `bitgo`.

```javascript
import { BitGoAPI } from '@bitgo/sdk-api';
import { Canton } from '@bitgo/sdk-coin-canton';

const sdk = new BitGoAPI();

sdk.register('canton', Canton.createInstance);
```

## Block lookup

Canton block identifiers are ledger offsets rather than conventional blockchain
block hashes. A ledger can be reset, so the offset is only unique together with
the ledger version.

When looking up a Canton block, use the transfer's `heightId` value from the
Get Transfer API response as the `{height}` path parameter. Do not use the
plain numeric `height` value: it represents only the ledger offset and can
refer to a different ledger after a reset.

```text
GET /api/v2/canton/public/block/{heightId}
```

For example, a transfer response containing:

```json
{
  "height": 6291143,
  "heightId": "006291143-6a85688d879741a95e3940b671adb39b"
}
```

must be followed by:

```text
GET /api/v2/canton/public/block/006291143-6a85688d879741a95e3940b671adb39b
```

A request using `/public/block/6291143` can return `block not found`, even
when the transfer exists. The `heightId` is the canonical Canton block
identifier and includes both the offset and the ledger version.

This is a Canton-specific exception to the usual block lookup pattern. For
other coins, use the block identifier documented for that coin; for coins
with conventional, non-resetting block heights, the numeric `height` can be
used. No other coin-specific `heightId` exception is defined by this package.


Most of the coin implementations are derived from `@bitgo/sdk-core`, `@bitgo/statics`, and coin specific packages. These implementations are used to interact with the BitGo API and BitGo platform services.

You will notice that the basic version of common class extensions have been provided to you and must be resolved before the package build will succeed. Upon initiation of a given SDK coin, you will need to verify that your coin has been included in the root `tsconfig.packages.json` and that the linting, formatting, and testing succeeds when run both within the coin and from the root of BitGoJS.
