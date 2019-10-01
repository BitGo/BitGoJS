# BitGo Javascript SDK

The BitGo Platform and SDK makes it easy to build multi-signature crypto-currency applications today with support for Bitcoin, Ethereum and many other coins.
The SDK is fully integrated with the BitGo co-signing service for managing all of your BitGo wallets.

Included in the SDK are examples for how to use the API to manage your multi-signature wallets.

Please email us at support@bitgo.com if you have questions or comments about this API.

[![Known Vulnerabilities](https://snyk.io/test/npm/bitgo/badge.svg)](https://snyk.io/test/npm/bitgo) [![Build Status](https://cloud.drone.io/api/badges/BitGo/BitGoJS/status.svg)](https://cloud.drone.io/BitGo/BitGoJS)

# Installation

Please make sure you are running at least Node version 8 (the latest LTS release is recommended) and NPM version 6.
We recommend using `nvm`, the [Node Version Manager](https://github.com/creationix/nvm/blob/master/README.markdown#installation), for setting your Node version.

`npm install --save bitgo`

# Full Documentation

Please see our [SDK Documentation](https://bitgo-sdk-docs.s3.amazonaws.com/core/8.2.0/index.html) for detailed information about the Typescript SDK and functionality.

For more general information about the BitGo API, please see our [REST API Documentation](https://www.bitgo.com/api/v2).

# Release Notes

You can find the complete release notes (since version 4.44.0) [here](https://github.com/BitGo/BitGoJS/blob/master/modules/core/RELEASE_NOTES.md).

# Example Usage

## Initialize SDK
Create an access token by logging into your bitgo account, going to the API access tab [in the settings area](https://www.bitgo.com/settings) and making a developer token.
```js
const BitGo = require('bitgo');
const bitgo = new BitGo.BitGo({ accessToken: ACCESS_TOKEN }); // defaults to testnet. add env: 'prod' if you want to go against mainnet
const result = await bitgo.session();
console.dir(result);
```

## Create Wallet
```js
const params = {
  "passphrase": "replaceme",
  "label": "firstwallet"
};
const { wallet } = await bitgo.coin('tbtc').wallets().generateWallet(params);
console.dir(wallet);
```

## Create new address
```js
const address = await wallet.createAddress();
console.dir(address);
```

## View wallet transfers
```js
const transfers = await wallet.transfers();
```

## Send coins
```js
const result = await wallet.sendCoins({
  address: "2NEe9QhKPB2gnQLB3hffMuDcoFKZFjHYJYx",
  amount: 0.01 * 1e8,
  walletPassphrase:  "replaceme"
});
console.dir(result);
```

## More examples
Further demos and examples in both Javascript and Typescript can be found in the [example](example) directory.

# Using with Typescript

`bitgo` is not yet compatible with the `noImplicitAny` compiler option. If you want to use this option in your project (and we recommend that you do), you must set the `skipLibCheck` option to supress errors about missing type definitions for dependencies of `bitgo`.

# Usage in Browser

Since version 6, `bitgo` includes a minified, browser-compatible bundle by default at `dist/browser/BitGoJS.min.js`. It can be copied from there directly into your project.

BitGoJS can also be bundled with any module bundler. There is a Webpack configuration file already included, which can be triggered with package scripts.

For a production build: `npm run-script compile`

For a development (non-minified) build: `npm run-script compile-dbg`

To build the test suite into a single test file: `npm run-script compile-test`
