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

## Status
* Entirely WIP
* __Everything__ is subject to change
* This library should not be depended on in it's current form.

## Project Structure
* `src/base.ts`: Interfaces and enums used by coin definitions
* `src/coins.ts`: Coin definitions
* `src/networks.ts`: Network definitions
* `src/stringTypes.ts`: Tagged string literal functions and other string-based types
* `src/utxo.ts`: Unspent Transaction Output (UTXO) based coin classes and factory method
