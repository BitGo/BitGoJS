# BitGo Javascript SDK

The BitGo Platform and SDK makes it easy to build multi-signature crypto-currency applications today with support for Bitcoin, Ethereum and many other coins.
The SDK is fully integrated with the BitGo co-signing service for managing all of your BitGo wallets.

Included in the SDK are examples for how to use the API to manage your multi-signature wallets.

Please email us at support@bitgo.com if you have questions or comments about this API.

## Module Overview

The BitGo SDK repository is a monorepo composed of separate modules, each of which implement some subset of the features of the SDK.

| Package Name | Module | Description | |
| --- | --- | --- | --- |
| bitgo | `core` | Authentication, wallet management, user authentication, cryptographic primitives, abstract coin interfaces, coin implementations | [Link](https://github.com/BitGo/BitGoJS/tree/master/modules/core) |
| @bitgo/express | `express` | Local BitGo transaction signing server and proxy | [Link](https://github.com/BitGo/BitGoJS/tree/master/modules/express) |

# Release Notes

Each module provides release notes in `modules/*/RELEASE_NOTES.md`.

The release notes for the `core` module are [here](https://github.com/BitGo/BitGoJS/blob/master/modules/core/RELEASE_NOTES.md).

# Notes for Developers

See [DEVELOPERS.md](https://github.com/BitGo/BitGoJS/blob/master/DEVELOPERS.md)

