# BitGo Dev CLI - Quick Start

A command-line tool for rapid development and testing of BitGo SDK changes.

## Why Use This?

Instead of:
- Manually creating test scripts in `/lab` for each coin
- Copying and modifying similar code across different test files
- Hard-coding wallet IDs and tokens in scripts

You can now:
- Use a single CLI with environment-based configuration
- Switch between coins/environments with environment variables
- Test changes instantly without editing scripts

## Quick Start

### 1. Setup
```bash
cd modules/dev-cli
./setup.sh
# Edit .env with your credentials
```

### 2. Basic Usage
```bash
# Get balance
yarn bitgo-dev balance

# Create address
yarn bitgo-dev address create

# Send transaction (dry run)
yarn bitgo-dev send --to <address> --amount <amount>

# Send transaction (actual)
yarn bitgo-dev send --to <address> --amount <amount> --confirm

# Get wallet info
yarn bitgo-dev wallet info

# List transfers
yarn bitgo-dev transfers --limit 10
```

### 3. Switch Coins/Environments
```bash
# Different coin
BITGO_COIN=gteth yarn bitgo-dev balance

# Different environment
BITGO_ENV=staging BITGO_COIN=tbtcsig yarn bitgo-dev balance

# Different wallet
BITGO_WALLET_ID=<other_wallet> yarn bitgo-dev balance
```

## Available Commands

### Core Operations
- `balance` - Get wallet balance
- `address create` - Create a new address
- `address list` - List addresses
- `send` - Send a transaction (with --confirm flag)
- `transfers` - List wallet transfers
- `wallet info` - Get wallet details
- `wallet create` - Create a new wallet

### Lightning (for lightning coins)
- `lightning invoice` - Create an invoice
- `lightning pay` - Pay an invoice  
- `lightning list-payments` - List payments
- `lightning balance` - Get lightning balance

## Development Workflow

### Testing Your SDK Changes

1. **Start watch mode** (in one terminal):
   ```bash
   # From repo root
   yarn dev
   ```

2. **Make changes** to BitGo SDK or any module

3. **Test immediately** (in another terminal):
   ```bash
   cd modules/dev-cli
   yarn bitgo-dev balance
   ```

No need to rebuild manually - `yarn dev` watches and rebuilds automatically!

### Multiple Environments

Create coin-specific `.env` files:
```bash
.env.btc       # Bitcoin config
.env.eth       # Ethereum config
.env.lightning # Lightning config
```

Load as needed:
```bash
export $(cat .env.btc | xargs) && yarn bitgo-dev balance
```

## Configuration

### Environment Variables

Required:
- `BITGO_ENV` - Environment (test, staging, prod, custom)
- `BITGO_COIN` - Coin to use (btc, tbtc, eth, gteth, etc.)
- `BITGO_ACCESS_TOKEN` - Your BitGo access token
- `BITGO_WALLET_ID` - Wallet ID (for most commands)

Optional:
- `BITGO_WALLET_PASSPHRASE` - For signing operations
- `BITGO_OTP` - OTP code (if required)
- `BITGO_ENTERPRISE_ID` - For wallet creation
- `BITGO_CUSTOM_ROOT_URI` - For custom environments
- `BITGO_WALLET_ID_2` - Secondary wallet (e.g., for lightning)

### Example .env
```bash
BITGO_ENV=test
BITGO_COIN=tbtc
BITGO_ACCESS_TOKEN=v2x...
BITGO_WALLET_ID=...
BITGO_WALLET_PASSPHRASE=...
BITGO_OTP=000000
BITGO_ENTERPRISE_ID=...
```

## Comparison with /lab

### Before (lab folder)
```javascript
// lab/btc/wallet.js
const BitGoJS = require('../../modules/bitgo/dist/src/index');
const bitgo = new BitGoJS.BitGo({ env: 'test' });
const { envs } = require('./env');

async function getBalances(coinName, walletId) {
  // ... 30 lines of code
}
getBalances('tbtc', 'hardcoded-wallet-id');
```

### After (dev-cli)
```bash
yarn bitgo-dev balance
```

## See Also

- [EXAMPLES.md](./EXAMPLES.md) - Comprehensive usage examples
- [README.md](./README.md) - Full documentation

## Tips

1. **Use shell aliases** for even faster access:
   ```bash
   alias bgdev='cd ~/BitGoJS/modules/dev-cli && yarn bitgo-dev'
   alias bgbal='bgdev balance'
   ```

2. **Environment switching**:
   ```bash
   export BITGO_ENV=test  # Test env
   export BITGO_ENV=staging  # Staging
   ```

3. **Coin families work similarly**:
   - UTXO: btc, ltc, zec, bch, etc.
   - Account: eth, algo, dot, etc.
   - Lightning: lnbtc, tlnbtc

## Troubleshooting

**"Module not found"** → Run `yarn build`

**"Access token required"** → Create `.env` file with `BITGO_ACCESS_TOKEN`

**Changes not reflected** → Make sure `yarn dev` is running in root

**"Wallet ID required"** → Set `BITGO_WALLET_ID` in `.env` or environment

