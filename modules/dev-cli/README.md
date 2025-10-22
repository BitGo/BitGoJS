# @bitgo/dev-cli

A CLI tool for quickly testing BitGo SDK changes during development.

## Setup

### Option 1: Using config.json (Recommended)

1. Create a `config.json` file (copy from `config.example.json`):
   ```bash
   cp config.example.json config.json
   ```

2. Configure all your environments and coins in `config.json`:
   ```json
   {
     "test": {
       "tbtc": {
         "accessToken": "v2x...",
         "walletId": "...",
         "walletPassphrase": "..."
       },
       "gteth": {
         "accessToken": "v2x...",
         "walletId": "..."
       }
     },
     "staging": {
       "tbtcsig": { ... }
     },
     "prod": {
       "btc": { ... }
     }
   }
   ```

3. Build the project:
   ```bash
   yarn build
   ```

### Option 2: Using .env file

1. Create a `.env` file in this directory (copy from `env.example`):
   ```bash
   cp env.example .env
   ```

2. Configure your environment variables in `.env`

3. Build the project:
   ```bash
   yarn build
   ```

**Note:** Environment variables always override config.json settings.

## Usage

You can run commands directly using:

```bash
# From the module directory
yarn bitgo-dev <command>

# Or from the monorepo root
yarn workspace @bitgo/dev-cli run bitgo-dev <command>
```

### Available Commands

#### Get Balance
```bash
yarn bitgo-dev balance
```

#### Create Address
```bash
yarn bitgo-dev address create
```

#### Send Transaction
```bash
yarn bitgo-dev send --to <address> --amount <amount>
```

#### Get Wallet Info
```bash
yarn bitgo-dev wallet info
```

#### List Transfers
```bash
yarn bitgo-dev transfers [--limit <number>]
```

#### Create Wallet
```bash
yarn bitgo-dev wallet create --label "My Test Wallet"
```

### Environment Variables

Override any `.env` setting via command line:

```bash
BITGO_COIN=btc BITGO_ENV=prod yarn bitgo-dev balance
```

### Coin-Specific Operations

#### Lightning
For lightning operations, use the lightning-specific commands:

```bash
# Create invoice
yarn bitgo-dev lightning invoice --amount 1000 --memo "test payment"

# Pay invoice
yarn bitgo-dev lightning pay --invoice <invoice_string>
```

## Development

Since this uses direct imports from `bitgo` module via Lerna/Yarn workspaces, any changes you make to BitGo SDK will be reflected when you rebuild:

```bash
# In the root of the monorepo
yarn dev  # This watches and rebuilds all packages
```

Then you can immediately test your changes:

```bash
yarn workspace @bitgo/dev-cli run bitgo-dev balance
```

## Adding New Commands

Create a new command file in `src/commands/` following the pattern of existing commands, then register it in `bin/index.ts`.

