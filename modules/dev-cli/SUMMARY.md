# Dev CLI - Summary

## ✅ What's Been Created

A production-ready CLI tool for quickly testing BitGo SDK changes across different coins and environments.

### 📁 Project Structure

```
modules/dev-cli/
├── bin/index.ts              # CLI entry point
├── src/
│   ├── config.ts             # Configuration loader (supports config.json + env vars)
│   ├── bitgo-client.ts       # BitGo initialization
│   ├── utils.ts              # Logging utilities
│   └── commands/
│       ├── balance.ts        # Get wallet balance
│       ├── address.ts        # Create/list addresses
│       ├── send.ts           # Send transactions
│       ├── transfers.ts      # List transfers
│       ├── wallet.ts         # Wallet operations
│       └── lightning.ts      # Lightning Network operations
├── config.example.json       # Example config file (hierarchical)
├── env.example               # Example .env file (legacy support)
├── setup.sh                  # Quick setup script
├── README.md                 # Full documentation
├── QUICKSTART.md             # Quick start guide
├── CONFIG.md                 # Configuration guide
└── EXAMPLES.md               # Usage examples
```

## 🎯 Key Features

### 1. **Hierarchical Configuration** (New!)
```json
{
  "test": {
    "tbtc": { "accessToken": "...", "walletId": "..." },
    "gteth": { "accessToken": "...", "walletId": "..." }
  },
  "staging": {
    "tbtcsig": { "accessToken": "...", "walletId": "..." }
  },
  "prod": {
    "btc": { "accessToken": "...", "walletId": "..." }
  }
}
```

### 2. **Easy Coin/Environment Switching**
```bash
# Test Bitcoin
BITGO_COIN=tbtc BITGO_ENV=test yarn bitgo-dev balance

# Test Ethereum  
BITGO_COIN=gteth BITGO_ENV=test yarn bitgo-dev balance

# Staging
BITGO_COIN=tbtcsig BITGO_ENV=staging yarn bitgo-dev balance

# Production
BITGO_COIN=btc BITGO_ENV=prod yarn bitgo-dev balance
```

### 3. **Comprehensive Commands**

**Core Operations:**
- `balance` - Get wallet balance
- `address create` - Create new address
- `address list` - List wallet addresses
- `send --to <addr> --amount <amt> --confirm` - Send transaction
- `transfers --limit 10` - List transfers
- `wallet info` - Get wallet details
- `wallet create --label "name"` - Create wallet

**Lightning:**
- `lightning invoice --amount 1000` - Create invoice
- `lightning pay --invoice <inv>` - Pay invoice
- `lightning list-payments` - List payments

### 4. **Flexible Configuration Priority**
1. `config.json` - Base hierarchical config
2. `.env` file - Environment defaults (optional)
3. Environment variables - Command-line overrides

### 5. **Direct Import from BitGo SDK**
- Uses `workspace:*` dependencies via Lerna/Yarn
- Changes to BitGo SDK reflect immediately (with `yarn dev`)
- No need for `npm link` or manual paths

## 🚀 Quick Start

### Setup
```bash
cd modules/dev-cli
./setup.sh
# Edit config.json with your credentials
```

### Usage Examples
```bash
# Get balance for test tbtc
BITGO_COIN=tbtc BITGO_ENV=test yarn bitgo-dev balance

# Create address for test ethereum
BITGO_COIN=gteth BITGO_ENV=test yarn bitgo-dev address create

# Send transaction (dry run)
BITGO_COIN=tbtc BITGO_ENV=test yarn bitgo-dev send \
  --to tb1q... --amount 10000

# Send transaction (actual)
BITGO_COIN=tbtc BITGO_ENV=test yarn bitgo-dev send \
  --to tb1q... --amount 10000 --confirm

# Lightning invoice
BITGO_COIN=tlnbtc BITGO_ENV=test yarn bitgo-dev lightning invoice \
  --amount 1000 --memo "test"
```

## 💡 Development Workflow

### Typical Development Loop

**Terminal 1 - Watch mode:**
```bash
cd /Users/luiscovarrubias/BitGoJS
yarn dev  # Watches and rebuilds all modules
```

**Terminal 2 - Testing:**
```bash
cd /Users/luiscovarrubias/BitGoJS/modules/dev-cli

# Test Bitcoin
BITGO_COIN=tbtc BITGO_ENV=test yarn bitgo-dev balance

# Test Ethereum
BITGO_COIN=gteth BITGO_ENV=test yarn bitgo-dev balance

# Test Lightning
BITGO_COIN=tlnbtc BITGO_ENV=test yarn bitgo-dev lightning invoice --amount 1000
```

### Benefits Over `/lab`

| Before (/lab) | After (dev-cli) |
|---------------|-----------------|
| Separate file per coin | One config.json for all |
| Hard-coded values | Environment-based switching |
| Manual script editing | Command-line interface |
| Requires code changes | No code changes needed |
| ~50 lines per operation | Single command |

## 📋 Configuration Examples

### Minimal config.json
```json
{
  "test": {
    "tbtc": {
      "accessToken": "v2x...",
      "walletId": "..."
    }
  }
}
```

### Full config.json
```json
{
  "test": {
    "tbtc": {
      "accessToken": "v2x...",
      "walletId": "...",
      "walletPassphrase": "...",
      "otp": "000000",
      "enterpriseId": "..."
    },
    "gteth": { /* ... */ },
    "talgo": { /* ... */ },
    "tlnbtc": {
      "accessToken": "...",
      "walletId": "...",
      "walletId2": "...",  // For lightning
      "walletPassphrase": "..."
    }
  },
  "staging": {
    "tbtcsig": { /* ... */ },
    "teos": { /* ... */ }
  },
  "prod": {
    "btc": { /* ... */ },
    "eth": { /* ... */ }
  }
}
```

## 🔧 Advanced Usage

### Shell Aliases
```bash
# Add to ~/.bashrc or ~/.zshrc
alias bgdev='cd ~/BitGoJS/modules/dev-cli && yarn bitgo-dev'
alias bgbal='BITGO_ENV=test BITGO_COIN=tbtc bgdev balance'
alias bgtest='BITGO_ENV=test'
alias bgstaging='BITGO_ENV=staging'

# Usage:
bgbal
BITGO_COIN=gteth bgdev balance
```

### Environment Switching
```bash
# Set defaults in shell
export BITGO_ENV=test
export BITGO_COIN=tbtc

# Now just:
yarn bitgo-dev balance

# Or override:
BITGO_COIN=gteth yarn bitgo-dev balance
```

## 📚 Documentation

- **README.md** - Full documentation
- **QUICKSTART.md** - Quick start guide
- **CONFIG.md** - Detailed configuration guide
- **EXAMPLES.md** - Comprehensive usage examples

## 🎉 Next Steps

1. **Setup your config:**
   ```bash
   cd modules/dev-cli
   ./setup.sh
   # Edit config.json
   ```

2. **Test it:**
   ```bash
   BITGO_COIN=tbtc BITGO_ENV=test yarn bitgo-dev balance
   ```

3. **Start developing:**
   - Make changes to BitGo SDK
   - Run `yarn dev` in root (watches/rebuilds)
   - Test immediately with CLI

## 💭 Design Decisions

### Why config.json over .env?
- **Hierarchical**: Organize by env → coin
- **Scalable**: Easy to add new coins/environments
- **No duplication**: Share tokens across coins in same env
- **Backwards compatible**: .env still works

### Why not use direct paths like lab/?
- **Cleaner**: No relative paths (`../../../`)
- **Lerna-native**: Uses workspace dependencies
- **Maintainable**: One config for everything
- **Professional**: CLI > scattered scripts

### Why TypeScript?
- **Type safety**: Catches errors at compile time
- **IDE support**: Better autocomplete/refactoring
- **Consistency**: Matches BitGo SDK patterns
- **Extensibility**: Easy to add new commands

## 🔒 Security Notes

- `config.json` is git-ignored (contains secrets)
- Supports different tokens per environment
- Optional OTP support for sensitive operations
- Recommends read-only tokens where possible

---

**Created:** October 2025  
**Status:** ✅ Production Ready  
**Maintainer:** BitGo Development Team

