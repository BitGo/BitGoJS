<h1 style="text-align: center;">
  <pre>@bitgo/statics</pre>
</h1>
<h3 style="text-align: center;">
  Static config for the BitGo platform
</h3>

## Goals

- Provide an "encyclopedia" of all relevant constants which are sprinkled throughout the BitGo stack.
- Separate _static_ config data from _dynamic_ config data
- Strong typing for static config properties, with full type information for configuration items
- Ability to export static configuration as JSON for consumption by non-javascript projects

## Examples

### Get the number of decimal places in a Bitcoin

#### JavaScript

```js
const { coins } = require('@bitgo/statics');

const btc = coins.get('btc');
console.log(btc.decimalPlaces);
```

#### TypeScript

```typescript
import { coins } from '@bitgo/statics';

const btc = coins.get('btc');
console.log(btc.decimalPlaces);
```

### Get the contract address for the OmiseGo ERC20 Token

#### JavaScript

```js
const { coins } = require('@bitgo/statics');

const omg = coins.get('omg');
console.log(omg.contractAddress);
```

#### TypeScript

```typescript
import { coins, Erc20Coin } from '@bitgo/statics';

const omg = coins.get('omg');
if (omg instanceof Erc20Coin) {
  console.log(omg.contractAddress);
}
```

### List full names of all defined coins

#### JavaScript

```js
const { coins } = require('@bitgo/statics');

coins.forEach((coin) => {
  console.log(coin.fullName);
});
```

#### TypeScript

```typescript
import { coins } from '@bitgo/statics';

coins.forEach((coin) => {
  console.log(coin.fullName);
});
```

## Repo Status

- UTXO and account base types are defined
- Documentation is mostly source code comments and README examples
- This library can be depended on, but expect some changes going forward

## Project Structure

- `src/base.ts`: Interfaces and enums used by coin implementation classes.
- `src/coins.ts`: Coin definitions.
- `src/networks.ts`: Network interfaces and implementation classes.
- `src/utxo.ts`: Unspent Transaction Output (UTXO) based coin classes and factory function.
- `src/account.ts`: Account-based coin classes and factory methods. Includes ERC20 factory functions.
- `src/errors.ts`: Custom Error classes.

## Installation + Building

To install the project locally, run the following steps:

```
$ # clone the project locally
$ git clone git@github.com:BitGo/statics.git

$ # npm install dependencies (optionally use node >8.6.0)
$ # (optionally) nvm install 8.6.0 -- required to run the linter which is executed pre-commit
$ # (optionally) nvm use 8.6.0
$ npm install
```

To build the project (from TypeScript to JavaScript):

```
$ npm run build
```

This builds the JavaScript and adds it to `dist/src/`. You will receive compilation errors if you have invalid syntax.

## Tests

To run tests:

```
$ npm run test
```
