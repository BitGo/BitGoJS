# BitGoJS Release Notes

## 9.5.3 (02-14-2020)

### Other Changes
* Update `@bitgo/statics` to version 3.3.0

## 9.5.2 (02-11-2020)

### Bug Fixes
* Recreate XLM integration test wallets following quarterly XLM testnet reset.

### Other Changes
* Update `@bitgo/statics` to version 3.2.0

## 9.5.1 (02-04-2020)

### Bug Fixes
* Add missing properties `redeemScript` and `witnessScript` to typescript interface `SignTransactionOptions`.

### Other Changes
* Update `@bitgo/statics` to version 3.1.1

## 9.5.0 (01-29-2020)

### Bug Fixes
* Remove usage of deprecated bufferutils function `bufferutils.reverse`.

### Other Changes
* Update `@bitgo/statics` to version 3.1.0

## 9.4.1 (01-21-2020)

### Bug Fixes
* Fix incorrect aliasing of interface `TransactionExplanation` in Algorand implementation.

### Other Changes
* Update `@bitgo/statics` to version 3.0.1

## 9.4.0 (01-15-2020)

### New Features
* Allow creation of random EOS addresses.
* Lock transactions to next block to discourage fee sniping.

### Other Changes
* Update `@bitgo/statics` to version 3.0.0

## 9.3.0 (12-17-2019)

### New Features
* Return key registration data for Algorand's `explainTransaction()`

### Bug Fixes
* Fix circular json serialization error when using `accelerateTransaction`
* Filter out duplicate addresses when doing address lookups for cross chain recoveries
* Allow EOS addresses to begin with a number
* Properly deserialize EOS staking transactions
* Ensure `Error.captureStackTrace` is defined before using, as this is not standard and only available in V8-based Javascript runtimes.

### Other Changes
* Improve the `DEVELOPERS.md` document, which helps to onboard new developers who want to work on the BitGo SDK itself.
* Add a basic GitHub issue template

## 9.2.0 (12-10-2019)

### Other Changes
* Update `bitgo-utxo-lib` to version 1.7.0 for new ZCash chain parameters
* Check for wrapped segwit unspents in express v1 integration test

## 9.1.0 (12-04-2019)

### New Features
* Use BitGo Stellar Federation proxy for Stellar Federation lookups

### Bug Fixes
* Reject hop params for ERC20 token transaction builds, as these do not make sense

## 9.0.1 (11-27-2019)

### Bug Fixes
* Fix TRON recovery transaction object format

### Other Changes
* Include recovery amount for TRON recovery transactions

## 9.0.0 (11-20-2019)

### Breaking Changes
* Support for Node 6 has been dropped. Node 8 is now the oldest supported version.

### New Features
* Partial support for recoveries of TRON wallets

### Other Changes
* Remove deprecated v1 examples
* Update Javascript and Typescript examples
* Remove node 6 and node 11 from Drone CI

## 8.5.3 (12-17-2019)

### New Features
* Backported from 9.3.0: Return key registration data for Algorand's `explainTransaction()`

## 8.5.2 (11-13-2019)

### Bug Fixes
* Unify TRON keycard key format with other coins

## 8.5.1 (11-08-2019)

### Bug Fixes
* If given, pass seed to TRON account generation utility function provided by `bitgo-account-lib`

### Other Changes
* Resolve dependency `handlebars` to version 4.5.0
* Update dependency `bitgo-account-lib` to  version 0.1.5

## 8.5.0 (11-06-2019)

### New Features
* Enable usage of new Unspent Reservation system when building transactions. Using this feature allows a transaction to temporarily have an exclusive right to spend a one or more UTXO(s). This can help prevent unspent not found errors when sending interleaved transactions.
* Allow signing TRON transactions with a raw extended private key.
* Allow explaining a TRON transaction from the raw transaction hex using `explainTransaction()`

### Bug Fixes
* Remove unimplemented and unnecessary override of `deriveKeyWithSeed` for TRON
* Allow both base58 and hex addresses for TRON
* Fix number of decimals for offchain Stellar
* Return fully signed TRON transaction in same format as other coins

### Other Changes
* Import `@bitgo/statics` library into BitGo SDK monorepo
* Update `bitgo-account-lib` to version 0.1.4
* Recreate Stellar integration test wallets following testnet reset
* Limit Stellar trustline transactions by using base units instead of native units
* Temporarily use node 10 in Drone pipelines instead of LTS

## 8.4.0 (10-25-2019)

### New Features
* Allow removing Stellar Trustlines from a wallet
* Add additional environment presets for new BitGo backend environments

### Bug Fixes
* Fix incorrect precedence in environment configurations

### Other Changes
* Resolve `https-proxy-agent` to version 3.0.0 for patch in `ripple-lib`
* *Unstable feature*: Add support for sending from TRON hot wallets
* Add missing options types in `Wallet` and `Wallets` classes
* Add new internal method `manageUnspents` to `Wallet`. This method combines the fanouts and consolidation implementations into a single method. *Note:* There is no change to the public API.
* Enable more strict Typescript compilation options, update code which was not compatible

## 8.2.4 (10-18-2019)

__No changes__

## 8.2.3 (10-18-2019)

### Other Changes
* Update dependency `@bitgo/statics` to version 2.2.0

## 8.2.2 (09-27-2019)

### Bug Fixes
* Use `require()` instead of ES `import()` for dynamically importing ethereum dependencies. This was causing issues in browsers.

### Other Changes
* Resolve `handlebars` dependency to `^4.3.0` for patch in dev dependency

## 8.2.1 (09-24-2019)

### Bug Fixes
* Fix importing `ethereumjs-util` in browsers, where it was previously failing
* Fix hop transactions which need to go through a pending approval flow
* Fix two broken/flaky Ethereum and XRP tests

### Other Changes
* Allow custom env to use testnet server public key if network is testnet.
* Revert enabling batched Ethereum sends due to incompatibility in `validateTransaction`

## 8.2.0 (09-19-2019)

### New Features
* Generate and upload BitGo SDK documentation on each build run. See [here](https://bitgo-sdk-docs.s3.amazonaws.com/core/8.2.0/index.html) for an example.
* Improve `explainTransaction` so it can explain Stellar Trustline and Stellar Token transactions

### Bug Fixes
* Export all Typescript types which are part of the public API. If you find there is a type which is used in the public API but not exported, please open an issue.
* Fix incorrect implementation of `getChain` for Stellar Tokens
* Fix incorrect Content Type on documentation uploaded by Drone CI
* Fix inadvertent param rename instead of type specification, and duplicate identifier (thanks @workflow and @arigatodl)

### Other Changes
* Clean up and update all examples
* Separate JavaScript examples from Typescript examples
* Remove examples for removed v1 Ethereum code
* Improve error message displayed when optional Ethereum libraries could not be required
* *Unstable feature*: Allow for creation of TRON wallets

## 8.1.2 (09-19-2019)

### New Features
* Allow `gasLimit` param to be sent when prebuilding Ethereum transactions

### Bug Fixes
* Fix type custom type inclusion in core module
* Move superagent type augmentation into `core/types`

## 8.1.1 (09-11-2019)

### Bug Fixes
* Fix superagent typescript declaration augmentation
* Pass `gasLimit` when creating Ethereum transaction prebuilds

## 8.1.0

### New Features
* Use `@bitgo/statics` for ERC20 and OFC coin definitions

### Bug Fixes
* Fix bug in `isValidAddress` which would cause it to incorrectly return true for coins which don't support bech32.
* Remove deprecation markers for the following functions:
  * `verifyPassword()`
  * `generateRandomPassword()`
  * `extendToken()`

### Other Changes
* Upgrade `@bitgo/statics` to 2.0.0-rc.0
* Upgrade `bitgo-utxo-lib` to 1.6.0
* Enable `strictNullChecks` typescript compiler option
* More Typescript improvements across the project. `baseCoin.ts` and `bitgo.ts` in particular have seen much improvement.
* Fix HMAC errors when doing non-BitGo EOS recoveries

## 8.0.0

### Breaking Changes

#### Elimination of synchronous error behavior for async functions
* Previously, some async functions had strange error behavior where they would throw a synchronous error sometimes, and fail with a rejected promise other times. Which behavior you get for a given error is only really discoverable via source code inspection. Depending on how callers handled async calls and errors, this could break some callers.
* One example of a changed function is `bitgo.refreshToken()`, which previously would throw a synchronous error if the `params.refreshToken` were not provided. This function can also return a Bluebird promise, which will reject if there is a failure with the network request. If you are a caller who uses `.then()` to handle async behavior, some errors which previously required a surrounding `try`/`catch` will now fall through to a `.catch()` handler attached to the returned promise.

Perhaps an example will help clarify:

```javascript
const BitGoJS = require('bitgo');
const bitgo = new BitGoJS.BitGo({ env: 'test' });

try {
  bitgo.refreshToken()
    .then(() => console.log('then'))
    .catch(() => console.log('async catch'));
} catch (e) {
  console.log('sync catch');
}
```

Previous to version 8, the string `sync catch` would have been printed for some errors, and `async catch` would have been printed for others. In version 8 and later, `async catch` should be printed regardless of the error encountered. If you find this is not the case, then this is a bug and please open issue so we can correct it. We may alter more async functions to match this behavior if needed, and this major version bump will cover those changes as well (there will not be another major version bump for similar changes in the future).

By eliminating one error channel, correct error handling is greatly simplified for callers. The goal here is to make all async functions always return a promise and never throw directly (instead, the returned promise would be rejected).

If you are relying on synchronous error behavior from an async function, this breaking change may require fixes in calling code.

**Note:** If you are using `async/await` syntax, or a helper library like Bluebird which turns async promise rejections into sync errors, this change will not affect you. We currently recommend using `async/await` syntax for new code written against BitGoJS.

If you believe you may be affected by this breaking change, and would like more information or a complete list of functions which have been altered in this way, please send an email to support at bitgo dot com.

#### Deprecation of v1 methods on BitGo object
* There are several methods on the BitGo object which have been deprecated in this release. These methods lead to the version 1 wallet codebase, and is a common source of errors for new users of BitGoJS. To make it clear that these are not the functions recommended for normal usage, they have been deprecated. The complete list of newly deprecated functions is as follows:
  * `sendOTP()`
  * `reject()`
  * `verifyAddress()`
  * `blockchain()`
  * `keychains()`
  * `market()`
  * `wallets()`
  * `travelRule()`
  * `pendingApprovals()`
  * `registerPushToken()`
  * `verifyPushToken()`
  * `newWalletObject()`
  * `estimateFee()`
  * `instantGuarantee()`
  * `getBitGoFeeAddress()`
  * `getWalletAddress()`
  * `listWebhooks()`
  * `addWebhook()`
  * `removeWebhook()`
  * `getConstants()`
  * `calculateMinerFeeInfo()`

Additionally, `ethSignMsgHash` in `util.ts` has been deprecated. This will be relocated to an Ethereum specific part of the code in the future.

Direct usage of the `env` property of the BitGo object has also been deprecated. Please use `bitgo.getEnv()` as an alternative.

**Note:** We have no immediate plans to remove these functions. If you are relying on these functions, they will continue to work, but you should begin considering alternatives provided by the version 2 wallet API. If you find there is a feature gap which is preventing you from moving to the v2 wallet API, please send an email to support at bitgo dot com.

**Note:** The following functions have been incorrectly marked as deprecated in the source code, but in fact are NOT deprecated. This will be fixed in the next version of BitGoJS:
* `verifyPassword()`
* `generateRandomPassword()`
* `extendToken()`

**Note:** We may deprecate more functions, and these deprecations may be done without a major version bump. However, prior to any deprecated method being actually removed and made unavailable, a major version bump will be required.

### New Features
* Add support for ERC 20 tokens (CIX100, KOZ, AGWD)

### Bug Fixes
* Fix incorrect parameters in keycard.ts (thanks @DCRichards)

### Other Changes
* Refactor Settlement API and add function for calculating settlement fees. Note that this API is still experimental and is not yet ready for general usage.
* Update microservices authentication route format.
* Improve Typescript support in expressApp, Ethereum and ERC 20 token implementations, recovery and BitGo object.

## 7.1.1

### Other Changes
* Allow creation of wallets with custom addresses, where supported (currently only EOS supports this feature).

## 7.1.0

### New Features
* Add support for new ERC 20 tokens (TGBP)
* Support for applying second signature to ALGO transactions
* Update EOS transaction prebuild format
* Implement `isValidAddress` for Offchain Tokens

### Bug Fixes

### Other Changes
* Improve Typescript support in many coin implementations.

## 7.0.0

### Breaking Changes
The `explainTransaction` method on in BaseCoin is now asynchronous. Callers of this method will need to resolve the returned promise in order to make use of the return value.

As an example, before the behavior of `explainTransaction` was as follows (parameters omitted for brevity):
```typescript
const explanation = bitgo.coin('tbtc').explainTransaction(...);
console.dir(explanation);
```

In version 7 and later, the behavior is now:
```typescript
const explanation = await bitgo.coin('tbtc').explainTransaction(...);
console.dir(explanation);
```

or, if you can't use async/await:
```typescript
bitgo.coin('tbtc').explainTransaction(...)
.then(explanation => {
  console.dir(explanation);
});
```

This breaking change was required since some of the coins we are considering adding in the future are unable to implement `explainTransaction` in a synchronous way.

### New Features
* Update contract address for ERC20 token LGO
* Add support for new ERC20 tokens (THKD, TCAD, EDN, EMX)

### Other Changes
* Add node version support policy to README
* Improve typescript support in many files, including `BaseCoin`, `Utils`, `AbstractUtxoCoin`, and several others
* Autoformat code upon commit and check code format during CI

## 6.2.0

### New Features
* Allow creating BitGo objects which use a custom Stellar Federation server URL.
* Add support for new ERC20 tokens (LEO, CREP, CBAT, CZRX, CUSDC, CDAI, CETH, VALOR).
* Update trade payload version to `1.1.1`.

### Bug Fixes
* Update to lodash@^4.17.4 for a vulnerability fix for CVE-2019-10744.
* Ensure amount is correctly passed through to server for Ethereum fee estimation
* Update ZEC block explorer used in recovery flows

### Other Changes
* Improve Typescript support in `webhooks.ts`, `internal.ts`, `common.ts`, and `environments.ts`

## 6.1.1

### Bug Fixes
* Fix issue where accepting a wallet share as a viewer would fail to correctly update the server.

## 6.1.0

### New Features
* Add support for deriving ed25519 hardened child public keys, used by XLM and other ed25519-based coins.
* Update documentation to point to new docker image for BitGo Express (`bitgosdk/express`). The `bitgo/express` image is now deprecated.
* Add support for new ERC20 tokens (DRPU, PRDX, TENX, ROOBEE, ORBS, VDX, SHR)

### Other Changes
* Preliminary support for EOS. Please note that this API is not finalized, and is subject to API breaking changes in minor and/or patch version releases without warning.
* Validate Ethereum hop transaction signatures against static Platform HSM key instead of wallet BitGo key
* Improve Typescript support for `Wallet` and `Wallets` objects, as well as the XLM coin implementation
* Extract example keycard rendering logic out of `Wallet`

## 6.0.0
The BitGoJS SDK is being modularized! The code base has been split into two modules: `core` and `express`.

`core` contains the Javascript library that you get when you `require('bitgo')`.

`express` contains the source for the BitGo Express local signing server, and it uses the `core` module to provide access to BitGoJS functionality over a REST interface.

The long term plan is to modularize based on each underlying coin library, so users of `bitgo` won't need to bring in many large dependencies for coins they aren't using. This may require additional major versions if breaking changes are required, but we will do as much as possible to maintain the current API of the BitGoJS SDK.

### Breaking Changes
* Users who pin a git hash of BitGoJS in their package.json will need to update their build steps, since the structure of the git repository has changed. If the desire is to simply use bitgo as a Javascript library outside a browser context, we recommend using a semantic version string instead of a git hash to specify which version should be installed. For development in a browser setting, a browser compatible bundle is now distrubuted in the package at `node_modules/bitgo/dist/browser/BitGoJS.min.js`. As an alternative to downloading the package from npm, a tarball of BitGoJS could also bundled in your application and used during install.
* `bitgo-express` is no longer bundled with the `bitgo` npm package. The recommended install instructions are now to install via the official Docker image `bitgosdk/express:latest`. If you aren't able to run bitgo-express via Docker, you can also install and run `bitgo-express` from the source code. See the [`bitgo-express` README](https://github.com/BitGo/BitGoJS/tree/master/modules/express#running-bitgo-express) for more information on how to install and run BitGo Express.
* For version 1 wallets, the bitcoin network by the BitGo object is no longer global, and is now determined by the bitgo object's environment when it was initialized.

As an example, before the behavior was as follows:
```typescript
const BitGoJS = require('bitgo');
// create a new bitgo object using the default (test) environment
const bitgo = new BitGoJS.BitGo();

// BAD: Global network is checked by all bitgo objects, but this
// leads to race conditions when multiple bitgo objects are setting the
// global bitcoin network unpredictably
BitGoJS.setNetwork('bitcoin');
// verify a main net address using bitgo object using test environment
bitgo.verifyAddress({ address: '1Bu3bhwRmevHLAy1JrRB6AfcxfgDG2vXRd' }).should.be.true();
```

After version 6, the behavior will change to this:
```typescript
const BitGoJS = require('bitgo');

// create a new bitgo object using the default (test) environment
const bitgo = new BitGoJS.BitGo();

// BREAKING CHANGE: returns false since this bitgo object is using
// the test environment and cannot verify a main net address
bitgo.verifyAddress({ address: '1Bu3bhwRmevHLAy1JrRB6AfcxfgDG2vXRd' }).should.be.true();

// create a new bitgo object using the production environment
const prodBitgo = new BitGoJS.BitGo({ env: 'prod' });

// OK: Able to verify main net address with bitgo using production environment
prodBitgo.verifyAddress({ address: '1Bu3bhwRmevHLAy1JrRB6AfcxfgDG2vXRd' }).should.be.true();
```

To switch to another bitcoin network, a new bitgo object should be constructed in the correct environment.

### New Features
* Preliminary support for BitGo Trading Account and Settlement APIs. Please note that this API is not finalized, and is subject to API breaking changes in minor and/or patch version releases without warning.
* Preliminary support for Algorand. Please note that this API is not finalized, and is subject to API breaking changes in minor and/or patch version releases without warning.
* Add support for new ERC 20 Token (PDATA)

### Other Changes
* Overhaul how coins are loaded, in anticipation of a pluggable coin system in a future version of `bitgo`.
* Rework CI system to reduce test runtimes by running tests for each module in parallel
* Create and upload mochawesome report after each test run. [Here's an example](https://bitgo-sdk-test-reports.s3.amazonaws.com/1166/core/integration%20tests%20\(node:lts\).html).
* Remove coin instantiation logic from BaseCoin and move methods to prototype instead of attaching to coin object instances.

## 5.4.0

### New Features
* Add support for verifying and signing Ethereum hop transactions
* Add support for new ERC 20 tokens (TIOX, SPO)

### Bug Fixes
* Remove duplicate ERC 20 token definition (AION)

## 5.3.0

### New Features
* Add support for new ERC 20 tokens (USX, EUX, PLX, CQX, KZE)

### Other Changes
* Improve test performance by making more requests in parallel when checking wallet funding
* Fix bitgo-express startup command on Windows where the shebang line is ignored

## 5.2.0

### New Features
* Add support for new ERC 20 tokens (WHT, AMN, BTU, TAUD)
* Add support for trade payload signing

### Bug Fixes
* Allow sharing "pseudo-cold" wallets where the encrypted user key is not held by BitGo.
* Correctly update matching wallet passphrases when the user login password is updated.
* Add missing filter parameters in `wallet.transfers`.

### Other Changes
* Update README to clarify package description and improve example snippets

## 5.1.1

### Bug Fixes
* Separate input signing and signature verification steps in `AbstractUtxoCoin.signTransaction`. This fixes an issue where Native Segwit inputs which were not the last input in the transaction were not being properly constructed.

## 5.1.0

### New Features
* Add support for counting the number of valid signatures on Native Segwit transaction inputs in `explainTransaction`.

### Bug Fixes
* Update `bitgo-express` startup command in README. Running directly from the cloned git repository is no longer recommended.
* Add install size and timing metrics to CI system.

### Other Changes
* Remove version 1 support for Ethereum wallets and associated tests. This functionality has been broken for some time due to the required server side routes being removed.

**V2 Ethereum wallets are unaffected**. If your Ethereum wallet was working before this change, it will continue functioning normally.

## 5.0.4

### Bug Fixes
* Fix `npm audit` failures caused by newly disclosed vulnerabilities in development dependencies `eslint`, `husky`, `lint-staged`, and `nyc`. This fix has been backported to the `bitgo@4` series as release `4.49.2`.

## 5.0.3

### Bug Fixes
* Fix unhanded error in `explainTransaction()` causing approval failures for transactions which require replay protection.

### Notes
* This version was not published to npm due to `npm audit` failures which would be present upon install. These issues were fixed in version 5.0.4, which was released on npm.

## 5.0.2

### Bug Fixes
* Readd ERC 20 token `NAS`

## 5.0.1

### Bug Fixes
* Fix incorrect import in test file that was causing errors on install and when running tests (#297)

## 4.49.2
This is a maintenance update to the `bitgo@4` major version.

### Bug Fixes
* Backport updates to dev dependencies `nyc` and `fsevents` to fix `npm audit` failures.

## 4.49.1
This is a maintenance update to the `bitgo@4` major version.

### Bug Fixes
* Update `@bitgo/unspents` to 0.5.1 for a fix for an incompatibility issue in `tsc@3.4`

## 5.0.0
* BitGoJS is now a typescript project!
  * `tsc` now runs as a prepublish step.
  * We have added type definitions to some of our coin specific files, and we will continue to add and improve on our published type information.

### Breaking Changes
* Dropped support for node versions below 6.12.3. We will be publishing a more detailed policy on node and npm version support soon.

### New Features
* Typescript
* Type information for XRP and TXRP
* Added support for new ERC 20 tokens (UPT, UPUSD, UPBTC, FET)

### Bug Fixes
* Removed duplicated transaction and address contants in favor of using `@bitgo/unspents` for equivalent contants.
* Fix error thrown when randomly generated private key starts with a zero byte which would cause message signing failures. Transaction signing is not affected.
* Fix bug which caused only the first consolidation transaction to be returned from `consolidateTransaction()` for v1 wallets instead of all transations.

### Other changes
* Updated the install instructions for BitGoJS to `npm install bitgo` instead of cloning the project directly. This has an effect on how to run `bitgo-express`. To install and run `bitgo-express`, the recommended command is `npm install -g bitgo && npm explore -g bitgo -- bin/bitgo-express`.
* Upgraded eslint to 5.15.1, which entails dropping support for development on BitGoJS on node versions below 6.14.0. If you need to develop on node 6.x, please use at least 6.14.0, and consider upgrading soon as [node 6 is scheduled to reach end-of-life on April 30, 2019](https://github.com/nodejs/Release#release-schedule). Only users of BitGoJS who are contributing source code changes are affected by this requirement. End users can continue using node versions >=6.12.3, but please upgrade soon.
* Remove karma browser testing framework. We will be revamping our browser testing in a future release.

### Common Issues when Upgrading

#### Warning on installation

You may notice a warning when installing BitGoJS about using a deprecated script type:
```
npm WARN prepublish-on-install As of npm@5, `prepublish` scripts are deprecated.
npm WARN prepublish-on-install Use `prepare` for build steps and `prepublishOnly` for upload-only.
npm WARN prepublish-on-install See the deprecation note in `npm help scripts` for more information.
```

This is expected, and we cannot yet change to using a prepare script because this script type is not yet available in some of our supported npm versions.

#### Potential error when starting `bitgo-express`
If you see the following error when running `bin/bitgo-express`, it means the typescript files have not been compiled.
```
module.js:478
    throw err;
    ^

Error: Cannot find module '../dist/src/expressApp'
    at Function.Module._resolveFilename (module.js:476:15)
    at Function.Module._load (module.js:424:25)
    at Module.require (module.js:504:17)
    at require (internal/module.js:20:19)
    at Object.<anonymous> (/bitgo-dep/node_modules/bitgo/bin/bitgo-express:5:66)
    at Module._compile (module.js:577:32)
    at Object.Module._extensions..js (module.js:586:10)
    at Module.load (module.js:494:32)
    at tryModuleLoad (module.js:453:12)
    at Function.Module._load (module.js:445:3)
    at Module.runMain (module.js:611:10)
    at run (bootstrap_node.js:394:7)
    at startup (bootstrap_node.js:160:9)
    at bootstrap_node.js:507:3
```
To fix this, You can compile the typescript source manually by running `npm explore bitgo -- npm run prepublish`.

#### Installing as root
`npm` does not run prepublish scripts if it is running as root. This means the typescript source will not be compiled and an error will be thrown when attempting to require bitgo. This includes installing bitgojs as a dependency in the node_modules of another project.

When this happens, you will see this message when running `npm install`:
```
npm WARN lifecycle bitgo@5.0.0~prepublish: cannot run in wd %s %s (wd=%s) bitgo@5.0.0 tsc && node scripts/copySjcl.js /bitgojs
```

If you really need to install BitGoJS as root, you'll have to install it using `npm install --unsafe-perm`.

## 4.49.0
### New Features
- Complete support for native segwit address generation and verification
- Ensure match between addressType and chain parameters when calling `generateAddress()`
- Use `@bitgo/unspents` for address chain information
- Add support for overriding the server extended public key used by BitGoJS
- Add support for new ERC 20 tokens (SLOT, ETHOS, LBA, CDAG)

### Bug Fixes
- Get latest block height and transaction prebuild in parallel

### Deprecation Notices
The following parameters to the `generateAddress()` function on `Wallet` objects have been deprecated, and will be removed in a future version of BitGoJS:
- `addressType`
- `segwit`
- `bech32`

Instead, the address type will be determined by the `chain` parameter, with the following behavior:

| chain | type | format | usage    |
| ----- | ---- | ------ | -------- |
| 0     | pay to script hash | base58 | External |
| 1     | pay to script hash | base58 | Internal (change) |
| 10    | wrapped segwit | base58 | External |
| 11    | wrapped segwit | base58 | Internal (change) |
| 20    | native segwit | bech32 | External |
| 21    | native segwit | bech32 | Internal (change) |

## 4.48.1
### Bug Fixes
- Treat errors thrown from `verifySignature` as an invalid signature

## 4.48.0
### New Features
- Add ability to count signatures on a utxo transaction to `explainTransaction()`
- Add support for generating unsigned sweep transactions for Stellar Lumens (XLM) and Ripple XRP (XRP)
- Add support for recovering Bitcoin Satoshi Vision (BSV) inadvertently sent to a Bitcoin (BTC) address
- Add support for new ERC 20 Tokens (BAX, HXRO, RFR, CPLT, CSLV, CGLD, NZDX, JPYX, RUBX, CNYX, CHFX, USDX, EURX, GBPX, AUDX, CADX, GLDX, SLVX, SLOT, TCAT, TFMF)

### Bug Fixes
- Improve handling proxy request timeouts from bitgo-express
- Prevent rebuilding OFC transactions upon transaction approval
- Allow creation of new addresses on wallets returned from `wallets().list()`
- Return actual fee used from `wallet.sendMany()` instead of fee estimate
- Fix date and name on LICENSE
- Update dev-dependency karma to 4.0.1 to fix minor upstream vulnerability
- Allow accessing `oauth/token` route from bitgo-express
- Add `.nvmrc` with version set to `lts/carbon`
- Fix ERC 20 Token BID decimal places

### API changes
- Remove `bech32` parameter option from `createAddress`
- Add `strategy` parameter option to `prebuildTransaction` for setting the preferred unspent selection strategy

## 4.47.0
### New Features
- Add support for new ERC 20 Token (BAX)
- Allow passing custom unspent fetch parameters to `createTransaction`
- Handle missing optional Ethereum dependencies more gracefully
- Allow fetching of SegWit unspents for Ledger-backed wallets

### Bug Fixes
- Specify exact versions of dependencies
- Update token contract hash for ERC20 Token (BID)

## 4.46.0
### New Features
- Add support for new ERC 20 Tokens (AMON, CRPT, AXPR, GOT, EURS)

### Bug Fixes
- Use normalized amount field for recovery amounts for UTXO coins

## 4.45.1
### Bug Fixes
- Do not sign replay protection inputs for TBSV

## 4.45.0
### New Features
- Add support for recovering BTC segwit unspents
- Add support for new ERC 20 Tokens (HEDG, HQT, HLC, WBTC)
- Add some plumbing for BSV and OFC support
- Support coinless API routes in Bitgo Express

### Bug Fixes
- Allow XLM recovery to previously unfunded addresses
- Correctly handle sends with a custom change address

## 4.44.0
### New Features
- CPFP support for v2 BTC wallets
- New function on v2 keychains prototype (`updateSingleKeychainPassword`) to change a keychain's password
- Improve sequenced request ID support to cover more requests

### Bug Fixes
- Fix an issue involving approving multiple pending approvals whose transactions spent the same unspent.
- Improve formatting for large numbers used in `baseUnitsToBigUnits`
- Disallow proxying of non-API requests through BitGo Express
- Check for both `txHex` and `halfSigned` parameters in Wallet `prebuildAndSignTransaction`
- Improve handling of failed stellar federation lookups
