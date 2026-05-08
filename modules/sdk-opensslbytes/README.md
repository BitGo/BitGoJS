# @bitgo/sdk-opensslbytes

Isolated module for users of the BitGo SDK that need to generate range proofs or recover funds on a TSS wallet.

## Installation

```shell
npm i @bitgo/sdk-api @bitgo/sdk-lib-mpc @bitgo/sdk-opensslbytes
```

Import the `openSSLBytes` from this module & pass to related functions that expect it:

```javascript
import { loadWebAssembly } from '@bitgo/sdk-opensslbytes';
import { EcdsaRangeProof } from '@bitgo-beta/sdk-lib-mpc';

const openSSLBytes = loadWebAssembly().buffer;

const nTilde = await EcdsaRangeProof.generateNtilde(openSSLBytes, 3072);
```
