// Import the 'should' assertion library for testing
import 'should';
// Import BitGo testing utilities
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
// Import core types for transaction verification
import { VerifyTransactionOptions, common } from '@bitgo/sdk-core';
// Import NEAR-specific types and classes
import { TransactionPrebuild, Near } from '../../src/near';
import { TNear as TNearCoin } from '../../src/tnear';
// Import test data containing sample transactions and account info
import * as testData from '../resources/near';
// Import testing utilities
import nock from 'nock';
import assert from 'assert';

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

  /**
   * TEST 4: Security Test - Spoofed TxHex Detection
   *
   * This test simulates what happens when the wallet platform tries to send a token enablement
   * transaction but receives a spoofed TxHex from a malicious actor. This test verifies that
   * our validation catches the spoofed transaction and prevents the user from being tricked.
   */
  it('should reject spoofed TxHex in token enablement transaction', async function () {
    // Create valid transaction parameters for token enablement
    const txParams = createValidTxParams();

    // Create a SPOOFED transaction hex that looks like a valid NEAR transaction
    // but contains malicious data (e.g., different recipient, wrong token contract, etc.)
    const spoofedTxHex = testData.rawTx.fungibleTokenTransfer.unsigned; // Using transfer instead of storage deposit

    const txPrebuild = createTxPrebuild(spoofedTxHex);

    const verifyOptions: VerifyTransactionOptions = {
      txParams, // User thinks they're enabling a token
      txPrebuild, // But the hex is for a different transaction type (fungible token transfer)
      wallet: { id: 'test-wallet' } as any,
    };

    // This SHOULD throw an error because the spoofed hex doesn't match the expected
    // token enablement transaction. The validation will detect that this is not a
    // proper storage deposit transaction for token enablement.
    // The storage deposit amount validation catches this first
    await basecoin.verifyTransaction(verifyOptions).should.be.rejectedWith('Storage deposit amount not matching!');
  });

  /**
   * TEST 5: Wallet Platform Integration Test
   *
   * This test verifies that transactions sent from the wallet platform are properly
   * validated and pass through our security checks. This ensures that legitimate
   * wallet platform operations work correctly.
   */
  it('should validate token enablement transaction from wallet platform', async function () {
    // Simulate a transaction that would be sent from the wallet platform
    // This uses the same valid storage deposit transaction but with wallet platform context
    const txParams = {
      type: 'enabletoken' as const,
      recipients: [
        {
          address: testData.accounts.account1.address, // Wallet platform controlled address
          amount: '0',
          tokenName: 'tnear:tnep24dp',
        },
      ],
    };

    // Use the legitimate storage deposit transaction hex from wallet platform
    const txPrebuild = createTxPrebuild(testData.rawTx.selfStorageDeposit.unsigned);

    const verifyOptions: VerifyTransactionOptions = {
      txParams, // Wallet platform transaction parameters
      txPrebuild, // Legitimate transaction hex from wallet platform
      wallet: { id: 'wallet-platform-wallet' } as any, // Wallet platform wallet
    };

    // This should NOT throw an error - legitimate wallet platform transactions
    // should pass validation and be processed successfully
    await basecoin.verifyTransaction(verifyOptions);
  });

  /**
   * TEST 6: Security Test - sendTokenEnablements with Spoofed TxHex
   *
   * This test simulates what happens when the wallet platform's sendTokenEnablements
   * method receives a spoofed TxHex from a malicious actor. This test verifies that
   * our validation catches the spoofed transaction and prevents the user from being tricked.
   *
   * The test simulates the flow where:
   * 1. Wallet platform calls sendTokenEnablements
   * 2. buildTokenEnablements returns a spoofed transaction hex
   * 3. sendTokenEnablement calls verifyTransaction during signing
   * 4. verifyTransaction detects the spoofed hex and throws an error
   */
  it('should throw error when sendTokenEnablements receives spoofed TxHex', async function () {
    // Create a mock wallet that implements the sendTokenEnablements flow
    const mockWallet = {
      id: () => 'test-wallet',
      bitgo: bitgo,
      baseCoin: basecoin,

      // Mock buildTokenEnablements to return a spoofed transaction hex
      buildTokenEnablements: async (params: any) => {
        return [
          {
            txHex: testData.rawTx.fungibleTokenTransfer.unsigned, // SPOOFED: This is a transfer, not storage deposit
            key: 'test-key',
            blockHash: 'test-block-hash',
            nonce: BigInt(1),
            txParams: {
              type: 'enabletoken',
              recipients: [
                {
                  address: testData.accounts.account1.address,
                  amount: '0',
                  tokenName: 'tnear:tnep24dp',
                },
              ],
            },
          },
        ];
      },

      // Mock sendTokenEnablement to simulate the signing process with verification
      sendTokenEnablement: async (params: any) => {
        // This is where verifyTransaction would be called during signing
        // The spoofed hex should cause verification to fail
        const verifyOptions: VerifyTransactionOptions = {
          txParams: params.txParams,
          txPrebuild: params.prebuildTx,
          wallet: mockWallet as any,
        };

        // This should throw an error because the hex is spoofed
        await basecoin.verifyTransaction(verifyOptions);
        return { success: true };
      },

      // Implement the actual sendTokenEnablements method
      sendTokenEnablements: async (params: any) => {
        const unsignedBuilds = await mockWallet.buildTokenEnablements(params);
        const successfulTxs: any[] = [];
        const failedTxs = new Array<Error>();

        for (const unsignedBuild of unsignedBuilds) {
          const unsignedBuildWithOptions = {
            ...params,
            prebuildTx: unsignedBuild,
            txParams: unsignedBuild.txParams,
          };
          try {
            const sendTx = await mockWallet.sendTokenEnablement(unsignedBuildWithOptions);
            successfulTxs.push(sendTx);
          } catch (e) {
            failedTxs.push(e);
          }
        }

        return {
          success: successfulTxs,
          failure: failedTxs,
        };
      },
    };

    // Create token enablement parameters
    const enableTokensParams = {
      enableTokens: [
        {
          name: 'tnear:tnep24dp',
        },
      ],
    };

    // Call sendTokenEnablements - this should fail because of the spoofed hex
    const result = await mockWallet.sendTokenEnablements(enableTokensParams);

    // The result should contain failures due to the spoofed transaction hex
    result.success.should.have.length(0);
    result.failure.should.have.length(1);
    result.failure[0].message.should.containEql('Storage deposit amount not matching!');
  });

  /**
   * TEST 7: Security Test - sendAccountConsolidations with Spoofed TxHex
   *
   * This test simulates what happens when the wallet platform's sendAccountConsolidations
   * method receives a spoofed TxHex from a malicious actor. This test verifies that
   * our validation catches the spoofed transaction and prevents the user from being tricked.
   *
   * The test simulates the flow where:
   * 1. Wallet platform calls sendAccountConsolidations
   * 2. buildAccountConsolidations returns a spoofed transaction hex
   * 3. sendAccountConsolidation calls verifyTransaction during signing
   * 4. verifyTransaction detects the spoofed hex and throws an error
   */
  it('should throw error when sendAccountConsolidations receives spoofed TxHex', async function () {
    // Create a mock wallet that implements the sendAccountConsolidations flow
    const mockWallet = {
      id: () => 'test-wallet',
      bitgo: bitgo,
      baseCoin: basecoin,

      // Mock buildAccountConsolidations to return a spoofed transaction hex
      buildAccountConsolidations: async (params: any) => {
        return [
          {
            txHex: testData.rawTx.fungibleTokenTransfer.unsigned, // SPOOFED: This is a transfer, not consolidation
            key: 'test-key',
            blockHash: 'test-block-hash',
            nonce: BigInt(1),
            txParams: {
              type: 'consolidate',
              recipients: [
                {
                  address: testData.accounts.account1.address,
                  amount: '1000000',
                },
              ],
            },
          },
        ];
      },

      // Mock sendAccountConsolidation to simulate the signing process with verification
      sendAccountConsolidation: async (params: any) => {
        // This is where verifyTransaction would be called during signing
        // The spoofed hex should cause verification to fail
        const verifyOptions: VerifyTransactionOptions = {
          txParams: params.txParams,
          txPrebuild: params.prebuildTx,
          wallet: mockWallet as any,
        };

        // This should throw an error because the hex is spoofed
        await basecoin.verifyTransaction(verifyOptions);
        return { success: true };
      },

      // Implement the actual sendAccountConsolidations method
      sendAccountConsolidations: async (params: any) => {
        const unsignedBuilds = await mockWallet.buildAccountConsolidations(params);
        const successfulTxs: any[] = [];
        const failedTxs = new Array<Error>();

        for (const unsignedBuild of unsignedBuilds) {
          const unsignedBuildWithOptions = {
            ...params,
            prebuildTx: unsignedBuild,
            txParams: unsignedBuild.txParams,
          };
          try {
            const sendTx = await mockWallet.sendAccountConsolidation(unsignedBuildWithOptions);
            successfulTxs.push(sendTx);
          } catch (e) {
            failedTxs.push(e);
          }
        }

        return {
          success: successfulTxs,
          failure: failedTxs,
        };
      },
    };

    // Create account consolidation parameters
    const consolidationParams = {
      consolidateAddresses: [testData.accounts.account2.address],
    };

    // Call sendAccountConsolidations - this should fail because of the spoofed hex
    const result = await mockWallet.sendAccountConsolidations(consolidationParams);

    // The result should contain failures due to the spoofed transaction hex
    result.success.should.have.length(0);
    result.failure.should.have.length(1);
    // The error should be related to transaction output mismatch since it's a different transaction type
    result.failure[0].message.should.containEql('Tx outputs does not match with expected txParams recipients');
  });

  /**
   * TEST 8: Security Test - Spoofed Transaction Hex from Wallet Platform
   *
   * This test simulates what happens when the wallet platform sends a spoofed transaction hex
   * for token enablement. This test verifies that our validation catches the spoofed transaction
   * and prevents the user from being tricked into signing malicious transactions.
   *
   * The test simulates the flow where:
   * 1. Wallet platform calls the API to build a token enablement transaction
   * 2. A malicious actor intercepts and returns a spoofed transaction hex
   * 3. The verification logic should detect the spoofed hex and throw an error
   */
  it('should fail when wallet platform sends spoofed transaction hex for token enablement', async function () {
    // Create a valid transaction response structure from wallet platform with spoofed txHex
    // The txHex looks like valid hex but contains malicious/invalid transaction data
    const spoofedTxHex = '0a0c0a080800100018a8fb0410130a0c0a080800100018d5d0041014'; // Valid hex but invalid transaction

    // Mock the API endpoints that will be called during token enablement
    const bgUrl = common.Environments['mock'].uri;

    // Mock the key endpoint needed for signing
    nock(bgUrl)
      .post('/api/v2/tnear/key/5b3424f91bf34993006eae94')
      .reply(200, [
        {
          encryptedPrv: 'fakePrv',
        },
      ]);

    // Mock the prebuild API response to return spoofed txHex
    nock(bgUrl)
      .post('/api/v2/tnear/wallet/5b34252f1bf34993006eae96/tx/build')
      .reply(200, {
        txHex: spoofedTxHex,
        txid: '586c5b59b10b134d04c16ac1b273fe3c5529f34aef75db4456cd469c5cdac7e2',
        recipients: [
          {
            address: 'test.near',
            amount: '0', // Valid amount for token enablement
          },
        ],
        coin: 'tnear',
        feeInfo: {
          size: 1000,
          fee: 1160407,
          feeRate: 1160407,
        },
      });

    // This should fail because the spoofed transaction hex contains invalid transaction data
    // The verification logic should catch this when trying to validate the transaction
    await assert.rejects(
      async () => {
        // Create valid transaction parameters for token enablement
        const txParams = createValidTxParams();

        // Create transaction prebuild with spoofed hex
        const txPrebuild = createTxPrebuild(spoofedTxHex);

        const verifyOptions: VerifyTransactionOptions = {
          txParams, // What the user thinks they're signing
          txPrebuild, // The spoofed transaction hex from malicious actor
          wallet: { id: 'test-wallet' } as any,
        };

        // This should fail because the spoofed hex doesn't represent a valid NEAR transaction
        await basecoin.verifyTransaction(verifyOptions);
      },
      (error: any) => {
        // The error should indicate that the transaction is invalid
        // This could be various validation errors depending on what the spoofed hex contains
        return error.message.includes('unable to build transaction from raw');
      }
    );
  });
});
