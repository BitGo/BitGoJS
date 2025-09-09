// Import the 'should' assertion library for testing
import 'should';
// Import BitGo testing utilities
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
// Import core types for transaction verification
import { VerifyTransactionOptions } from '@bitgo/sdk-core';
// Import NEAR-specific types and classes
import { TransactionPrebuild, Near } from '../../src/near';
import { TNear as TNearCoin } from '../../src/tnear';
// Import test data containing sample transactions and account info
import * as testData from '../resources/near';

/**
 * Test suite for NEAR token enablement validation
 *
 * Token enablement is a process where users must "enable" a token before they can receive it.
 * This involves creating a storage deposit transaction that allocates space on the blockchain
 * for the token balance. This test validates that the security checks work correctly.
 */
describe('NEAR Token Enablement Validation', function () {
  let bitgo: TestBitGoAPI; // BitGo API instance for testing
  let basecoin: Near; // NEAR coin implementation instance

  // Setup that runs once before all tests
  before(function () {
    // Create a test BitGo instance configured for the test environment
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    // Register the TNEAR (testnet NEAR) coin with BitGo
    bitgo.safeRegister('tnear', TNearCoin.createInstance);
    // Get the NEAR coin instance we'll use for testing
    basecoin = bitgo.coin('tnear') as Near;
  });

  /**
   * Helper function to create valid transaction parameters for token enablement
   * @returns Transaction parameters that should pass validation
   */
  const createValidTxParams = () => ({
    type: 'enabletoken' as const, // Tells BitGo this is a token enablement transaction
    recipients: [
      {
        address: testData.accounts.account1.address, // The account that will receive the token capability
        amount: '0', // Token enablement typically has 0 amount (no tokens transferred, just enabling)
        tokenName: 'tnear:tnep24dp', // The specific token being enabled (testnet NEP-141 token)
      },
    ],
  });

  /**
   * Helper function to create a transaction prebuild object
   * @param txHex - The raw transaction hex string
   * @returns A TransactionPrebuild object with the hex and metadata
   */
  const createTxPrebuild = (txHex: string): TransactionPrebuild => ({
    txHex, // The actual transaction data in hexadecimal format
    key: 'test-key', // Public key (placeholder for testing)
    blockHash: 'test-block-hash', // Recent block hash (placeholder for testing)
    nonce: BigInt(1), // Transaction nonce to prevent replay attacks
  });

  /**
   * TEST 1: Happy Path - Valid Token Enablement Transaction
   *
   * This test verifies that a properly formed token enablement transaction passes validation.
   * It uses a real storage deposit transaction hex from the test data.
   */
  it('should validate valid token enablement transaction', async function () {
    // Create valid transaction parameters
    const txParams = createValidTxParams();

    // Create transaction prebuild using a real storage deposit transaction
    // This hex represents a NEAR transaction that creates storage space for a token
    const txPrebuild = createTxPrebuild(testData.rawTx.selfStorageDeposit.unsigned);

    // Prepare the verification options that would be passed to BitGo
    const verifyOptions: VerifyTransactionOptions = {
      txParams, // What the user thinks they're signing
      txPrebuild, // The actual transaction hex from BitGo
      wallet: { id: 'test-wallet' } as any, // Mock wallet object
    };

    // This should NOT throw an error - the transaction should be valid
    // The verifyTransaction method will call validateTokenEnablementTransaction internally
    await basecoin.verifyTransaction(verifyOptions);
  });

  /**
   * TEST 2: Security Test - Transaction Hex Mismatch Detection
   *
   * This test verifies that the validation catches when the transaction hex doesn't match
   * what the user expects to sign. This is a critical security check to prevent attacks
   * where a malicious actor substitutes a different transaction.
   */
  it('should reject transaction with mismatched hex', async function () {
    // Create token enablement parameters but with the recipient address that matches the transfer transaction
    const txParams = {
      type: 'enabletoken' as const,
      recipients: [
        {
          address: testData.accounts.account2.address, // This matches the transfer transaction recipient
          amount: '0',
          tokenName: 'tnear:tnep24dp',
        },
      ],
    };

    // BUT use a DIFFERENT transaction type (regular transfer instead of storage deposit)
    // This simulates an attack where someone tries to trick the user into signing
    // a different transaction than what they think they're signing
    const txPrebuild = createTxPrebuild(testData.rawTx.transfer.unsigned); // Different transaction type

    const verifyOptions: VerifyTransactionOptions = {
      txParams, // User thinks they're enabling a token
      txPrebuild, // But the actual hex is for a money transfer!
      wallet: { id: 'test-wallet' } as any,
    };

    // This SHOULD throw an error because the hex doesn't match the expected transaction type
    // The validation will detect that the transaction outputs don't match the expected token enablement parameters
    await basecoin
      .verifyTransaction(verifyOptions)
      .should.be.rejectedWith('Tx outputs does not match with expected txParams recipients');
  });

  /**
   * TEST 3: Security Test - Address Mismatch Detection
   *
   * This test verifies that the validation catches when the recipient address in the
   * transaction parameters doesn't match the actual address in the transaction hex.
   * This prevents attacks where someone changes the destination address.
   */
  it('should reject transaction with address mismatch', async function () {
    // Create transaction parameters with a WRONG address
    const txParams = {
      type: 'enabletoken' as const,
      recipients: [
        {
          address: 'wrong.address.near', // This doesn't match the address in the transaction hex
          amount: '0',
          tokenName: 'tnear:tnep24dp',
        },
      ],
    };

    // Use the correct storage deposit transaction hex
    const txPrebuild = createTxPrebuild(testData.rawTx.selfStorageDeposit.unsigned);

    const verifyOptions: VerifyTransactionOptions = {
      txParams, // Contains wrong address
      txPrebuild, // Contains correct address in the hex
      wallet: { id: 'test-wallet' } as any,
    };

    // This SHOULD throw an error because the addresses don't match
    // The validateTokenEnablementTransaction method should detect this mismatch
    // and prevent the user from being tricked into enabling tokens for the wrong address
    await basecoin.verifyTransaction(verifyOptions).should.be.rejectedWith('Address mismatch: wrong.address.near');
  });
});
