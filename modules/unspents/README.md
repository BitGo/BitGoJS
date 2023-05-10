# @bitgo/unspents

The package provides a `Dimensions` class with methods to calculate bitcoin transaction sizes

## Installation

```
npm install --save @bitgo/unspents
```

## Dimensions, Virtual Size Estimation

The transaction vSize is critical to calculating the proper transaction fee.

The class `unspents.Dimensions` provides a class that helps work with the components required
to calculate an accurate estimate of a transaction vSize.

### Examples

```typescript
import { Codes, Dimensions } from '@bitgo/unspents';
// using raw attributes
new Dimensions({
  nP2shInputs: 1,
  nP2shP2wshInputs: 1,
  nP2wshInputs: 1,
  outputs: { count: 1, size: 32 },
});

// calculate from unspents that have `chain` property (see Chain Codes)
Dimensions.fromUnspents(unspent[0]);
Dimensions.fromUnspents(unspents);

// Signed inputs work too
Dimensions.fromInput(inputs[0]);
Dimensions.fromInputs(inputs);

// Transaction outputs
Dimensions.fromOutputs(outputs[0]);
Dimensions.fromOutputs(outputs);
Dimensions.fromOutputOnChain(Codes.p2sh.internal);
Dimensions.fromOutputScriptLength(31);

// Combining dimensions and estimating their vSize
Dimensions.fromUnspents({ unspents })
  .plus(Dimensions.fromOutputOnChain(Codes.p2shP2wsh.internal).times(nOutputs))
  .getVSize();
```

## Publishing new versions

Publishing new versions should be done by running the publish script in `scripts/publish.sh`.

It can be invoked with the name of the branch to release, and will default to the currently checked out branch if not given.

It will perform validation of all prepublish conditions, run a dry-run publish, then, if successful, a real publish. After that is complete,
the newly installed package will be downloaded and `require()`'d to ensure the package was published correctly.

## Continuous Integration

`@bitgo/unspents` uses github actions for continuous integration, which is configured by the `.github/workflows/ci.yml` file in the project root. All changes to the CI process should be done by modifying the `.github/workflows/ci.yml` file.

## `Codes`

The exported `Codes` module is now deprecated.

Please use [`utxo-lib/src/bitgo/wallet/chains`](https://github.com/BitGo/BitGoJS/blob/0439a0d4ffe4a15a9932ed70f98cc5745cc6526f/modules/utxo-lib/src/bitgo/wallet/chains.ts) instead.
