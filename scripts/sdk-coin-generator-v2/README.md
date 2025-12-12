# SDK Coin Generator V2

Generate a new BitGo SDK coin module for unique L1 blockchains.

## Quick Start

```bash
yarn sdk-coin:new-v2
```

Follow the interactive prompts to generate your coin module.

## What You'll Be Asked

The generator will ask you for:

1. **Coin name** - Full name (e.g., "Canton Coin", "Bittensor")
2. **Mainnet symbol** - Lowercase symbol (e.g., "canton", "tao")
3. **Testnet symbol** - Testnet symbol (default: "t{symbol}")
4. **Base factor** - Decimal conversion (e.g., "1e10", "1e18")
5. **Key curve** - Choose between:
   - `ed25519` - Edwards-curve (Canton, TAO)
   - `secp256k1` - ECDSA (ICP, Bitcoin-like)
6. **TSS support** - Whether the coin supports Threshold Signature Scheme
7. **MPC algorithm** - Auto-determined from key curve:
   - `ed25519` → `eddsa`
   - `secp256k1` → `ecdsa`
8. **Chain type** - Select from:
   - `generic-l1` - Unique L1 blockchains (Canton, ICP)
   - `evm-like` - Ethereum-compatible chains (Arbitrum, Polygon)
   - `substrate-like` - Polkadot/Substrate chains (TAO, DOT)
   - `cosmos` - Cosmos SDK chains (ATOM, Osmosis)
9. **Token support** - Whether to include token class

## Example Session

```
🚀 BitGo SDK Coin Generator V2

📚 Examples of existing coins:
  Generic L1:
    • Canton (ed25519, TSS/eddsa)
    • ICP (secp256k1, TSS/ecdsa)
  EVM-like:
    • Arbitrum
    • Optimism
    • Polygon
  Substrate-like:
    • TAO (ed25519)
    • DOT
    • Kusama
  Cosmos:
    • ATOM (Cosmos Hub)
    • OSMO (Osmosis)
    • TIA (Celestia)

◆  What is the coin name?
│  My New Chain
│
◆  What is the mainnet symbol?
│  mynew
│
◆  What is the testnet symbol?
│  tmynew
│
◆  What is the base factor?
│  1e18
│
◆  Which key curve?
│  › ○ ed25519 (Edwards-curve)
│    ● secp256k1 (ECDSA)
│
◆  Does it support TSS?
│  Yes
│
◇  🔐 MPC Algorithm
│  Auto-set to: ecdsa
│
◆  What is the chain type?
│  › ○ Generic L1 (Unique L1 blockchains)
│    ● EVM-like (Ethereum Virtual Machine compatible)
│    ○ Substrate-like (Polkadot/Substrate based)
│    ○ Cosmos (Cosmos SDK chains)
│
◆  Include token support?
│  No

✓ Module files generated

✅ Module created successfully
📁 Location: modules/sdk-coin-mynew

Generated 22 files:
  • package.json
  • tsconfig.json
  • README.md
  • .eslintignore
  • .gitignore
  • .mocharc.yml
  • .npmignore
  • .prettierignore
  • .prettierrc.yml
  • src/index.ts
  ... and 12 more

📋 Next steps:
  1. Review generated files
  2. Add coin to statics configuration
  3. Register coin in BitGo module
  4. Update root tsconfig.packages.json
  5. cd modules/sdk-coin-mynew && yarn install && yarn build
  6. Run tests: yarn test

✨ All done! Happy coding!
```

## What Gets Generated

```
modules/sdk-coin-{symbol}/
├── package.json              # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── README.md                # Module documentation
├── Configuration files
│   ├── .eslintignore
│   ├── .gitignore
│   ├── .mocharc.yml
│   ├── .npmignore
│   ├── .prettierignore
│   └── .prettierrc.yml
├── src/
│   ├── index.ts             # Main exports
│   ├── {symbol}.ts          # Mainnet coin class
│   ├── t{symbol}.ts         # Testnet coin class
│   ├── register.ts          # Coin registration
│   └── lib/
│       ├── index.ts
│       ├── keyPair.ts       # Key pair management
│       ├── utils.ts         # Utility functions
│       ├── constants.ts     # Coin constants
│       └── iface.ts         # TypeScript interfaces
└── test/
    ├── unit/
    │   ├── index.ts         # Coin tests
    │   ├── keyPair.ts       # Key pair tests
    │   └── utils.ts         # Utility tests
    └── integration/
        └── index.ts         # Integration test placeholder
```

## Dependencies by Chain Type

### Generic L1
Basic dependencies for unique L1 blockchains:
- `@bitgo/sdk-core`
- `@bitgo/statics`
- `bignumber.js`
- `@bitgo/sdk-lib-mpc` (if TSS enabled)

### EVM-like
EVM-compatible chains add:
- All generic L1 dependencies
- `@bitgo/abstract-eth`

### Substrate-like
Substrate-based chains add:
- All generic L1 dependencies
- `@bitgo/abstract-substrate`
- `@polkadot/api`
- `@substrate/txwrapper-core`
- `@substrate/txwrapper-polkadot`

### Cosmos
Cosmos SDK chains add:
- All generic L1 dependencies
- `@bitgo/abstract-cosmos`

## After Generation

### 1. Review Generated Files
Check all generated files and look for `TODO` comments marking areas that need implementation.

### 2. Add to Statics
Add coin configuration to `modules/statics/src/coins.ts`:

```typescript
export const coins = CoinMap.fromCoins([
  // ... existing coins
  {
    id: 'mynew',
    name: 'My New Chain',
    fullName: 'My New Chain',
    network: {
      type: 'mynew',
      family: 'mynew',
    },
    features: ['valueless', 'tss'],
    baseFactor: '1e18',
    decimalPlaces: 18,
    isToken: false,
  },
  {
    id: 'tmynew',
    name: 'Testnet My New Chain',
    fullName: 'Testnet My New Chain',
    network: {
      type: 'tmynew',
      family: 'mynew',
    },
    features: ['valueless', 'tss'],
    baseFactor: '1e18',
    decimalPlaces: 18,
    isToken: false,
  },
]);
```

### 3. Register in BitGo
Update `modules/bitgo/src/v2/coins/index.ts`:

```typescript
import { Mynew } from '@bitgo/sdk-coin-mynew';

// In register() function:
GlobalCoinFactory.register('mynew', Mynew.createInstance);
GlobalCoinFactory.register('tmynew', Tmynew.createInstance);
```

### 4. Update Root Config
Add to `tsconfig.packages.json`:

```json
{
  "references": [
    // ... existing references
    { "path": "./modules/sdk-coin-mynew" }
  ]
}
```

### 5. Install and Build
```bash
cd modules/sdk-coin-mynew
yarn install
yarn build
```

### 6. Run Tests
```bash
yarn test
```

### 7. Implement Core Logic
Replace placeholder implementations in:
- `src/lib/utils.ts` - Address validation, public key validation
- `src/lib/keyPair.ts` - Key pair generation and management
- `src/{symbol}.ts` - Transaction building, signing, parsing

### 8. Write Tests
Complete the test suite in:
- `test/unit/index.ts` - Coin class tests
- `test/unit/keyPair.ts` - Key pair tests
- `test/unit/utils.ts` - Utility function tests

## Validation

The generator validates:
- Symbol format (lowercase alphanumeric)
- Module doesn't already exist
- Valid base factor expression
- MPC algorithm matches key curve
- All required inputs provided

## Supported Chains

### Generic L1
Unique layer-1 blockchains that don't fit other categories.

**Examples**: Canton, ICP

### EVM-like
Ethereum Virtual Machine compatible chains.

**Examples**: Arbitrum, Optimism, Polygon, Avalanche C-Chain

### Substrate-like
Polkadot/Substrate-based chains.

**Examples**: TAO (Bittensor), DOT (Polkadot), KSM (Kusama)

### Cosmos
Cosmos SDK chains using Tendermint/CometBFT consensus.

**Examples**: ATOM (Cosmos Hub), OSMO (Osmosis), TIA (Celestia)

## Troubleshooting

### Module Already Exists
If you see "Module sdk-coin-{symbol} already exists":
- Choose a different symbol, or
- Delete the existing module if it was a test

### Invalid Symbol
Symbols must be:
- Lowercase
- Alphanumeric only
- Start with a letter

Valid: `canton`, `icp`, `mynew`, `testcoin`
Invalid: `Canton`, `test-coin`, `123coin`, `my_coin`

### Dependencies Not Found
If dependency versions can't be resolved:
- Ensure you're running from the BitGoJS root directory
- Verify the referenced modules exist in `modules/`

## Tips

- **Use existing coins as reference**: Look at Canton (`sdk-coin-canton`) for generic L1, or TAO (`sdk-coin-tao`) for Substrate-like chains
- **Start simple**: Implement basic functionality first, then add advanced features
- **Follow existing patterns**: The generated code follows patterns from existing modules
- **Test thoroughly**: Write comprehensive unit tests before integration tests

## Need Help?

- Check existing coin implementations in `modules/`
- Review BitGo SDK Core documentation
- See [PLUGIN_DEVELOPMENT.md](./PLUGIN_DEVELOPMENT.md) if you want to add a new chain type

---

**Version**: 2.0.1
**Generated modules version**: 1.0.0
