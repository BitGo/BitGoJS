# Deprecated v1 Bitcoin wallets: withdraw with BitGoJS

> **Deprecated.** These examples are only for an existing legacy **v1 Bitcoin** wallet. They are not for v2 wallets and not for other coins. The legacy UI is scheduled to be removed on November 30, 2026. API access remains available for now, but future availability is not guaranteed. Contact BitGo Support if you cannot access your wallet or need help migrating.

This folder contains a customer-shareable, step-by-step guide for withdrawing BTC from a legacy v1 wallet with the BitGoJS SDK, plus scripts for the wallet operations a customer needs along the way.

The scripts use the deprecated v1 facades `bitgo.wallets()` and `bitgo.pendingApprovals()`, not `bitgo.coin('btc').wallets()`. They were verified against `@bitgo/sdk-api` **3.4.3**, the current published version at the time of writing, and against the v1 SDK sources linked at the end of this guide. The scripts were exercised with simulated API responses; **no real withdrawal or approval was executed**.

## What this guide does and does not cover

Covered:

- listing and inspecting existing v1 wallets
- balances, addresses, unspents and transaction history
- creating a receive address
- building, signing and submitting a BTC withdrawal
- inspecting, approving and rejecting pending approvals

Not covered:

- creating a v1 wallet
- recovering an access token or account
- migrating a v1 wallet to v2
- Travel Rule beneficiary data. If your account requires Travel Rule information, contact BitGo Support before sending.
- fee, policy, permission or account-specific guidance

## Before you begin

- Use a trusted computer, Node.js 22 or later, and a terminal. Do not run this on a shared machine.
- Never share your access token, wallet passphrase, OTPs, private keys, or signed transaction hex with anyone.
- Have an access token for the correct BitGo account and environment. The token must already exist and must have the permissions needed to read the wallet and, when applicable, spend or approve.
- Have the wallet passphrase and a current authenticator OTP available. The wallet passphrase decrypts the user signing key. It is not necessarily your BitGo login password.
- An approver must be authorized under the wallet or enterprise policy and may need their own access token, signing key and passphrase.
- `test` means testnet BTC; `prod` means real Bitcoin. Verify the wallet, network, destination and amount independently. Bitcoin transfers are irreversible.
- Amounts in these examples are **integer satoshis**. 100,000,000 satoshis = 1 BTC.
- Use a small test amount where practical, and leave enough balance for miner fees and any applicable BitGo fees.

If the wallet passphrase is unavailable, stop rather than guessing. The repository includes a [v1 passphrase recovery example](../../../ts/btc/v1/wallet-passphrase-recovery.ts); it requires account credentials and the encrypted passphrase from the keycard. Treat recovered material as secret. Ask Support if you cannot use it safely.

## 1. Install and authenticate

Create a private working directory and install the SDK:

```bash
mkdir v1-btc-withdrawal
cd v1-btc-withdrawal
npm init -y
npm install --save-exact @bitgo/sdk-api@3.4.3
```

Copy the scripts from this folder into that directory, or run them from a checkout of this repository after `yarn install`.

Set the environment and read the access token without echoing it:

```bash
export BITGO_ENV=test                  # Change to prod only for real BTC
read -rs -p 'BitGo access token: ' BITGO_ACCESS_TOKEN; echo
export BITGO_ACCESS_TOKEN
```

`BITGO_ENV=test` and `BITGO_ENV=prod` select separate environments and tokens. The SDK's `authenticateWithAccessToken` sets the token for subsequent requests.

For sending, also read the wallet passphrase and OTPs without echoing them:

```bash
read -rs -p 'Wallet passphrase: ' BITGO_WALLET_PASSPHRASE; echo
read -rs -p 'Session unlock OTP: ' BITGO_UNLOCK_OTP; echo
read -rs -p 'Action OTP: ' BITGO_ACTION_OTP; echo
export BITGO_WALLET_PASSPHRASE BITGO_UNLOCK_OTP BITGO_ACTION_OTP
```

The wallet passphrase is required to sign a send. For approvals it is optional: set it only if the SDK may need to rebuild and sign the transaction, for example because the original inputs expired. Rejection needs no passphrase.

The unlock OTP and action OTP are both authenticator codes. They may need to be obtained at different times according to your authenticator and account policy. If they are still the same code, you can set both variables to it.

Environment variables may be visible to other processes running as your user. Clear them when finished, and do not use a shared machine.

## 2. Scripts in this folder

| Script                        | Purpose                                                             |
| ----------------------------- | ------------------------------------------------------------------- |
| `list-wallets.js`             | List v1 wallets, with balances and pagination                       |
| `get-wallet.js`               | Get one wallet by ID                                                |
| `get-wallet-balance.js`       | Show balance, confirmed balance and spendable balance               |
| `list-wallet-transfers.js`    | List recent transactions (v1 calls them transactions)               |
| `list-wallet-addresses.js`    | List wallet addresses                                               |
| `list-wallet-unspents.js`     | List unspent outputs                                                |
| `create-wallet-address.js`    | Create a receive address                                            |
| `send-wallet-transaction.js`  | Build, sign and submit a withdrawal                                 |
| `list-pending-approvals.js`   | List pending approvals for a wallet or enterprise                   |
| `get-pending-approval.js`     | Inspect one pending approval                                        |
| `approve-pending-approval.js` | Approve a pending withdrawal                                        |
| `reject-pending-approval.js`  | Reject (cancel) a pending withdrawal                                |
| `bitgo-client.js`             | Shared authentication and input helpers (not an example on its own) |

## 3. Find and inspect the wallet

```bash
node list-wallets.js
node list-wallets.js NEXT_BATCH_PREV_ID     # Only if nextBatchPrevId was returned
node get-wallet.js WALLET_ID
node get-wallet-balance.js WALLET_ID
node list-wallet-transfers.js WALLET_ID 20
node list-wallet-addresses.js WALLET_ID 20
node list-wallet-unspents.js WALLET_ID 20
```

Replace the placeholders with real values. If `list-wallets.js` returns a `nextBatchPrevId`, pass it as the argument and repeat until no further page is returned. Check the wallet ID and label against your records before using it.

`balance`, `confirmedBalance` and `spendableBalance` are satoshis. `spendableBalance` excludes external unconfirmed unspents. Wallet details are a snapshot; run the command again to refresh them.

History, addresses and unspents are limited by the `LIMIT` argument and are not necessarily the complete account history. These outputs can contain sensitive wallet information.

To create a new receive address:

```bash
node create-wallet-address.js WALLET_ID
```

Legacy `safe` wallets cannot create new addresses; the SDK returns an explicit error in that case.

## 4. Send a withdrawal

Bitcoin transfers are irreversible. Independently verify the wallet ID, destination address, amount and environment before running the command.

```bash
# REAL FUNDS if BITGO_ENV=prod.
node send-wallet-transaction.js WALLET_ID DESTINATION_BTC_ADDRESS AMOUNT_IN_SATOSHIS
```

The amount is the recipient amount in integer satoshis, not the total cost including fees.

The script performs three steps:

1. Build the transaction and sign it locally with the wallet passphrase (`wallet.createAndSignTransaction`).
2. Unlock the API session with `BITGO_UNLOCK_OTP`.
3. Submit the signed transaction to BitGo (`wallet.sendTransaction`) with `BITGO_ACTION_OTP`.

BitGo applies policy. If the wallet policy requires approval, BitGo signs and relays the transaction only after the required approvals are recorded.

The script prints a result such as:

```json
{
  "status": "accepted",
  "hash": "TRANSACTION_HASH",
  "pendingApprovalId": null,
  "fee": 1234,
  "feeRate": 10000,
  "bitgoFee": null
}
```

| `status`          | Meaning                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `accepted`        | BitGo accepted the send. This is not proof of blockchain confirmation.                         |
| `pendingApproval` | Approval is required. The withdrawal is not complete. Record `pendingApprovalId`.              |
| `otp`             | BitGo requested another OTP. Do not treat the send as complete. Inspect history and approvals. |

The returned `fee` is in satoshis. `feeRate` is satoshis per **kilobyte**, not per byte. When no fee is specified, the SDK asks BitGo for a fee estimate. `bitgoFee` is present only when BitGo charges a separate fee.

For explicit fee controls, pass `fee`, `feeRate` or related transaction-builder parameters to `createAndSignTransaction`. Consult the [v1 transaction builder](../../../../modules/sdk-api/src/v1/transactionBuilder.ts) for the full parameter set.

### If the send fails or times out

A timeout, network error or exception **after submission** can leave the outcome unknown. An exception does not prove that no withdrawal was created.

Do not immediately retry. First inspect the wallet history and pending approvals:

```bash
node list-wallet-transfers.js WALLET_ID 20
node list-pending-approvals.js WALLET_ID
```

Contact BitGo Support if the result remains unclear.

### Why this guide does not call `wallet.sendCoins()`

`wallet.sendCoins()` is the convenience method for v1 sends, but in the published SDK it throws after a successful submission when BitGo returns a pending approval. The SDK's post-processing expects a transaction hex in the response and parses an undefined value. The withdrawal may already exist even though the call threw.

The scripts therefore use the same build/sign/send steps explicitly. `createAndSignTransaction` is marked internal in the SDK source and is the same step `sendCoins` uses; it is not a separately guaranteed public v1 contract. If you prefer the convenience method, do not retry after this error: check history and pending approvals first.

## 5. Pending approvals

List approvals for a wallet:

```bash
node list-pending-approvals.js WALLET_ID
```

Or for an enterprise-owned approval:

```bash
node list-pending-approvals.js --enterprise ENTERPRISE_ID
```

The v1 API requires exactly one of `walletId` and `enterpriseId`.

Inspect one approval before acting:

```bash
node get-pending-approval.js APPROVAL_ID
```

Review the returned `info`: confirm the approval type, source wallet, destination, amount and fees against the intended withdrawal. Approval details may be sensitive.

### Approve

Authenticate with the **approver's** own access token and signing material. The requester cannot necessarily approve their own transaction.

```bash
# May authorize and broadcast a withdrawal. Review the approval details first.
node approve-pending-approval.js APPROVAL_ID
```

The approver may need to unlock the API session with `BITGO_UNLOCK_OTP` and confirm the approval with `BITGO_ACTION_OTP`.

For transaction requests, the SDK may need the wallet passphrase to rebuild and sign the transaction if the original inputs have expired. Set `BITGO_WALLET_PASSPHRASE` for the approver when that may be required; otherwise the script approves without it. Approval can require multiple authorized approvers. An `approved` state is not itself proof that the Bitcoin transaction was broadcast or confirmed.

### Reject

```bash
node reject-pending-approval.js APPROVAL_ID
```

Rejection changes state. Set a fresh `BITGO_UNLOCK_OTP` before running it. Query the approval again to check its current state.

## 6. Verify completion

After a send is accepted or an approval is recorded, check the transaction in wallet history:

```bash
node list-wallet-transfers.js WALLET_ID 20
```

Look up the transaction hash independently on the correct Bitcoin network to check broadcast and confirmations. Wallet history and approval state are BitGo records, not blockchain proof.

## 7. Known limitations and troubleshooting

- **Pending approval makes `sendCoins` / `sendMany` throw.** The request was already submitted. Do not retry. Use `list-pending-approvals.js` and wallet history to determine the outcome. This guide uses the explicit build/sign/send steps to avoid the issue.
- **`otp` status.** Obtain a fresh OTP and inspect history/approvals before resubmitting anything.
- **Passphrase errors.** The wallet passphrase decrypts the user signing key. Verify it separately from your BitGo login password. If it is lost, see the passphrase recovery example linked above; do not guess.
- **`safe` wallets cannot create addresses.** Use an existing address or ask Support.
- **Fee rate units.** `feeRate` is satoshis per kilobyte. Do not treat it as satoshis per byte.
- **Expected SDK console output.** Building a v1 transaction may print `Unspents fetched: ...` and a `TransactionBuilder sign method arguments will change in v6` deprecation warning. These are SDK logs, not errors.
- **Travel Rule.** These scripts do not send Travel Rule beneficiary data. If your account requires it, contact Support before withdrawing.
- **API availability.** The v1 endpoints are deprecated. This guide describes SDK behavior; it is not an availability guarantee or an exhaustive endpoint contract.

## 8. Clean up secrets

When finished, clear the secrets from the shell:

```bash
unset BITGO_ACCESS_TOKEN BITGO_WALLET_PASSPHRASE BITGO_UNLOCK_OTP BITGO_ACTION_OTP
```

## Source references

Links are pinned to the commit for the published `@bitgo/sdk-api@3.4.3` release, not a moving branch.

- [`BitGoAPI`](https://github.com/BitGo/BitGoJS/blob/5e1a37b45f5768814891b8ba5332372690b610d4/modules/sdk-api/src/bitgoAPI.ts): token authentication, session unlock and the v1 facades
- [v1 wallets facade](https://github.com/BitGo/BitGoJS/blob/5e1a37b45f5768814891b8ba5332372690b610d4/modules/sdk-api/src/v1/wallets.ts): list, pagination and get
- [v1 wallet implementation](https://github.com/BitGo/BitGoJS/blob/5e1a37b45f5768814891b8ba5332372690b610d4/modules/sdk-api/src/v1/wallet.ts): balances, addresses, unspents, history, build/sign/send and response states
- [v1 transaction builder](https://github.com/BitGo/BitGoJS/blob/5e1a37b45f5768814891b8ba5332372690b610d4/modules/sdk-api/src/v1/transactionBuilder.ts): fee and transaction-building parameters
- [Pending approvals facade](https://github.com/BitGo/BitGoJS/blob/5e1a37b45f5768814891b8ba5332372690b610d4/modules/sdk-api/src/v1/pendingapprovals.ts) and [approval implementation](https://github.com/BitGo/BitGoJS/blob/5e1a37b45f5768814891b8ba5332372690b610d4/modules/sdk-api/src/v1/pendingapproval.ts): list, get, approve, reject and reconstruction
- [v1 passphrase recovery example](https://github.com/BitGo/BitGoJS/blob/5e1a37b45f5768814891b8ba5332372690b610d4/examples/ts/btc/v1/wallet-passphrase-recovery.ts)

The examples describe SDK behavior, not an availability guarantee. Account policies, permissions, fees, token issuance, transaction limits and service responses can differ. Contact BitGo Support for account-specific guidance.
