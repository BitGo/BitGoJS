BitGoJS
=======

BitGo JavaScript SDK

The BitGo Platform and SDK makes it easy to build multi-signature Bitcoin applications today.
The SDK is fully integrated with the BitGo co-signing service for managing all of your BitGo wallets.

Included in the SDK are examples for how to use the API to manage your multi-signature wallets.

Please join us on our [Slack channel](https://bitgodevs.slack.com) if you have questions or comments about this API.

[![Known Vulnerabilities](https://snyk.io/test/npm/bitgo/badge.svg)](https://snyk.io/test/npm/bitgo) [![Build Status](https://travis-ci.org/BitGo/BitGoJS.png?branch=master)](https://travis-ci.org/BitGo/BitGoJS)

# Installation

Please make sure you are running at least Node version 6 (`6.9.5` recommended) and NPM version 3 (`3.10.10` recommended).
We recommend using `nvm`, the [Node Version Manager](https://github.com/creationix/nvm/blob/master/README.markdown#installation), for setting your Node version.

`git clone https://github.com/BitGo/BitGoJS`

`cd BitGoJS`

`npm install`

# Full Documentation

View our [Javascript SDK Documentation](https://www.bitgo.com/api/?javascript#authentication).

# Example Usage

## Initialize SDK
Create an access token by logging into your bitgo account, going to the API access tab [in the settings area](https://www.bitgo.com/settings) and making a developer token.
```
var BitGo = require('bitgo');
var bitgo = new BitGo.BitGo({ accessToken: ACCESS_TOKEN }); // defaults to testnet. add env: 'prod' if you want to go against mainnet
bitgo.session({}, function(err,res) {
  console.dir(err);
  console.dir(res);
});
```

## Create Wallet
```
var wallet;
var params = { 
  "passphrase": "replaceme", 
  "label": "firstwallet"
}
bitgo.wallets().createWalletWithKeychains(params, function(err, result) {
  wallet = result.wallet; 
  console.dir(wallet.wallet);
  console.log("Locally created keychain: " + result.userKeychain.encryptedXprv);
});
```

## Create new address
```
wallet.createAddress({ "chain": 0 }, function callback(err, address) {
    console.dir(address);
});
```

## View transactions
```
wallet.transactions({}, function callback(err, transactions) {
    console.dir(transactions);
});
```

## Send coins
```
wallet.sendCoins({ 
  address: "2NEe9QhKPB2gnQLB3hffMuDcoFKZFjHYJYx", 
  amount: 0.01 * 1e8, 
  walletPassphrase:  "replaceme" 
}, function(err, result) {
    console.dir(result);
});
```

## More examples
Further demos and examples can be found in the [example](example/) directory and [documented here](https://www.bitgo.com/api/?javascript#examples).

# BitGo Express Local Signing Server (REST API)

Suitable for developers working in a language without an official BitGo SDK.

BitGo Express runs as a service in your own datacenter, and handles the client-side operations involving your own keys, such as partially signing transactions before submitting to BitGo.
This ensures your keys never leave your network, and are not seen by BitGo. BitGo Express can also proxy the standard BitGo REST APIs, providing a unified interface to BitGo through a single REST API.

`bin/bitgo-express [-h] [-v] [-p PORT] [-b BIND] [-e ENV] [-d] [-l LOGFILEPATH] [-k KEYPATH] [-c CRTPATH]`

For a full tutorial of how to install, authenticate, and use Bitgo Express, see the [Bitgo Express Quickstart](https://platform.bitgo.com/bitgo-express/)

# Usage in Browser

For use inside a browser, BitGoJS can be bundled with any module bundler. There is a Webpack configuration file already included, which can be triggered with package scripts.

For a production build: `npm run-script compile`

For a development (non-minified) build: `npm run-script compile-dbg`

To build the test suite into a single test file: `npm run-script compile-test`
