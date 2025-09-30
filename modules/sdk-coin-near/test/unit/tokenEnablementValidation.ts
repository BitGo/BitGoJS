import 'should';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { VerifyTransactionOptions, common, Wallet } from '@bitgo/sdk-core';
import { TransactionPrebuild, Near } from '../../src/near';
import { TNear as TNearCoin } from '../../src/tnear';
import * as testData from '../resources/near';
import nock from 'nock';

/**
 * Test suite for NEAR token enablement validation
 *
 * Token enablement is a process where users must "enable" a token before they can receive it.
 * This involves creating a storage deposit transaction that allocates space on the blockchain
 * for the token balance. This test validates that the security checks work correctly.
 */
describe('NEAR Token Enablement Validation', function () {
  let bitgo: TestBitGoAPI;
  let basecoin: Near;
  let wallet: Wallet;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.initializeTestVars();
    bitgo.safeRegister('tnear', TNearCoin.createInstance);
    basecoin = bitgo.coin('tnear') as Near;

    // Create a test wallet for sendTokenEnablements testing
    const walletData = {
      id: '5b34252f1bf34993006eae96',
      coin: 'tnear',
      type: 'hot', // Set wallet type to hot so it goes through prebuildAndSignTransaction
      keys: ['5b3424f91bf34993006eae94', '5b3424f91bf34993006eae95', '5b3424f91bf34993006eae96'],
      coinSpecific: {
        baseAddress: testData.accounts.account1.address,
      },
    };
    wallet = new Wallet(bitgo, basecoin, walletData);
  });

  /**
   * Helper function to create valid transaction parameters for token enablement
   * @returns Transaction parameters that should pass validation
   */
  const createValidTxParams = () => ({
    type: 'enabletoken' as const,
    recipients: [
      {
        address: testData.accounts.account1.address,
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
    txHex,
    key: 'test-key',
    blockHash: 'test-block-hash',
    nonce: BigInt(1), // Transaction nonce to prevent replay attacks
  });

  /**
   * TEST 1: Happy Path - Valid Token Enablement Transaction
   *
   * This test verifies that a properly formed token enablement transaction passes validation.
   * It uses a real storage deposit transaction hex from the test data.
   */
  it('should validate valid token enablement transaction', async function () {
    const txParams = createValidTxParams();

    // Create transaction prebuild using a real storage deposit transaction
    // This hex represents a NEAR transaction that creates storage space for a token
    const txPrebuild = createTxPrebuild(testData.rawTx.selfStorageDeposit.unsigned);

    const verifyOptions: VerifyTransactionOptions = {
      txParams, // What the user thinks they're signing
      txPrebuild, // The actual transaction hex from BitGo
      wallet: { id: 'test-wallet' } as any,
    };

    // This should NOT throw an error - the transaction should be valid
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
    const txPrebuild = createTxPrebuild(testData.rawTx.transfer.unsigned);

    const verifyOptions: VerifyTransactionOptions = {
      txParams, // User thinks they're enabling a token
      txPrebuild, // But the actual hex is for a money transfer!
      wallet: { id: 'test-wallet' } as any,
    };

    // This SHOULD throw an error because the hex doesn't match the expected transaction type
    await basecoin
      .verifyTransaction(verifyOptions)
      .should.be.rejectedWith('Invalid transaction type on token enablement: expected "42", got "0".');
  });

  /**
   * TEST 3: Security Test - Address Mismatch Detection
   *
   * This test verifies that the validation catches when the recipient address in the
   * transaction parameters doesn't match the actual address in the transaction hex.
   * This prevents attacks where someone changes the destination address.
   */
  it('should reject transaction with address mismatch', async function () {
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

    const txPrebuild = createTxPrebuild(testData.rawTx.selfStorageDeposit.unsigned);

    const verifyOptions: VerifyTransactionOptions = {
      txParams, // Contains wrong address
      txPrebuild, // Contains correct address in the hex
      wallet: { id: 'test-wallet' } as any,
    };

    // This SHOULD throw an error because the addresses don't match
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
    // token enablement transaction. The storage deposit amount validation catches this first
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
    const txParams = {
      type: 'enabletoken' as const,
      recipients: [
        {
          address: testData.accounts.account1.address,
          amount: '0',
          tokenName: 'tnear:tnep24dp',
        },
      ],
    };

    // Use the legitimate storage deposit transaction hex from wallet platform
    const txPrebuild = createTxPrebuild(testData.rawTx.selfStorageDeposit.unsigned);

    const verifyOptions: VerifyTransactionOptions = {
      txParams,
      txPrebuild,
      wallet: { id: 'wallet-platform-wallet' } as any,
    };

    // This should NOT throw an error - legitimate wallet platform transactions should pass validation
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

      sendTokenEnablement: async (params: any) => {
        // This is where verifyTransaction would be called during signing
        // The spoofed hex should cause verification to fail
        const verifyOptions: VerifyTransactionOptions = {
          txParams: params.txParams,
          txPrebuild: params.prebuildTx,
          wallet: mockWallet as any,
        };

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

    const enableTokensParams = {
      enableTokens: [
        {
          name: 'tnear:tnep24dp',
        },
      ],
    };

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

      sendAccountConsolidation: async (params: any) => {
        // This is where verifyTransaction would be called during signing
        // The spoofed hex should cause verification to fail
        const verifyOptions: VerifyTransactionOptions = {
          txParams: params.txParams,
          txPrebuild: params.prebuildTx,
          wallet: mockWallet as any,
        };

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

    const consolidationParams = {
      consolidateAddresses: [testData.accounts.account2.address],
    };

    const result = await mockWallet.sendAccountConsolidations(consolidationParams);

    // The result should contain failures due to the spoofed transaction hex
    result.success.should.have.length(0);
    result.failure.should.have.length(1);
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
   * 1. Wallet platform calls sendTokenEnablements
   * 2. A malicious actor intercepts the API response and returns a spoofed transaction hex
   * 3. sendTokenEnablements calls verifyTransaction during signing
   * 4. verifyTransaction detects the spoofed hex and throws an error
   */
  it('should fail when sendTokenEnablements receives spoofed transaction hex', async function () {
    // Create a spoofed transaction hex that will fail NEAR transaction parsing
    // This hex is completely invalid and will cause deserialization to fail
    const spoofedTxHex = 'deadbeefcafebabe1234567890abcdef'; // Invalid transaction data that will fail parsing

    const bgUrl = common.Environments['test'].uri;

    // Mock the key retrieval API call
    // Create an encrypted private key that can be decrypted with the test passphrase
    const encryptedPrv = bitgo.encrypt({
      input: testData.accounts.account1.secretKey,
      password: 'test',
    });

    nock(bgUrl).get('/api/v2/tnear/key/5b3424f91bf34993006eae94').reply(200, {
      encryptedPrv: encryptedPrv,
    });

    // Mock the prebuild API response to return spoofed txHex
    // This simulates a malicious actor intercepting the API response
    nock(bgUrl)
      .post('/api/v2/tnear/wallet/5b34252f1bf34993006eae96/tx/build')
      .reply(200, {
        txHex: spoofedTxHex,
        txid: '586c5b59b10b134d04c16ac1b273fe3c5529f34aef75db4456cd469c5cdac7e2',
        recipients: [
          {
            address: testData.accounts.account1.address,
            amount: '0',
            tokenName: 'tnear:tnep24dp',
          },
        ],
        coin: 'tnear',
        type: 'enabletoken',
        feeInfo: {
          size: 1000,
          fee: 1160407,
          feeRate: 1160407,
        },
      });

    // Call sendTokenEnablements which should detect the spoofed transaction and fail
    const result = await wallet.sendTokenEnablements({
      enableTokens: [
        {
          name: 'tnear:tnep24dp',
        },
      ],
      walletPassphrase: 'test', // Required for hot wallet signing
    });

    // The result should contain failures due to the spoofed transaction hex
    result.success.should.have.length(0);
    result.failure.should.have.length(1);
    result.failure[0].message.should.containEql('unable to build transaction from raw');
  });
});
