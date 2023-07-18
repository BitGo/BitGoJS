# BitGoJS Examples

## `ts` directory (TypeScript)

In this directory, you can find examples on how to use the BitGoJS SDK with TypeScript. These examples use modern TypeScript/ES6 syntax with `async`/`await`. This is the recommended way to use the BitGoJS SDK for new projects.

### Wallet

- [Backup Key Creation](./ts/backup-key-creation.ts)
- [Create Policy](./ts/create-policy.ts)
- [Create Wallet Address](./ts/create-wallet-address.ts)
- [Create Wallet Addresses](./ts/create-wallet-addresses.ts)
- [Create Wallet](./ts/create-wallet.ts)
- [Get Maximum Spendable](./ts/get-maximum-spendable.ts)
- [Get Wallet Balance](./ts/get-wallet-balance.ts)
- [Get Wallet](./ts/get-wallet.ts)
- [List Wallet Shares](./ts/list-wallet-shares.ts)
- [List Wallet Transfers](./ts/list-wallet-transfers.ts)
- [List Wallets](./ts/list-wallets.ts)
- [Recover XRP](./ts/recover-xrp.ts)
- [Resend Wallet Share Invite](./ts/resend-wallet-share-invite.ts)
- [Send Wallet Transaction](./ts/send-wallet-transaction.ts)
- [Send With Provided Public Key](./ts/send-with-provided-public-keys.ts)
- [Share Wallet](./ts/share-wallet.ts)
- [Update Wallet Forwarders](./ts/update-wallet-forwarders.ts)

### Webhooks

- [Webhooks - Add (Block)](./ts/webhooks-block-add.ts)
- Webhooks - Add (Wallet) - Coming Soon
- [Webhooks - List](./ts/webhooks-list.ts)
- [Webhooks - Remove](./ts/webhooks-remove.ts)
- [Webhooks - List Notifications](./ts/webhooks-list-notifications.ts)
- [Webhooks - Simulate](./ts/webhooks-simulate.ts)

### Algorand (ALGO)

- [Account Consolidation Build](./ts/algo/account-consolidation-build.ts)
- [Account Consolidation Send](./ts/algo/account-consolidation-send.ts)
- [Disable Token](./ts/algo/disable-token.ts)
- [Enable Token](./ts/algo/enable-token.ts)
- [Transaction with emergency param](./ts/algo/transaction-with-emergency-param.ts)

### Bitcoin Lightning (BTC)

- [Check Lightning Balance](./ts/btc/check-lightning-balance.ts)
- [Create Lightning Invoice](./ts/btc/create-lightning-invoice.ts)
- [Withdraw Lightning Balance](./ts/btc/withdraw-lightning-balance.ts)
- [Make Lightning Deposit](./ts/btc/make-lightning-deposit.ts)
- [Make Lightning Payment](./ts/btc/make-lightning-payment.ts)
- [Pay LNURL Request](./ts/btc/pay-lnurl-request.ts)

### Ethereum (ETH)

- [Create Wallet Address](./ts/eth/create-wallet-address.ts)
- [Create Wallet](./ts/eth/create-wallet.ts)
- [Deploy Forwarder](./ts/eth/deployForwarder.ts)
- [Flush Forwarder Token](./ts/eth/flushForwarderToken.ts)
- [Set Flush Threshold](./ts/eth/set-flush-threshold.ts)

### Tezos (XTZ)

- [Consolidate Account Balances](./ts/xtz/consolidate-account-balances.ts)
- [Create Address](./ts/xtz/create-address.ts)

## `js` directory (JavaScript)

In this directory, you can find examples on how to use the BitGoJS SDK with JavaScript. These examples use coroutine syntax with `yield`.

> Note the directory structure is the same for the JavaScript examples as the TypeScript examples listed above.
