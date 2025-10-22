# BitGo JavaScript SDK

The BitGo Platform enables you to build multisignature and MPC cryptocurrency applications for over a thousand digital assets. You can view all BitGo supported assets on the [Developer Portal](https://assets.bitgo.com/coins). The SDK is fully integrated with the BitGo co-signing service for managing all of your BitGo wallets.

The SDK includes examples for how to use the API to manage your wallets.

If you have questions or comments about this API, email support@bitgo.com.

[![Known Vulnerabilities](https://snyk.io/test/github/BitGo/BitGoJS/badge.svg)](https://snyk.io/test/github/BitGo/BitGoJS)
[![BitGo SDK](https://github.com/BitGo/BitGoJS/actions/workflows/ci.yml/badge.svg)](https://github.com/BitGo/BitGoJS/actions/workflows/ci.yml)

# Installation

Ensure you're running Node version 20 or higher (preferably the latest LTS release) and NPM version 10.
For setting your Node version, we recommend using `nvm` - the [Node Version Manager](https://github.com/creationix/nvm/blob/master/README.markdown#installation).

`npm install --save bitgo`

# Full Documentation

For more comprehensive information about the BitGo API, including integration guides, see the BitGo [Developer Portal](https://developers.bitgo.com/).

# Release Notes

- [API changelog](https://github.com/BitGo/api-changelog/)
- [SDK changelog](https://github.com/BitGo/BitGoJS/blob/master/modules/bitgo/CHANGELOG.md) (since version 4.44.0)

# Example Usage

You can view examples in the [examples directory](https://github.com/BitGo/BitGoJS/tree/master/examples). You can view integration guides in the [Developer Portal](https://developers.bitgo.com/guides/get-started/intro).

# Enabling additional debugging output

`bitgo` uses the `debug` package to emit extra information, which can be useful when debugging issues with BitGoJS or BitGo Express.

When using the `bitgo` npm package, the easiest way to enable debug output is to set the `DEBUG` environment variable to one or more of the debug namespaces in the table below. You can enable multiple debug namespaces by using a comma-separated list or by using `*` as a wildcard. See the [debug package documentation](https://github.com/visionmedia/debug#readme) for more details.

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

Another debug namespace that BitGoJS doesn't provide but is helpful nonetheless is the `superagent` namespace. This outputs all HTTP requests and responses (only the URL, not bodies).

## Example

To run an SDK script with debug output enabled, export the `DEBUG` environment variable before running.

```shell script
export DEBUG='bitgo:*' # enable all bitgo debug namespaces
node myScript.js
```

To set debug namespaces in a browser, set the `localStorage.debug` property instead of the `DEBUG` environment variable using your browser's development tools console.

```js
localStorage.debug = 'bitgo:*'; // enable all bitgo debug namespaces
```

# Using with TypeScript

`bitgo` is not yet compatible with the `noImplicitAny` compiler option. To use this option in your project (and we recommend that you do), you must set the `skipLibCheck` option to suppress errors about missing type definitions for dependencies of `bitgo`.

# Usage in browser

Since version 6, `bitgo` includes a minified, browser-compatible bundle by default at `dist/browser/BitGoJS.min.js`. You can copy the bundle from there and paste it directly into your project.

You can also bundle BitGoJS with any module bundler. There's a Webpack configuration file already included, which you can use to trigger with package scripts.

For a production build: `npm run-script compile`

For a development (non-minified) build: `npm run-script compile-dbg`

To build the test suite into a single test file: `npm run-script compile-test`
