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

# NodeJS Version Support Policy

We only support [Long-Term Support](https://github.com/nodejs/Release) versions
of Node starting with [Node 8.9.0 (LTS)](https://nodejs.org/en/blog/release/v8.9.0).

We specifically limit our support to LTS versions of Node, not because this
package won't work on other versions, but because we have a limited amount of
time, and supporting LTS offers the greatest return on that investment. It's
possible this package will work correctly on newer or older versions of Node.

As each Node LTS version reaches its end-of-life we will remove that version
from the node engines property of our package's package.json file.  Removing a
Node version is considered a breaking change and will entail the publishing of
a new major version of this package. We will not accept any requests to support
an end-of-life version of Node. Any merge requests or issues supporting an
end-of-life version of Node will be closed. We will accept code that allows
this package to run on newer, non-LTS, versions of Node.  Furthermore, we will
attempt to ensure our own changes work on the latest version of Node. To help
in that commitment, our continuous integration setup runs the full test suite
on the latest release of the following versions of node:
* `6`
* `8`
* `10`
* `11`
* `lts`

JavaScript package managers should allow you to install this package with any
version of Node, with, at most, a warning if your version of Node does not fall
within the range specified by our node engines property. If you encounter
issues installing this package, please report the issue to your package
manager.

# Notes for Developers

See [DEVELOPERS.md](https://github.com/BitGo/BitGoJS/blob/master/DEVELOPERS.md)

