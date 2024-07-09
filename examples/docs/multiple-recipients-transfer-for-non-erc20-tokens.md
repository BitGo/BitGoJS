# Send Tokens for Non-ERC20 Coins Using wallet.sendMany()

This guide explains how to send tokens for non-ERC20 coins like Solana using the `wallet.sendMany()` method from the BitGo SDK.

## Prerequisites


- BitGo SDK installed
- BitGo account and API access token
- .env file with necessary environment variables

#### Create a .env file in your project's root directory and add your BitGo access token:

TESTNET_ACCESS_TOKEN=your_access_token_here
## Running the examples

First, run `yarn install` from the root directory of the repository.

Then change into the `examples/ts/sol/utils/nonce-account-creation` directory and use `npx ts-node` to run the desired example:

```
$ cd examples/ts/sol/utils/nonce-account-creation
$ npx ts-node multi-recipient-pay-transaction.ts
```


### Sample Code
- Please refer [this](../ts/sol/utils/nonce-account-creation/multi-recipient-pay-transaction.ts) sample script to understand how to send the USDC token on the Solana Testnet using the wallet.sendMany() method
### Note

- Ensure your wallet ID and passphrase are correct.
- Replace placeholder values with actual data from your BitGo account.
- The tokenName parameter specifies the token to be sent (e.g., tsol:usdc for Solana USDC). Make sure to pass it along with the recipient array in params

