# TypeScript Import Equals Summary

This report summarizes all TypeScript files in the BitGoJS repository that contain the `import something = require('something')` syntax pattern, which needs to be converted to ES module imports.

## Total Count
- **Total occurrences found**: 36 (excluding dist/ directories)
- **Number of unique files**: 31

## Breakdown by Module Type

### Most Common Imports

1. **`should` (test assertion library)**: 19 occurrences
   - Found in various test files across sdk-coin-* modules
   
2. **`nock` (HTTP mocking library)**: 8 occurrences
   - Found in test files for mocking HTTP requests
   
3. **`Long` (long integer library)**: 2 occurrences
   - Found in protobuf definition files
   
4. **`package.json` imports**: 2 occurrences
   - Found in main module files for version information
   
5. **Other libraries**: 5 occurrences
   - `express`, `sjcl`, `shamir`, `debugLib`, `Wallet`, `lodash`, `FastPriorityQueue`

## Files by Category

### Source Files (Non-Test)
1. `/Users/zahinmohammad/workspace/bitgo/BitGoJS/modules/bitgo/src/bitgo.ts` - `import pjson = require('../package.json')`
2. `/Users/zahinmohammad/workspace/bitgo/BitGoJS/modules/sdk-api/src/bitgoAPI.ts` - 3 imports: `shamir`, `pjson`, `Wallet`
3. `/Users/zahinmohammad/workspace/bitgo/BitGoJS/modules/sdk-api/src/v1/transactionBuilder.ts` - `import debugLib = require('debug')`
4. `/Users/zahinmohammad/workspace/bitgo/BitGoJS/modules/utxo-lib/src/taproot.ts` - `import FastPriorityQueue = require('fastpriorityqueue')`
5. `/Users/zahinmohammad/workspace/bitgo/BitGoJS/modules/sdk-core/src/bitgo/tss/eddsa/eddsa.ts` - `import _ = require('lodash')`

### Test Files
Most occurrences (26 out of 36) are in test files, primarily importing:
- `should` for assertions
- `nock` for HTTP mocking

### Example Files
1. `/Users/zahinmohammad/workspace/bitgo/BitGoJS/examples/ts/proxy/server.ts` - `import express = require('express')`
2. `/Users/zahinmohammad/workspace/bitgo/BitGoJS/examples/ts/tss-recovery/eddsa-recovery.ts` - `import sjcl = require('sjcl')`

### Generated/Resource Files
1. `/Users/zahinmohammad/workspace/bitgo/BitGoJS/modules/sdk-coin-trx/resources/protobuf/tron.d.ts` - `import Long = require('long')`
2. `/Users/zahinmohammad/workspace/bitgo/BitGoJS/modules/sdk-coin-icp/resources/messageCompiled.d.ts` - `import Long = require('long')`

## Conversion Strategy

Each `import something = require('something')` should be converted to one of these ES module import patterns:

1. **Default imports**: `import something from 'something'`
2. **Named imports**: `import { something } from 'something'`
3. **Namespace imports**: `import * as something from 'something'`

The exact conversion depends on how the module is exported from the required package.