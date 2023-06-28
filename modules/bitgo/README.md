# BitGo JavaScript SDK

The BitGo Platform and SDK makes it easy to build multi-signature crypto-currency applications today with support for Bitcoin, Ethereum and many other coins.
The SDK is fully integrated with the BitGo co-signing service for managing all of your BitGo wallets.

Included in the SDK are examples for how to use the API to manage your multi-signature wallets.

Please email us at support@bitgo.com if you have questions or comments about this API.

[![Known Vulnerabilities](https://snyk.io/test/github/BitGo/BitGoJS/badge.svg)](https://snyk.io/test/github/BitGo/BitGoJS)
[![BitGo SDK](https://github.com/BitGo/BitGoJS/actions/workflows/ci.yml/badge.svg)](https://github.com/BitGo/BitGoJS/actions/workflows/ci.yml)

# Installation

Please make sure you are running at least Node version 8 (the latest LTS release is recommended) and NPM version 6.
We recommend using `nvm`, the [Node Version Manager](https://github.com/creationix/nvm/blob/master/README.markdown#installation), for setting your Node version.

`npm install --save bitgo`

# Full Documentation

Please see our [SDK Documentation](https://bitgo-sdk-docs.s3.amazonaws.com/core/11.3.0/index.html) for detailed information about the TypeScript SDK and functionality.

For more general information about the BitGo API, please see our [REST API Documentation](https://www.bitgo.com/api/v2).

# Release Notes

You can find the complete release notes (since version 4.44.0) [here](https://github.com/BitGo/BitGoJS/blob/master/modules/bitgo/CHANGELOG.md).

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
  passphrase: 'replaceme',
  label: 'firstwallet',
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
  address: '2NEe9QhKPB2gnQLB3hffMuDcoFKZFjHYJYx',
  amount: 0.01 * 1e8,
  walletPassphrase: 'replaceme',
});
console.dir(result);
```

## More examples

Further demos and examples in both JavaScript and TypeScript can be found in the [example](example) directory.

# Enabling additional debugging output

`bitgo` uses the `debug` package to emit extra information, which can be useful when debugging issues with BitGoJS or BitGo Express.

When using the `bitgo` npm package, the easiest way to enable debug output is by setting the `DEBUG` environment variable to one or more of the debug namespaces in the table below. Multiple debug namespaces can be enabled by giving a comma-separated list or by using `*` as a wildcard. See the [debug package documentation](https://github.com/visionmedia/debug#readme) for more details.

## Available Debug Namespaces

| Namespace                   | Description                                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `bitgo:index`               | Core BitGo object. Currently only constant fetch failures and HMAC response failures will emit debug information for this namespace. |
| `bitgo:v1:txb`              | Version 1 (legacy) transaction builder                                                                                               |
| `bitgo:v2:pendingapprovals` | Pending approval operations. Currently only wallet fetch errors will emit debug information for this namespace.                      |
| `bitgo:v2:wallet`           | Wallet operations including transaction prebuild, sendMany calls and consolidation transactions                                      |
| `bitgo:v2:utxo`             | Low level operations for UTXO coins, including transaction parsing, verification, signing and explanations                           |
| `bitgo:v2:eth`              | Ethereum specific output. Currently only failures to require the optional Ethereum libraries are reported                            |
| `bitgo:v2:util`             | SDK utilities specific output. Currently only failures to require the optional Ethereum libraries are reported                       |

Another debug namespace which is not provided by BitGoJS but is helpful nonetheless is the `superagent` namespace, which will output all HTTP requests and responses (only the URL, not bodies).

## Example

To run an SDK script with debug output enabled, export the DEBUG environment variable before running.

```shell script
export DEBUG='bitgo:*' # enable all bitgo debug namespaces
node myScript.js
```

To set debug namespaces in the browser, you should set `localStorage.debug` property instead of the `DEBUG` environment variable using your browser's development tools console.

```js
localStorage.debug = 'bitgo:*'; // enable all bitgo debug namespaces
```

# Using with TypeScript

`bitgo` is not yet compatible with the `noImplicitAny` compiler option. If you want to use this option in your project (and we recommend that you do), you must set the `skipLibCheck` option to supress errors about missing type definitions for dependencies of `bitgo`.

# Usage in Browser

Since version 6, `bitgo` includes a minified, browser-compatible bundle by default at `dist/browser/BitGoJS.min.js`. It can be copied from there directly into your project.

BitGoJS can also be bundled with any module bundler. There is a Webpack configuration file already included, which can be triggered with package scripts.

For a production build: `npm run-script compile`

For a development (non-minified) build: `npm run-script compile-dbg`

To build the test suite into a single test file: `npm run-script compile-test`
