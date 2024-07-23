# Get Fee Estimate For a Transaction in Sui

This guide explains how to get a fee estimate for a transaction in sui

## Prerequisites


- BitGo SDK installed
- BitGo account and API access token
- .env file with necessary environment variables

## Overview

Unfortunately, there is no way to get a precise fee estimate before a transaction on Sui. The gas fee is variable and differs from transaction to transaction. The fee estimate is composed of three components: computation cost, storage cost, and storage rebate. While the computation cost remains relatively constant, the storage cost and storage rebate can vary significantly.

Sui also has a concept of negative gas fees. If you overpay for a transaction, the excess gas fees are returned to you. This system incentivizes users to optimize storage usage on the blockchain, promoting cost efficiency and contributing to the efficient operation of the Sui network. However, this also makes predicting transaction fees more challenging.

To address the need for a fee estimate, You can run [this script](../ts/sui/get-transaction-hex.ts) that performs a simple transaction. By generating the transaction hex, you can obtain a fee estimate.
This script, when run, will log a transaction hex. You can then pass this value to [BitGo's API](https://app.bitgo-test.com/api/v2/tsui/tx/fee?tx=) to receive a fee estimate.


## Running the script

First, run `yarn install` from the root directory of the repository.

Then change into the `examples/ts/sui` directory and use `npx ts-node` to run it:

```
$ cd examples/ts/sui/
$ npx ts-node get-transaction-hex.ts
```

### Note

- Ensure your wallet ID and passphrase are correct.
- Replace placeholder values with actual data from your BitGo account.

## Expected Output

The output should be as follows:

```
Required tx param:
AAACAAgQJwAAAAAAAAAgWi8a831WVBkJYTbreVK3NAIGZI%2BhQCuftQI4dx1DSicCAgABAQAAAQECAAABAQDojrUgsPIyDtSTV6rS54xejLr67f2B%2B%2F159oq6evGnEwHu2GGYi3WJarkc27zGeL7%2FDmtIWy6IKEI5Uy6sGolMV1LgwAAAAAAAII2Sh%2FcsCB2AGmMSpi%2Bu65igNCuTAeYQ1ionZjpcAkBv6I61ILDyMg7Uk1eq0ueMXoy6%2Bu39gfv9efaKunrxpxPoAwAAAAAAAKSIIQAAAAAAAA%3D%3D
```

### Copy this value and use it as a parameter in this URL:

```
https://app.bitgo-test.com/api/v2/tsui/tx/fee?tx=<tx-value>
```

### The fee estimate result should look like this:

```
{
  "feeEstimate": "3954120",
  "computationCost": "1000000",
  "storageCost": "1976000",
  "storageRebate": "978120"
}
```
