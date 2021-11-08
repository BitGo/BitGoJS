# @bitgo/unspents

The package has two components:

- `Codes`: BitGo-defined chain codes for categorizing unspents.
- `Dimensions` class with methods to calculate bitcoin transaction sizes

## Installation

```
npm install --save @bitgo/unspents
```

## Chain Codes

Every unspent has two attributes

- purpose: `internal` or `external` (change or non-change).
- scriptType: `p2sh`, `p2shP2wsh`, `p2wsh`, or `p2tr`.

We define a chain code for every combination of these attributes, which is accessible as
`unspents.Codes[purpose][scriptType]` or `unspents.Codes[scriptType][purpose]`.

### Examples

```typescript
import { Codes } from '@bitgo/unspents';
console.log(Codes.p2shP2wsh.external, Codes.external.p2shP2wsh); // 10, 10

console.log(...Codes.p2shP2wsh.values); // 10, 11

console.log(
  Codes.isExternal(Codes.p2shP2wsh.internal),
  Codes.isExternal(Codes.p2shP2wsh.external),
  Codes.isP2shP2wsh(Codes.p2shP2wsh.internal),
  Codes.isP2shP2wsh(Codes.p2shP2wsh.external)
); // false, true, true, true

console.log(Codes.isExternal(-1)); // throws exception - invalid chain code
```

The `Codes` module further exposes the methods `Codes.isInternal(code)`,
`Codes.isExternal(code)`, `Codes.isP2shP2wsh(code)` etc.

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

`@bitgo/unspents` uses Drone for continuous integration, which is configured by the `.drone.yml` file in the project root. However, this file should not be modified by hand. All changes to the CI process should be done by modifying the `.drone.jsonnet` file, then running `npm run generate_drone` to rebuild the `.drone.yml` file.
