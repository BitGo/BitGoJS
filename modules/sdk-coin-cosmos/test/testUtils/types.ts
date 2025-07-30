/**
 * Type definitions for Cosmos SDK test data
 * This file contains all interfaces used in the test framework
 */

/**
 * Interface for chain configuration
 */
export interface ChainConfig {
  mainnetName: string;
  mainnetCoin: string;
  testnetName: string;
  testnetCoin: string;
  family: string;
  decimalPlaces: number;
  baseDenom: string;
  chainId: string;
  addressPrefix: string;
  validatorPrefix: string;
}

/**
 * Interface for default values
 */
export interface DefaultValues {
  senderAddress: string;
  pubKey: string;
  privateKey: string;
  recipientAddress1: string;
  recipientAddress2?: string; // Optional for multi-send transactions
  sendMessageTypeUrl: string;
  sendAmount: string;
  sendAmount2?: string; // Optional for multi-send transactions
  feeAmount: string;
  gasLimit: number;
  validatorAddress1: string;
  validatorAddress2: string;
}

/**
 * Interface for test transaction
 */
export interface TestTransaction {
  hash: string;
  signature: string;
  signedTxBase64: string;
  accountNumber: number;
  sequence: number;
  sender?: string;
  recipient?: string;
  recipient2?: string; // Optional for multi-send transactions
  memo?: string;
  pubKey?: string;
  privateKey?: string;
  sendAmount?: string;
  sendAmount2?: string; // Optional for multi-send transactions
  feeAmount?: string;
  gasBudget?: GasBudget;
}

/**
 * Interface for address data
 */
export interface TestAddresses {
  address1: string;
  address2: string;
  address3: string;
  address4?: string;
  address5?: string;
  address6?: string;
  validatorAddress1: string;
  validatorAddress2: string;
  validatorAddress3?: string;
  validatorAddress4?: string;
  noMemoIdAddress: string;
  validMemoIdAddress: string;
  invalidMemoIdAddress: string;
  multipleMemoIdAddress: string;
}

/**
 * Interface for block hash data
 */
export interface TestBlockHashes {
  hash1: string;
  hash2: string;
}

/**
 * Interface for transaction IDs
 */
export interface TestTxIds {
  hash1: string;
  hash2: string;
  hash3: string;
}

/**
 * Interface for coin amounts
 */
export interface TestCoinAmounts {
  amount1: { amount: string; denom: string };
  amount2: { amount: string; denom: string };
  amount3: { amount: string; denom: string };
  amount4: { amount: string; denom: string };
  amount5: { amount: string; denom: string };
}

/**
 * Interface for a transaction message
 */
export interface TransactionMessage {
  typeUrl: string;
  value: any;
}

/**
 * Interface for gas budget
 */
export interface GasBudget {
  amount: { denom: string; amount: string }[];
  gasLimit: number;
}

/**
 * Interface for a basic transaction
 */
export interface TestSendTransaction {
  hash: string;
  signature: string;
  signedTxBase64: string;
  sender: string;
  recipient?: string;
  chainId: string;
  accountNumber: number;
  sequence: number;
  sendAmount?: string;
  feeAmount: string;
  sendMessage?: TransactionMessage;
  gasBudget?: GasBudget;
  memo?: string;
  from?: string;
  to?: string;
  pubKey?: string;
  privateKey?: string;
}

/**
 * Interface for a multi-send transaction
 */
export interface TestMultiSendTransaction {
  hash: string;
  signature: string;
  signedTxBase64: string;
  sender: string;
  chainId: string;
  accountNumber: number;
  sequence: number;
  memo?: string;
  sendMessages?: TransactionMessage[];
  gasBudget?: GasBudget;
  sendAmount?: string;
  sendAmount2?: string;
  recipient?: string;
  recipient2?: string;
  pubKey?: string;
  privateKey?: string;
  feeAmount?: string;
}

/**
 * Main interface for coin test data
 */
export interface CoinTestData {
  mainnetName: string;
  mainnetCoin: string;
  testnetCoin: string;
  testnetName: string;
  family: string;
  decimalPlaces: number;
  baseDenom: string;
  chainId: string;
  senderAddress: string;
  pubKey: string;
  privateKey: string;
  validatorPrefix: string;
  addressPrefix: string;
  addresses: TestAddresses;
  blockHashes: TestBlockHashes;
  txIds: TestTxIds;
  coinAmounts: TestCoinAmounts;
  testSendTx: TestSendTransaction;
  testSendTx2: TestSendTransaction;
  testSendManyTx: TestMultiSendTransaction;
  testTxWithMemo: TestSendTransaction;
}
