<h1 align="center">
  <pre>@bitgo/statics</pre>
</h1>
<h3 align="center">
  Static config for the BitGo platform
</h3>

<h3 align="center"><a href="https://docs.google.com/document/d/1NW9D652X_HvR8g6M8gB9vUsRiSwx_s43sLAL-3YzTno/edit#">TDD</a></h3>

## Goals
* Provide an "encyclopedia" of all relevant constants which are sprinkled throughout the BitGo stack.
* Separate *static* config data from *dynamic* config data
* Strong typing for static config properties, with full type information for configuration items
* Ability to export static configuration as JSON for consumption by non-javascript projects

## Examples

### Get the number of decimal places in a Bitcoin

#### Javascript
```js
const { coins } = require('@bitgo/statics');

const btc = coins.get('btc');
console.log(btc.decimalPlaces);
```

#### Typescript
```typescript
import { coins } from '@bitgo/statics';

const btc = coins.get('btc');
console.log(btc.decimalPlaces);
```

### Get the contract address for the OmiseGo ERC20 Token

#### Javascript
```js
const { coins } = require('@bitgo/statics');

const omg = coins.get('omg');
console.log(omg.contractAddress);
```

#### Typescript
```typescript
import { coins, Erc20Coin } from '@bitgo/statics';

const omg = coins.get('omg');
if (omg instanceof Erc20Coin) {
  console.log(omg.contractAddress);
}
```

### List full names of all defined coins

#### Javascript
```js
const { coins } = require('@bitgo/statics');

coins.forEach((coin) => {
  console.log(coin.fullName);
});
```

#### Typescript
```typescript
import { coins } from '@bitgo/statics';

coins.forEach((coin) => {
  console.log(coin.fullName);
});
```

## Status
* UTXO and account base types are defined
* Documentation is mostly source code comments and README examples
* This library can be depended on, but expect some changes going forward

## Project Structure
* `src/base.ts`: Interfaces and enums used by coin implementation classes.
* `src/coins.ts`: Coin definitions.
* `src/networks.ts`: Network interfaces and implementation classes.
* `src/utxo.ts`: Unspent Transaction Output (UTXO) based coin classes and factory function.
* `src/account.ts`: Account-based coin classes and factory methods. Includes ERC20 factory functions.
* `src/errors.ts`: Custom Error classes
