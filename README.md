# BitGo JavaScript SDK

The BitGo Platform and SDK makes it easy to build multi-signature crypto-currency applications today with support for Bitcoin, Ethereum and many other coins.
The SDK is fully integrated with the BitGo co-signing service for managing all of your BitGo wallets.

Included in the SDK are examples for how to use the API to manage your multi-signature wallets.

Please email us at support@bitgo.com if you have questions or comments about this API.

## Module Overview

The BitGo SDK repository is a monorepo composed of separate modules, each of which implement some subset of the features of the SDK.

| Package Name        | Module         | Description                                                                                                                       |                                                                           |
| ------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| bitgo               | `bitgo`        | Authentication, wallet management, user authentication, cryptographic primitives, abstract coin interfaces, coin implementations. | [Link](https://github.com/BitGo/BitGoJS/tree/master/modules/bitgo)        |
| @bitgo/account-lib  | `account-lib`  | Build and sign transactions for account-based coins.                                                                              | [Link](https://github.com/BitGo/BitGoJS/tree/master/modules/account-lib)  |
| @bitgo/blake2b      | `blake2b`      | Blake2b (64-bit version) in pure JavaScript.                                                                                      | [Link](https://github.com/BitGo/BitGoJS/tree/master/modules/blake2b)      |
| @bitgo/blake2b-wasm | `blake2b-wasm` | Blake2b implemented in WASM.                                                                                                      | [Link](https://github.com/BitGo/BitGoJS/tree/master/modules/blake2b-wasm) |
| @bitgo/blockapis    | `blockapis`    | Access public block explorer APIs for a variety of coins.                                                                         | [Link](https://github.com/BitGo/BitGoJS/tree/master/modules/blockapis)    |
| @bitgo/bls-dkg      | `bls-dkg`      | A simple implementation of BLS (Boneh-Lynn-Shacham signature scheme) + DKG (Distributed Key Generation)                           | [Link](https://github.com/BitGo/BitGoJS/tree/master/modules/bls-dkg)      |
| @bitgo/express      | `express`      | Local BitGo transaction signing server and proxy.                                                                                 | [Link](https://github.com/BitGo/BitGoJS/tree/master/modules/express)      |
| @bitgo/statics      | `statics`      | Static configuration values used across the BitGo platform.                                                                       | [Link](https://github.com/BitGo/BitGoJS/tree/master/modules/statics)      |
| @bitgo/unspents     | `unspents`     | Defines the chain codes used for different unspent types and methods to calculate bitcoin transaction sizes.                      | [Link](https://github.com/BitGo/BitGoJS/tree/master/modules/unspents)     |
| @bitgo/utxo-bin     | `utxo-bin`     | Command-line utility for BitGo UTXO transactions.                                                                                 | [Link](https://github.com/BitGo/BitGoJS/tree/master/modules/utxo-bin)     |
| @bitgo/utxo-lib     | `utxo-lib`     | Build and sign transactions for utxo-based coins.                                                                                 | [Link](https://github.com/BitGo/BitGoJS/tree/master/modules/utxo-lib)     |

# Release Notes

Each module provides release notes in `modules/*/CHANGELOG.md`.

The release notes for the `bitgo` module are [here](https://github.com/BitGo/BitGoJS/blob/master/modules/bitgo/CHANGELOG.md).

## Release Cycle

The BitGoJS SDK use a number of branches to control the development of various packages throughout the deployment lifecycle. Provided below is an overview to how branches relate to one another.

| Branch       | Status   | NPM      | Description                                                                                                                                             |
| ------------ | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `master`     | Unstable | N/A      | Ongoing development of SDK packages                                                                                                                     |
| `rel/latest` | Stable   | `latest` | Deployed packages from `master` to `rel/latest`. This includes Express and is recommended to use `rel/latest` when not using Docker images for Express. |

Other tags may be released to npm (e.g. `hotfix`, `dev`, etc...), but are not considered critical to the common path for consumers usage of SDK packages unless otherwise stated.

# Examples

Examples can be found in each of the modules specific to the module use cases. Starter examples can be found [here](https://github.com/BitGo/BitGoJS/tree/master/examples).

# NodeJS Version Support Policy

BitGoJS currently provides support for the following Node versions per package.json engines policy:

```
"engines": {
  "node": ">=16 <19",
  "npm": ">=3.10.10"
}
```

We specifically limit our support to these versions of Node, not because this package won't work on other versions, but because these versions tend to be the most widely used in practice. It's possible the packages in this repository will work correctly on newer or older versions of Node, but we typically don't run automated tests against non-specified versions of Node (including odd versions), with the possible exception of the latest odd numbered version for advanced awareness of upcoming breaks in version support.

As each Node LTS version reaches its end-of-life we will exclude that version from the node engines property of our package's package.json file. Removing a Node version is considered a breaking change and will entail the publishing of a new major version of this package. We will not accept any requests to support an end-of-life version of Node, and any pull requests or issues regarding support for an end-of-life version of Node will be closed. We will accept code that allows this package to run on newer, non-LTS, versions of Node. Furthermore, we will attempt to ensure our own changes work on the latest version of Node. To help in that commitment, our continuous integration setup runs the full test suite on the latest release of the following versions of node:

- `16`
- `18`

JavaScript package managers should allow you to install this package with any version of Node, with, at most, a warning if your version of Node does not fall within the range specified by our node engines property. If you encounter issues installing this package on a supported version of Node, please report the issue to us.

# Notes for Developers

See [DEVELOPERS.md](https://github.com/BitGo/BitGoJS/blob/master/DEVELOPERS.md)
