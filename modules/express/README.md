# BitGo Express Local Signing Server (REST API)


Suitable for developers working in a language without an official BitGo SDK.

BitGo Express runs as a service in your own datacenter, and handles the client-side operations involving your own keys, such as partially signing transactions before submitting to BitGo.
This ensures your keys never leave your network, and are not seen by BitGo. BitGo Express can also proxy the standard BitGo REST APIs, providing a unified interface to BitGo through a single REST API.

# Installation

Please make sure you are running at least Node version 8 (the latest LTS release is recommended) and NPM version 6.
We recommend using `nvm`, the [Node Version Manager](https://github.com/creationix/nvm/blob/master/README.markdown#installation), for setting your Node version.

`npm install -g @bitgo/express`

# Running BitGo Express

`bitgo-express [-h] [-v] [-p PORT] [-b BIND] [-e ENV] [-d] [-l LOGFILEPATH] [-k KEYPATH] [-c CRTPATH]`

**Note:** When running against the BitGo production environment, you must run node in a production configuration as well. You can do that by running `export NODE_ENV=production` prior to starting bitgo-express.

For a full tutorial of how to install, authenticate, and use Bitgo Express, see the [Bitgo Express Quickstart](https://platform.bitgo.com/bitgo-express/)

# Release Notes

You can find the complete release notes (since version 4.44.0) [here](https://github.com/BitGo/BitGoJS/blob/master/RELEASE_NOTES.md).
