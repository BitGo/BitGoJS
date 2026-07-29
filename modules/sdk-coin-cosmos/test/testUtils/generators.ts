/**
 * Data generation functions for Cosmos SDK test data
 * This file contains functions to generate test data for Cosmos SDK-based coins
 */

import {
  ChainConfig,
  DefaultValues,
  TestTransaction,
  TestAddresses,
  TestBlockHashes,
  TestTxIds,
  TestCoinAmounts,
  GasBudget,
  TransactionMessage,
  CoinTestData,
} from './types';

/**
 * Generate addresses for testing
 * @param {DefaultValues} defaults - Default values containing base addresses
 * @returns {TestAddresses} Object containing various test addresses
 */
export const generateAddresses = (defaults: DefaultValues): TestAddresses => {
  return {
    address1: defaults.senderAddress,
    address2: defaults.recipientAddress1,
    address3: defaults.recipientAddress2 || '',
    address4: defaults.senderAddress.slice(0, -1), // remove last character to make invalid
    address5: defaults.senderAddress + 'x', // add random character to make invalid
    address6: defaults.senderAddress.replace(/[a-z]/, '.'), // add dot to make invalid
    validatorAddress1: defaults.validatorAddress1,
    validatorAddress2: defaults.validatorAddress2,
    validatorAddress3: defaults.validatorAddress1 + 'sd', // extra characters to make invalid
    validatorAddress4: defaults.validatorAddress1.replace('1', 'x'), // change character to make invalid
    noMemoIdAddress: defaults.recipientAddress1,
    validMemoIdAddress: defaults.recipientAddress1 + '?memoId=2',
    invalidMemoIdAddress: defaults.recipientAddress1 + '?memoId=1.23',
    multipleMemoIdAddress: defaults.recipientAddress1 + '?memoId=3&memoId=12',
  };
};

/**
 * Generate transaction IDs from test transactions
 * @param {Object} testTxs - Object containing test transactions
 * @returns {TestTxIds} Object containing transaction IDs
 */
export const generateTxIds = (testTxs: { [key: string]: TestTransaction }): TestTxIds => {
  return {
    hash1: testTxs.TEST_SEND_TX.hash,
    hash2: testTxs.TEST_SEND_TX2.hash,
    hash3: testTxs.TEST_SEND_MANY_TX.hash,
  };
};

/**
 * Generate coin amounts for testing
 * @param {string} baseDenom - Base denomination of the coin
 * @returns {TestCoinAmounts} Object containing various test amounts
 */
export const generateCoinAmounts = (baseDenom: string): TestCoinAmounts => {
  return {
    amount1: { amount: '1', denom: baseDenom },
    amount2: { amount: '10', denom: baseDenom },
    amount3: { amount: '100', denom: baseDenom },
    amount4: { amount: '-1', denom: baseDenom },
    amount5: { amount: '100', denom: 'm' + baseDenom },
  };
};

/**
 * Generate a standard transaction message for sending tokens
 * @param {string} fromAddress - The sender address
 * @param {string} toAddress - The recipient address
 * @param {string} denom - The token denomination
 * @param {string} amount - The amount to send
 * @returns {TransactionMessage} A transaction message
 */
export const generateSendMessage = (
  fromAddress: string,
  toAddress: string,
  denom: string,
  amount: string
): TransactionMessage => {
  return {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom,
          amount,
        },
      ],
      fromAddress,
      toAddress,
    },
  };
};

/**
 * Generate a standard gas budget
 * @param {string} denom - The token denomination
 * @param {string} amount - The gas amount
 * @param {number} gasLimit - The gas limit
 * @returns {GasBudget} A gas budget
 */
export const generateGasBudget = (denom: string, amount: string, gasLimit = 500000): GasBudget => {
  return {
    amount: [{ denom, amount }],
    gasLimit,
  };
};

/**
 * Generate complete coin test data
 * @param {ChainConfig} chainConfig - Chain configuration
 * @param {DefaultValues} defaults - Default values
 * @param {TestBlockHashes} blockHashes - Block hashes for testing
 * @param {Object} testTxs - Test transactions
 * @returns {CoinTestData} Complete coin test data
 */
export const generateCoinData = (
  chainConfig: ChainConfig,
  defaults: DefaultValues,
  blockHashes: TestBlockHashes,
  testTxs: { [key: string]: TestTransaction }
): CoinTestData => {
  const addresses = generateAddresses(defaults);
  const txIds = generateTxIds(testTxs);
  const coinAmounts = generateCoinAmounts(chainConfig.baseDenom);

  return {
    mainnetName: chainConfig.mainnetName,
    mainnetCoin: chainConfig.mainnetCoin,
    testnetCoin: chainConfig.testnetCoin,
    testnetName: chainConfig.testnetName,
    family: chainConfig.family,
    decimalPlaces: chainConfig.decimalPlaces,
    baseDenom: chainConfig.baseDenom,
    chainId: chainConfig.chainId,
    senderAddress: defaults.senderAddress,
    pubKey: defaults.pubKey,
    privateKey: defaults.privateKey,
    validatorPrefix: chainConfig.validatorPrefix,
    addressPrefix: chainConfig.addressPrefix,
    addresses,
    blockHashes,
    txIds,
    coinAmounts,
    testSendTx: {
      ...testTxs.TEST_SEND_TX,
      sender: testTxs.TEST_SEND_TX.sender || defaults.senderAddress,
      recipient: testTxs.TEST_SEND_TX.recipient || defaults.recipientAddress1,
      chainId: chainConfig.chainId,
      sendAmount: testTxs.TEST_SEND_TX.sendAmount || defaults.sendAmount,
      feeAmount: testTxs.TEST_SEND_TX.feeAmount || defaults.feeAmount,
      privateKey: testTxs.TEST_SEND_TX.privateKey || defaults.privateKey,
      pubKey: testTxs.TEST_SEND_TX.pubKey || defaults.pubKey,
      gasBudget: generateGasBudget(
        chainConfig.baseDenom,
        testTxs.TEST_SEND_TX.feeAmount || defaults.feeAmount,
        defaults.gasLimit
      ),
      sendMessage: generateSendMessage(
        testTxs.TEST_SEND_TX.sender || defaults.senderAddress,
        testTxs.TEST_SEND_TX.recipient || defaults.recipientAddress1,
        chainConfig.baseDenom,
        testTxs.TEST_SEND_TX.sendAmount || defaults.sendAmount
      ),
    },
    testSendTx2: {
      ...testTxs.TEST_SEND_TX2,
      sender: testTxs.TEST_SEND_TX2.sender || defaults.senderAddress,
      recipient: testTxs.TEST_SEND_TX2.recipient || defaults.recipientAddress1,
      chainId: chainConfig.chainId,
      sendAmount: testTxs.TEST_SEND_TX2.sendAmount || defaults.sendAmount,
      feeAmount: testTxs.TEST_SEND_TX2.feeAmount || defaults.feeAmount,
      privateKey: testTxs.TEST_SEND_TX2.privateKey || defaults.privateKey,
      pubKey: testTxs.TEST_SEND_TX2.pubKey || defaults.pubKey,
      gasBudget: generateGasBudget(
        chainConfig.baseDenom,
        testTxs.TEST_SEND_TX2.feeAmount || defaults.feeAmount,
        defaults.gasLimit
      ),
      sendMessage: generateSendMessage(
        testTxs.TEST_SEND_TX2.sender || defaults.senderAddress,
        testTxs.TEST_SEND_TX2.recipient || defaults.recipientAddress1,
        chainConfig.baseDenom,
        testTxs.TEST_SEND_TX2.sendAmount || defaults.sendAmount
      ),
    },
    testSendManyTx: {
      ...testTxs.TEST_SEND_MANY_TX,
      sender: testTxs.TEST_SEND_MANY_TX.sender || defaults.senderAddress,
      chainId: chainConfig.chainId,
      sendAmount: testTxs.TEST_SEND_MANY_TX.sendAmount || defaults.sendAmount,
      sendAmount2: testTxs.TEST_SEND_MANY_TX.sendAmount2 || defaults.sendAmount2,
      feeAmount: testTxs.TEST_SEND_MANY_TX.feeAmount || defaults.feeAmount,
      pubKey: testTxs.TEST_SEND_MANY_TX.pubKey || defaults.pubKey,
      privateKey: testTxs.TEST_SEND_MANY_TX.privateKey || defaults.privateKey,
      memo: '',
      gasBudget: generateGasBudget(
        chainConfig.baseDenom,
        testTxs.TEST_SEND_MANY_TX.feeAmount || defaults.feeAmount,
        defaults.gasLimit
      ),
      sendMessages: [
        generateSendMessage(
          testTxs.TEST_SEND_MANY_TX.sender || defaults.senderAddress,
          testTxs.TEST_SEND_MANY_TX.recipient || defaults.recipientAddress1,
          chainConfig.baseDenom,
          testTxs.TEST_SEND_MANY_TX.sendAmount || defaults.sendAmount
        ),
        generateSendMessage(
          testTxs.TEST_SEND_MANY_TX.sender || defaults.senderAddress,
          testTxs.TEST_SEND_MANY_TX.recipient2 || defaults.recipientAddress1,
          chainConfig.baseDenom,
          testTxs.TEST_SEND_MANY_TX.sendAmount2 || defaults.sendAmount
        ),
      ],
    },
    testTxWithMemo: {
      ...testTxs.TEST_TX_WITH_MEMO,
      sender: testTxs.TEST_TX_WITH_MEMO.sender || defaults.senderAddress,
      recipient: testTxs.TEST_TX_WITH_MEMO.recipient || defaults.recipientAddress1,
      chainId: chainConfig.chainId,
      sendAmount: testTxs.TEST_TX_WITH_MEMO.sendAmount || defaults.sendAmount,
      feeAmount: testTxs.TEST_TX_WITH_MEMO.feeAmount || defaults.feeAmount,
      pubKey: testTxs.TEST_TX_WITH_MEMO.pubKey || defaults.pubKey,
      privateKey: testTxs.TEST_TX_WITH_MEMO.privateKey || defaults.privateKey,
      gasBudget: generateGasBudget(
        chainConfig.baseDenom,
        testTxs.TEST_TX_WITH_MEMO.feeAmount || defaults.feeAmount,
        defaults.gasLimit
      ),
      sendMessage: generateSendMessage(
        testTxs.TEST_TX_WITH_MEMO.sender || defaults.senderAddress,
        testTxs.TEST_TX_WITH_MEMO.recipient || defaults.recipientAddress1,
        chainConfig.baseDenom,
        testTxs.TEST_TX_WITH_MEMO.sendAmount || defaults.sendAmount
      ),
    },
  };
};
