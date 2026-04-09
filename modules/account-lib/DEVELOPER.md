# Developer Guide

Thanks for contributing to this library. Below are some tips to help you
understand:

- the structure of the project
- the important classes and how they are used
- how to run the test suite
- how to contribute to the project

## Project Architecture

### Base Classes

As specified in [the project README](README.md), there are two main classes that
users will interact with:

- `TransactionBuilder`: A class that implements coin specific logic to handle
  the construction, validation, and signing of blockchain transactions.
- `Transaction`: JavaScript representations of blockchain transactions.

The `TransactionBuilder`'s job is to build and sign `transactions` for a
specific blockchain.

The flow typically looks something like:

```javascript
// Import package
const accountLib = require('@bitgo/account-lib');

// Instantiate a TransactionBuilder for the blockchain you wish to
// build a transaction for (in this case, Tron - testnet)
const txBuilder = accountLib.getBuilder('ttrx');

// Use the TransactionBuilder to build a transaction from JSON
const unsignedJsonTx = {...coin specific tx json...};
const txBuilder = txBuilder.from(unsignedJsonTx);

// Sign the transaction using the TransactionBuilder
txBuilder.sign({ key: 'SOME-PRIVATE-KEY' });
const tx = await txBuilder.build();

// Save it to json to be used elsewhere (or broadcast)
const signedTxJson = tx.toJson();
```

### Coin Specific Implementations

If you have spent time poking around the project, you likely noticed that we
have base `TransactionBuilder` and base `Transaction` classes - they live in
`src/coin/baseCoin`. These classes define the core interfaces that all
subclasses will extend and implement.

Coin specific implementations of the `TransactionBuilder` and `Transaction`
classes live under the coin's ticker symbol in `src/coin` (ie: `src/coin/trx`
for Tron). This is where the meat of the signing, validation, and encoding logic
lives for each blockchain supported by the library.

We recommend that you follow this pattern when adding a new coin to the library:

### Test Structure

Account Lib comes with unit tests and it is expected that all changes introduced
to the library increase test coverage. Tests live in `test`. Coin specific tests
live in `test/unit/coin/<coin-ticker>/<coin-ticker.js>`.

## (External) Resources

There are situations in which this library requires upstream dependencies, but
you might not want to pull in the entire library only to use the tiny slice of
functionality that we require. Rather, you can take snippets of the external
code and stick them in `resources/`. See
[the README in that directory for more information](resources/README.md).

## Running Tests

To run the test suite locally:

```
yarn test
```

## Coding Norms & Expectations

When contributing, we recommend that you follow the existing patterns defined in
the project. Pull requests that break these norms will likely be rejected or
require a round of feedback.

Take note:

> Do not specify default accessors. In TypeScript, the default accessor for a
> class attribute is `public`, so specifying it for functions and attributes is
> redundant.
