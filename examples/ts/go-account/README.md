# Go Account Examples

TypeScript examples for managing Go Account (OFC) wallets using the BitGo SDK directly — no BitGo Express required.

## Prerequisites

```bash
# Install dependencies from the repo root
yarn install

# Copy and fill in your credentials
cp examples/.env.example examples/.env
```

Required `.env` variables:

| Variable | Description |
|---|---|
| `TESTNET_ACCESS_TOKEN` | BitGo access token |
| `OFC_WALLET_ID` | Go Account wallet ID |
| `OFC_WALLET_PASSPHRASE` | Wallet passphrase |

---

## Scripts

### Wallet Setup

| Script | Description |
|---|---|
| `create-go-account.ts` | Create a wallet using `generateWallet()` — recommended |
| `create-go-account-advanced.ts` | Create a wallet with manual keychain management |
| `create-go-account-address.ts` | Create a token address on an existing wallet |

**Note:** The `onToken` parameter is **required** when creating addresses on OFC wallets. There is no default address — every address must be tied to a specific token (e.g. `ofctsol:usdc`).

---

### Withdrawals & Approvals

| Script | Description |
|---|---|
| `go-account-withdrawal.ts` | Build, sign, and submit a withdrawal in one command |
| `sign-transaction.ts` | Sign a pre-built payload only (Step 2 of 3, for split workflows) |
| `go-account-approve.ts` | Approve a pending withdrawal as a second admin |
| `go-account-get-pending-approval.ts` | Fetch details of a specific pending approval by ID |

**Withdrawal flow:**
```
Step 1: wallet.prebuildTransaction({ recipients })              → prebuild
Step 2: tradingAccount.signPayload({ payload, passphrase })    → signature
Step 3: POST /tx/send { halfSigned: { payload, signature } }   → txid or pendingApproval
```

If your enterprise has an approval policy, Step 3 returns a pending approval instead of a txid. A **different** admin must then run `go-account-approve.ts` to approve it — you cannot approve your own transaction.

Approvals may be wallet-scoped or enterprise-scoped depending on how the policy was configured. `go-account-approve.ts` queries both.

---

### Whitelist Management

| Script | Description |
|---|---|
| `go-account-whitelist-list.ts` | View all policy rules and whitelisted addresses on a wallet |
| `go-account-whitelist-update.ts` | Add or remove an address from an `advancedWhitelist` policy rule |

Run `go-account-whitelist-list.ts` first to find the correct policy ID before updating.

---

### Trading

| Script | Description |
|---|---|
| `go-account-list-products.ts` | List available trading pairs for a Go Account |
| `go-account-place-order.ts` | Place a market, limit, or TWAP trade order |
| `go-account-get-order.ts` | Fetch status and details of a specific order |
| `go-account-list-orders.ts` | List all orders, with optional status/product filters |

**Note:** Testnet orders confirm but do not settle. Use `env: 'production'` for actual settlement.

---

## Run Commands

```bash
cd examples/ts/go-account

# --- Wallet Setup ---

npx tsx create-go-account.ts
npx tsx create-go-account-advanced.ts
npx tsx create-go-account-address.ts

# --- Withdrawals & Approvals ---

# Full withdrawal (build + sign + submit)
OFC_WALLET_ID=your_wallet_id OFC_WALLET_PASSPHRASE=your_passphrase npx tsx go-account-withdrawal.ts

# Sign only (Step 2 of 3)
OFC_WALLET_ID=your_wallet_id OFC_WALLET_PASSPHRASE=your_passphrase OFC_PREBUILD_PAYLOAD='{"..."}' npx tsx sign-transaction.ts

# Approve a pending withdrawal (run as a DIFFERENT admin)
TESTNET_ACCESS_TOKEN=approver_token OFC_WALLET_ID=your_wallet_id OFC_WALLET_PASSPHRASE=approver_passphrase npx tsx go-account-approve.ts

# Approve a specific pending approval by ID
TESTNET_ACCESS_TOKEN=approver_token PENDING_APPROVAL_ID=your_approval_id OFC_WALLET_PASSPHRASE=approver_passphrase npx tsx go-account-approve.ts

# Get details of a specific pending approval
PENDING_APPROVAL_ID=your_approval_id npx tsx go-account-get-pending-approval.ts

# --- Whitelist Management ---

OFC_WALLET_ID=your_wallet_id npx tsx go-account-whitelist-list.ts

OFC_WALLET_ID=your_wallet_id WHITELIST_ITEM=your_address WHITELIST_OPERATION=add npx tsx go-account-whitelist-update.ts
OFC_WALLET_ID=your_wallet_id WHITELIST_ITEM=your_address WHITELIST_OPERATION=remove npx tsx go-account-whitelist-update.ts

# Add a wallet ID instead of an address
OFC_WALLET_ID=your_wallet_id WHITELIST_ITEM=target_wallet_id WHITELIST_ITEM_TYPE=walletId WHITELIST_OPERATION=add npx tsx go-account-whitelist-update.ts

# --- Trading ---

OFC_WALLET_ID=your_wallet_id npx tsx go-account-list-products.ts

# Place a market order
OFC_WALLET_ID=your_wallet_id npx tsx go-account-place-order.ts

# Place a limit order
OFC_WALLET_ID=your_wallet_id TRADE_TYPE=limit TRADE_PRODUCT=TBTC4-TEUR TRADE_SIDE=buy TRADE_QUANTITY=6 TRADE_QUANTITY_CURRENCY=TEUR TRADE_LIMIT_PRICE=95000 TRADE_DURATION=3600 npx tsx go-account-place-order.ts

OFC_WALLET_ID=your_wallet_id TRADE_ORDER_ID=your_order_id npx tsx go-account-get-order.ts

OFC_WALLET_ID=your_wallet_id npx tsx go-account-list-orders.ts
OFC_WALLET_ID=your_wallet_id TRADE_ORDER_STATUS=filled npx tsx go-account-list-orders.ts
OFC_WALLET_ID=your_wallet_id TRADE_ORDER_PRODUCT=TBTC4-TEUR npx tsx go-account-list-orders.ts
```

---

## Supported Tokens

Token names follow the format `ofc[network]:[token]` (e.g. `ofcsol:usdc`) for chain-specific tokens, or `ofc[coin]` (e.g. `ofcbtc`) for native coins.

### Testnet

| Token | Description |
|---|---|
| `ofctsol:usdc` | USD Coin on Solana |
| `ofctsol:usdt` | USD Tether on Solana |
| `ofcttrx:usdt` | USDT on Tron |
| `ofctsol:wsol` | Wrapped SOL on Solana |
| `ofcbtc` | Bitcoin |
| `ofceth` | Ethereum |

### Mainnet (`env: 'production'`)

| Token | Description |
|---|---|
| `ofcsol:usdc` | USD Coin on Solana |
| `ofcsol:usdt` | USD Tether on Solana |
| `ofcpolygon:usdc` | USD Coin on Polygon |
| `ofcarbeth:usdc` | USD Coin on Arbitrum |
| `ofcbsc:usdc` | USD Coin on BSC |
| `ofcbtc` | Bitcoin |
| `ofceth` | Ethereum |

---

## Troubleshooting

**Wallet stuck in `pendingSystemInitialization`**
Increase the retry count and delay in `waitForWalletInitialization()`.

**Error: "onToken is a mandatory parameter for OFC wallets"**
Always pass `onToken` when calling `wallet.createAddress()` on an OFC wallet.

**Error: "Coin unsupported: [token]"**
Check that the token name is correct, the token is enabled for your enterprise, and you're using testnet tokens (`ofct...`) with `env: 'test'` and mainnet tokens with `env: 'production'`.

**Pending approvals not showing up**
Approvals created by enterprise-level policies are enterprise-scoped and won't appear in a wallet-only query. `go-account-approve.ts` queries both scopes automatically.

---

## Resources

- [BitGo API Documentation](https://developers.bitgo.com/)
- [Go Accounts Overview](https://developers.bitgo.com/docs/crypto-as-a-service-go-accounts)
- [BitGoJS on GitHub](https://github.com/BitGo/BitGoJS)
