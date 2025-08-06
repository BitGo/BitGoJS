# Cosmos SDK Test Framework

This directory contains the test framework for Cosmos SDK-based coins. The framework is designed to be configurable and extensible, allowing tests to run for any Cosmos-based blockchain through configuration rather than requiring individual coin modules.

## Overview

The test framework consists of:

1. A test utilities directory (`testUtils/`) that contains:

   - Type definitions (`types.ts`)
   - Data generation functions (`generators.ts`)
   - Utility functions (`utils.ts`)
   - A centralized data loader (`index.ts`)

2. Coin-specific test data files in the resources directory (e.g., `cosmos.ts`, `cronos.ts`)

3. Helper functions for tests in the unit directory

## Directory Structure

```
modules/sdk-coin-cosmos/test/
├── README.md           # This documentation
├── resources/          # Coin-specific test data
│   ├── cosmos.ts       # Cosmos test data
│   └── cronos.ts       # Cronos test data
├── testUtils/          # Test utilities
│   ├── index.ts        # Main exports and data loader
│   ├── types.ts        # Type definitions
│   ├── generators.ts   # Data generation functions
│   └── utils.ts        # Utility functions
└── unit/               # Unit tests
    ├── getBuilderFactory.ts  # Builder factory utility
    └── ... (other test files)
```

## Loading Test Data

To load test data in your tests, use the `getTestData` function:

```typescript
import { getTestData, getAvailableTestCoins } from '../testUtils';

// Get all available test coins
const availableCoins = getAvailableTestCoins();

// For each coin, load its test data
availableCoins.forEach((coinName) => {
  const testData = getTestData(coinName);
  // Use testData in your tests
});
```

## Adding a New Coin to the Test Framework

To add support for a new Cosmos SDK-based coin to the test framework, follow these steps:

### 1. Create a New Test Data File

Create a new TypeScript file in the `test/resources` directory named after your coin (e.g., `newcoin.ts`).

### 2. Import Required Dependencies

```typescript
import { generateCoinData } from '../testUtils/generators';
```

### 3. Define Chain Configuration

Define the basic chain configuration (using Cronos as an example):

```typescript
export const chainConfig = {
  name: 'Cronos POS',
  coin: 'cronos',
  testName: 'Testnet Cronos POS',
  testCoin: 'tcronos',
  family: 'cronos',
  decimalPlaces: 8,
  baseDenom: 'basetcro',
  chainId: 'testnet-croeseid-4',
  addressPrefix: 'tcro',
  validatorPrefix: 'tcrocncl',
};
```

### 4. Define Default Values

Define default values that will be used throughout the configuration:

```typescript
export const DEFAULTS = {
  senderAddress: 'tcro1e9rxy3j3wph0lqjxr0ynu0t3zjfnhc0csyldtl',
  pubKey: 'AtlNaLjd5ijapNfxJCzOJV4pdMBouEomADHNgQEPulHL',
  privateKey: 'peFJjp2ECSNTRdKBfVhv8aGgoUBbmYPp2+l9prY5zjc=',
  recipientAddress1: 'tcro1rhs402vnjf7369yyjkk0nrskupmfl4yxpnaahj',
  recipientAddress2: 'tcro1u73cmemdgd5qx06cmtehr3z5pgswtar65f9sp54',
  sendMessageTypeUrl: '/cosmos.bank.v1beta1.MsgSend',
  sendAmount: '10000',
  feeAmount: '30000',
  gasLimit: 500000,
  validatorAddress1: 'tcrocncl1s4ggq2zuzvwg5k8vnx2xfwtdm4cz6wtnuqkl7a',
  validatorAddress2: 'tcrocncl163tv59yzgeqcap8lrsa2r4zk580h8ddr5a0sdd',
};
```

### 5. Define Test Transactions

Define test transactions with minimal required fields:

```typescript
export const TEST_SEND_TX = {
  hash: 'AF0E060E0B5FD6041010B7A93340A045286F48D03CDCC81C4C29D11730334AD1',
  signature: '5H3a5WlZS3yvL+muU8qPB1IlYBxvuu7vIDOQuIc0JMU06kNtj8arKQLH9NGEpweu3u84KXYURA+Qxo8AzoO8Zw==',
  signedTxBase64:
    'CowBCokBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmkKK3Rjcm8xZTlyeHkzajN3cGgwbHFqeHIweW51MHQzempmbmhjMGNzeWxkdGwSK3Rjcm8xcmhzNDAydm5qZjczNjl5eWprazBucnNrdXBtZmw0eXhwbmFhaGoaDQoIYmFzZXRjcm8SATESawpQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAtlNaLjd5ijapNfxJCzOJV4pdMBouEomADHNgQEPulHLEgQKAggBGAoSFwoRCghiYXNldGNybxIFMzAwMDAQoMIeGkDkfdrlaVlLfK8v6a5Tyo8HUiVgHG+67u8gM5C4hzQkxTTqQ22PxqspAsf00YSnB67e7zgpdhRED5DGjwDOg7xn',
  accountNumber: 10,
  sequence: 10,
  sendAmount: '1',
};

// Define other test transactions...
```

### 6. Generate Complete Coin Data

Use the `generateCoinData` function to generate the complete coin data:

```typescript
export const cronos = generateCoinData(chainConfig, DEFAULTS, {
  TEST_SEND_TX,
  TEST_SEND_TX2,
  TEST_SEND_MANY_TX,
  TEST_TX_WITH_MEMO,
});

export default cronos;
```

### 7. Ensure Coin is Registered in BitGo Statics

Make sure your coin is properly registered in the `@bitgo/statics` package. The test framework uses this to get coin configurations.

### 8. Test Your Implementation

Run the tests to verify that your coin implementation works correctly:

```bash
npm run test -- --grep="Cosmos"
```

## Helper Functions

The framework provides several helper functions to make it easier to create test data:

- `generateCoinData`: Generates complete coin test data from chain config, defaults, and test transactions
- `generateAddresses`: Generates test addresses from default values
- `generateBlockHashes`: Generates standard block hashes for testing
- `generateTxIds`: Generates transaction IDs from test transactions
- `generateCoinAmounts`: Generates coin amounts for testing
- `generateSendMessage`: Creates a standard transaction message for sending tokens
- `generateGasBudget`: Creates a standard gas budget
- `getTestData`: Loads test data for a specific coin
- `getAvailableTestCoins`: Gets all available test coins

## Best Practices

1. **Minimize Configuration**: Keep your configuration minimal by defining only the essential properties.
2. **Use Default Values**: Define default values that can be reused throughout the configuration.
3. **Leverage Helper Functions**: Use the provided helper functions to generate common data structures.
4. **Consistent Naming**: Follow the naming conventions used in existing test data files.
5. **Complete Test Coverage**: Ensure your test data covers all the required fields and edge cases.
6. **Documentation**: Add comments to explain any coin-specific peculiarities or requirements.
