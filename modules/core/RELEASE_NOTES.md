# BitGoJS Release Notes

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
