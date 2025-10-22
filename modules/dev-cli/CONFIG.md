# Configuration Guide

## Configuration File Structure

The `config.json` file organizes all your BitGo credentials by environment and coin:

```json
{
  "environment": {
    "coin": {
      "accessToken": "...",
      "walletId": "...",
      "walletPassphrase": "...",
      "otp": "...",
      "enterpriseId": "..."
    }
  }
}
```

## Complete Example

```json
{
  "test": {
    "tbtc": {
      "accessToken": "v2xc00d469e22c1ccd2e73e9d5c3d8bdfa8f549e191c8f4e38633cb8f36c68126d7",
      "walletId": "67b4c23549295a1c015189732e9d4d85",
      "walletPassphrase": "GQZyI10zi3jQ",
      "otp": "000000",
      "enterpriseId": "63869330a084ba0007172450e20fbb5f"
    },
    "gteth": {
      "accessToken": "v2xc00d469e22c1ccd2e73e9d5c3d8bdfa8f549e191c8f4e38633cb8f36c68126d7",
      "walletId": "608f6e3374b930386277867deadbeef",
      "walletPassphrase": "GQZyI10zi3jQ"
    },
    "talgo": {
      "accessToken": "v2xc00d469e22c1ccd2e73e9d5c3d8bdfa8f549e191c8f4e38633cb8f36c68126d7",
      "walletId": "623a8e3fd3db7000089919797d8e9d8b",
      "walletPassphrase": "GQZyI10zi3jQ"
    },
    "tlnbtc": {
      "accessToken": "v2xc00d469e22c1ccd2e73e9d5c3d8bdfa8f549e191c8f4e38633cb8f36c68126d7",
      "walletId": "68e3f85ba3d7c96a4b6988b1cdeadbeef",
      "walletId2": "68e3f85ba3d7c96a4b6988b1c12345678",
      "walletPassphrase": "GQZyI10zi3jQ"
    }
  },
  "staging": {
    "tbtcsig": {
      "accessToken": "v2xd55e5e283ce5ff872aacd6de5a2001d521a0a003dad19bdd8f4619eb06d9075c",
      "walletId": "6536d2b677de640007639c81a4a24c69",
      "walletPassphrase": "GQZyI10zi3jQ"
    },
    "teos": {
      "accessToken": "v2xd55e5e283ce5ff872aacd6de5a2001d521a0a003dad19bdd8f4619eb06d9075c",
      "walletId": "6536d2b677de640007639c81deadbeef",
      "walletPassphrase": "GQZyI10zi3jQ"
    }
  },
  "prod": {
    "btc": {
      "accessToken": "v2x50d10c52923393baf037884aef126e81f7e40c2993cf097393dcf35fce66c9d5",
      "walletId": "642ca4993408b800074757c9e0d668a0",
      "walletPassphrase": "EV&7fOVAD$!P1Cw*kMgO",
      "enterpriseId": "63869330a084ba0007172450e20fbb5f"
    },
    "eth": {
      "accessToken": "v2x50d10c52923393baf037884aef126e81f7e40c2993cf097393dcf35fce66c9d5",
      "walletId": "642ca4993408b800074757c9deadbeef",
      "walletPassphrase": "EV&7fOVAD$!P1Cw*kMgO"
    }
  },
  "custom": {
    "tbtc": {
      "accessToken": "v2x...",
      "walletId": "63b4ca74b1f7950007eeb3ed99d43434",
      "walletPassphrase": "Ghghjkg!455544llll",
      "customRootUri": "https://app.custom-bitgo.com",
      "customBitcoinNetwork": "testnet"
    }
  }
}
```

## Usage Examples

### Switch Between Coins in Same Environment

```bash
# Test Bitcoin
BITGO_COIN=tbtc BITGO_ENV=test yarn bitgo-dev balance

# Test Ethereum
BITGO_COIN=gteth BITGO_ENV=test yarn bitgo-dev balance

# Test Algorand
BITGO_COIN=talgo BITGO_ENV=test yarn bitgo-dev balance
```

### Switch Between Environments

```bash
# Test environment
BITGO_ENV=test BITGO_COIN=tbtc yarn bitgo-dev balance

# Staging environment
BITGO_ENV=staging BITGO_COIN=tbtcsig yarn bitgo-dev balance

# Production environment (be careful!)
BITGO_ENV=prod BITGO_COIN=btc yarn bitgo-dev balance
```

### Environment Variable Override

Even with config.json, you can override specific values:

```bash
# Use config.json for most settings, but override wallet ID
BITGO_COIN=tbtc BITGO_WALLET_ID=<different_wallet> yarn bitgo-dev balance

# Override access token for one-off test
BITGO_COIN=tbtc BITGO_ACCESS_TOKEN=<temp_token> yarn bitgo-dev balance
```

## Configuration Priority

Settings are loaded in this order (later overrides earlier):

1. **config.json** - Base configuration file
2. **.env file** - Environment file (if present)
3. **Environment variables** - Command-line overrides

Example:
```bash
# config.json has: test.tbtc.walletId = "abc123"
# .env has: BITGO_WALLET_ID=def456
# Command line has: BITGO_WALLET_ID=ghi789

# Final value used: "ghi789" (command line wins)
```

## Required vs Optional Fields

### Required (per coin/env)
- `accessToken` - Your BitGo access token

### Optional but Recommended
- `walletId` - Default wallet ID (required for most commands)
- `walletPassphrase` - For signing operations

### Optional
- `otp` - OTP code (for sensitive operations)
- `enterpriseId` - For wallet creation
- `walletId2` - Secondary wallet (e.g., for lightning)
- `customRootUri` - Custom BitGo API endpoint
- `customBitcoinNetwork` - Custom Bitcoin network

## Special Coin Configurations

### Lightning Network
Lightning coins need both `walletId` and `walletId2`:

```json
{
  "test": {
    "tlnbtc": {
      "accessToken": "...",
      "walletId": "primary-lightning-wallet",
      "walletId2": "secondary-lightning-wallet",
      "walletPassphrase": "..."
    }
  }
}
```

### Custom Environments
For custom BitGo instances:

```json
{
  "custom": {
    "tbtc": {
      "accessToken": "...",
      "walletId": "...",
      "customRootUri": "https://app.custom-bitgo.com",
      "customBitcoinNetwork": "testnet"
    }
  }
}
```

## Migration from .env

If you have existing `.env` files, you can keep them alongside `config.json`:

1. **config.json** - Stores all your coins/environments
2. **.env** - Can override defaults (BITGO_ENV, BITGO_COIN)

Example `.env`:
```bash
# Default to test environment and tbtc
BITGO_ENV=test
BITGO_COIN=tbtc
```

Then just switch coins:
```bash
BITGO_COIN=gteth yarn bitgo-dev balance  # Uses test env from .env
```

## Tips

### 1. Organize by Purpose
```json
{
  "test": {
    "tbtc": { /* for general testing */ },
    "tbtc-integration": { /* for integration tests */ },
    "tbtc-dev": { /* for local development */ }
  }
}
```

### 2. Use Different Tokens per Environment
For security, use different access tokens for test/staging/prod:

```json
{
  "test": { "tbtc": { "accessToken": "test-token-..." } },
  "prod": { "btc": { "accessToken": "prod-token-..." } }
}
```

### 3. Shell Functions for Quick Switching
Add to your `.bashrc` or `.zshrc`:

```bash
# Switch to staging
bgstaging() {
  export BITGO_ENV=staging
  export BITGO_COIN=${1:-tbtcsig}
}

# Switch to prod
bgprod() {
  export BITGO_ENV=prod
  export BITGO_COIN=${1:-btc}
}

# Usage:
# bgstaging teos
# yarn bitgo-dev balance
```

## Security Notes

⚠️ **IMPORTANT**: 
- Never commit `config.json` to git (it's in `.gitignore`)
- Keep production credentials separate
- Use read-only tokens when possible
- Rotate tokens regularly
- Consider using different access tokens per environment

## Troubleshooting

### "accessToken is required for test/tbtc"
- Check that you have `config.json` with the right structure
- Verify the environment and coin names match exactly
- Try: `BITGO_ENV=test BITGO_COIN=tbtc yarn bitgo-dev balance`

### "walletId is required"
- Add `walletId` to your config.json entry
- Or pass via: `BITGO_WALLET_ID=... yarn bitgo-dev balance`

### Config not loading
- Verify `config.json` is valid JSON
- Check file is in `modules/dev-cli/config.json`
- Look for warnings when running commands

