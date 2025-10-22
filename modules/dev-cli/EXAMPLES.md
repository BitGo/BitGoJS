# Dev CLI Examples

## Setup

1. Create your `.env` file:
```bash
cd modules/dev-cli
cp env.example .env
# Edit .env with your credentials
```

2. Build the CLI:
```bash
yarn build
```

## Basic Commands

### Get Wallet Balance
```bash
yarn bitgo-dev balance
```

### Create Address
```bash
# For UTXO coins (BTC, LTC, etc.) with custom chain
yarn bitgo-dev address create --chain 10

# For account-based coins (ETH, etc.)
yarn bitgo-dev address create
```

### Send Transaction
```bash
# Dry run (won't actually send)
yarn bitgo-dev send --to <address> --amount <amount>

# Actually send (requires confirmation flag)
yarn bitgo-dev send --to <address> --amount <amount> --confirm
```

### List Transfers
```bash
# Get last 10 transfers
yarn bitgo-dev transfers

# Get last 50 transfers
yarn bitgo-dev transfers --limit 50

# Include token transfers
yarn bitgo-dev transfers --all-tokens
```

### Wallet Info
```bash
yarn bitgo-dev wallet info
```

### Create Wallet
```bash
yarn bitgo-dev wallet create --label "My Test Wallet"

# With TSS
yarn bitgo-dev wallet create --label "My TSS Wallet" --multisig-type tss
```

## Lightning Commands

### Create Invoice
```bash
yarn bitgo-dev lightning invoice --amount 1000 --memo "test payment"
```

### Pay Invoice
```bash
yarn bitgo-dev lightning pay --invoice <lightning_invoice_string>
```

### List Lightning Payments
```bash
yarn bitgo-dev lightning list-payments
```

## Environment Variable Overrides

You can override any `.env` setting via command line:

```bash
# Test against staging with a different coin
BITGO_ENV=staging BITGO_COIN=tbtcsig yarn bitgo-dev balance

# Use a different wallet
BITGO_WALLET_ID=<other_wallet_id> yarn bitgo-dev balance

# Test production
BITGO_ENV=prod BITGO_COIN=btc BITGO_WALLET_ID=<prod_wallet_id> yarn bitgo-dev balance
```

## Development Workflow

### Quick Testing Loop

1. Make changes to BitGo SDK in `modules/bitgo` or any SDK module
2. Run `yarn dev` from the monorepo root (watches and rebuilds)
3. In another terminal, test your changes:
```bash
cd modules/dev-cli
yarn bitgo-dev balance
```

### Testing Different Coins

```bash
# Bitcoin testnet
BITGO_COIN=tbtc yarn bitgo-dev balance

# Ethereum testnet
BITGO_COIN=gteth yarn bitgo-dev balance

# Algorand
BITGO_COIN=talgo yarn bitgo-dev balance

# Litecoin
BITGO_COIN=ltc yarn bitgo-dev balance
```

## Tips & Tricks

### 1. Create Coin-Specific Env Files

Create multiple env files for different coins:
```bash
.env.btc     # Bitcoin testnet config
.env.eth     # Ethereum config  
.env.lightning  # Lightning config
```

Then load them as needed:
```bash
export $(cat .env.btc | xargs) && yarn bitgo-dev balance
```

### 2. Alias Common Commands

Add to your `.bashrc` or `.zshrc`:
```bash
alias bgdev='cd ~/BitGoJS/modules/dev-cli && yarn bitgo-dev'
alias bgbal='bgdev balance'
alias bgaddr='bgdev address create'
alias bgsend='bgdev send'
```

Then from anywhere:
```bash
bgbal
bgaddr
bgsend --to <addr> --amount 10000 --confirm
```

### 3. Quick Switching Between Environments

```bash
# Test
export BITGO_ENV=test

# Staging
export BITGO_ENV=staging

# Production (be careful!)
export BITGO_ENV=prod
```

## Troubleshooting

### "BITGO_ACCESS_TOKEN is required"
Make sure you've created a `.env` file and filled in your access token.

### "BITGO_WALLET_ID is required"
Most commands require a wallet ID. Set it in `.env` or pass via environment variable.

### "Failed to unlock BitGo session"
If you're performing sensitive operations (sending, creating wallets), you may need to set `BITGO_OTP` in your `.env` file.

### Module not found errors
Make sure you've built the module:
```bash
yarn build
```

### Changes not reflected
If you've made changes to the BitGo SDK, make sure to rebuild:
```bash
# From monorepo root
yarn dev  # Watches and rebuilds

# Or manually
cd modules/bitgo
yarn build
```

