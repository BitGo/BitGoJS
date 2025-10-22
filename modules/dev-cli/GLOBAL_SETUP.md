# BitGo SDK Dev CLI - Setup Complete! 🎉

## ✅ What's Set Up

The CLI is now globally available as `bitgosdk-dev` using `yarn link`.

## Usage from Anywhere

```bash
# From ANY directory
bitgosdk-dev --help

# Get balance
BITGO_ENV=staging BITGO_COIN=tbtc4 bitgosdk-dev balance

# Create address
BITGO_ENV=staging BITGO_COIN=tbtc4 bitgosdk-dev address create

# Send transaction
BITGO_ENV=staging BITGO_COIN=tbtc4 bitgosdk-dev send --to <addr> --amount <amt> --confirm
```

## How It Works

- **yarn link** creates a global symlink to `/Users/luiscovarrubias/BitGoJS/modules/dev-cli`
- Any changes you make will be reflected immediately (after rebuilding)
- No need to publish to npm!

## Configuration

Your `config.json` is in `/Users/luiscovarrubias/BitGoJS/modules/dev-cli/config.json`

The CLI will load config from:
1. `config.json` (hierarchical by env/coin)
2. Environment variables (for overrides)

## Current Config

```json
{
  "staging": {
    "tbtc4": {
      "accessToken": "v2xe63b...",
      "walletId": "68eeada4...",
      "walletPassphrase": "(!pfWazES..."
    }
  },
  "test": {
    "tbtc4": {
      "accessToken": "v2xc00d...",
      "walletId": "672d4c6e...",
      "walletPassphrase": "GQZyI10zi3jQ"
    }
  }
}
```

## Quick Examples

```bash
# Staging
BITGO_ENV=staging BITGO_COIN=tbtc4 bitgosdk-dev balance
BITGO_ENV=staging BITGO_COIN=tbtc4 bitgosdk-dev address create

# Test  
BITGO_ENV=test BITGO_COIN=tbtc4 bitgosdk-dev balance
```

## Shell Aliases (Optional)

Add to your `~/.zshrc` or `~/.bashrc`:

```bash
# Quick access
alias bgdev='bitgosdk-dev'

# Set defaults
export BITGO_ENV=staging
export BITGO_COIN=tbtc4

# Now just:
bgdev balance
bgdev address create
```

## Unlink (if needed)

To remove the global command:
```bash
cd /Users/luiscovarrubias/BitGoJS/modules/dev-cli
yarn unlink
```

## Rebuilding

After making changes to the CLI code:
```bash
cd /Users/luiscovarrubias/BitGoJS/modules/dev-cli
yarn build
```

Or use `yarn dev` from the root to watch all modules.

