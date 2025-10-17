import 'should';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { VerifyTransactionOptions, common, Wallet, TransactionType } from '@bitgo/sdk-core';
import { TransactionPrebuild, Near } from '../../src/near';
import { TNear as TNearCoin } from '../../src/tnear';
import * as testData from '../resources/near';
import nock from 'nock';

describe('NEAR Token Enablement Validation', function () {
  let bitgo: TestBitGoAPI;
  let basecoin: Near;
  let wallet: Wallet;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.initializeTestVars();
    bitgo.safeRegister('tnear', TNearCoin.createInstance);
    basecoin = bitgo.coin('tnear') as Near;

    const walletData = {
      id: '5b34252f1bf34993006eae96',
      coin: 'tnear',
      type: 'hot',
      keys: ['5b3424f91bf34993006eae94', '5b3424f91bf34993006eae95', '5b3424f91bf34993006eae96'],
      coinSpecific: {
        baseAddress: testData.accounts.account1.address,
      },
    };
    wallet = new Wallet(bitgo, basecoin, walletData);
  });

  const createValidTxParams = () => ({
    type: 'enabletoken' as const,
    recipients: [
      {
        address: testData.accounts.account1.address,
        amount: '0',
        tokenName: 'tnear:tnep24dp',
      },
    ],
  });

  const createTxPrebuild = (txHex: string): TransactionPrebuild => ({
    txHex,
    key: 'test-key',
    blockHash: 'test-block-hash',
    nonce: BigInt(1),
  });

  it('should validate valid token enablement transaction', async function () {
    const txParams = createValidTxParams();
    const txPrebuild = createTxPrebuild(testData.rawTx.selfStorageDeposit.unsigned);

    const verifyOptions: VerifyTransactionOptions = {
      txParams,
      txPrebuild,
      wallet: { id: 'test-wallet' } as any,
    };

    await basecoin.verifyTransaction(verifyOptions);
  });

  it('should reject transaction with mismatched hex', async function () {
    const txParams = {
      type: 'enabletoken' as const,
      recipients: [
        {
          address: testData.accounts.account2.address,
          amount: '0',
          tokenName: 'tnear:tnep24dp',
        },
      ],
    };

    const txPrebuild = createTxPrebuild(testData.rawTx.transfer.unsigned);

    const verifyOptions: VerifyTransactionOptions = {
      txParams,
      txPrebuild,
      wallet: { id: 'test-wallet' } as any,
      verification: { verifyTokenEnablement: true },
    };

    await basecoin
      .verifyTransaction(verifyOptions)
      .should.be.rejectedWith('Invalid transaction type on token enablement: expected "42", got "0".');
  });

  it('should reject transaction with address mismatch', async function () {
    const txParams = {
      type: 'enabletoken' as const,
      recipients: [
        {
          address: 'wrong.address.near',
          amount: '0',
          tokenName: 'tnear:tnep24dp',
        },
      ],
    };

    const txPrebuild = createTxPrebuild(testData.rawTx.selfStorageDeposit.unsigned);

    const verifyOptions: VerifyTransactionOptions = {
      txParams,
      txPrebuild,
      wallet: { id: 'test-wallet' } as any,
      verification: { verifyTokenEnablement: true },
    };

    await basecoin
      .verifyTransaction(verifyOptions)
      .should.be.rejectedWith('Error on token enablements: transaction beneficiary mismatch with user expectation');
  });

  it('should reject transaction with multiple recipients', async function () {
    const txParams = {
      type: 'enabletoken' as const,
      recipients: [
        {
          address: testData.accounts.account1.address,
          amount: '0',
          tokenName: 'tnear:tnep24dp',
        },
        {
          address: testData.accounts.account2.address,
          amount: '0',
          tokenName: 'tnear:tnep24dp',
        },
      ],
    };

    const txPrebuild = createTxPrebuild(testData.rawTx.selfStorageDeposit.unsigned);

    const verifyOptions: VerifyTransactionOptions = {
      txParams,
      txPrebuild,
      wallet: { id: 'test-wallet' } as any,
      verification: { verifyTokenEnablement: true },
    };

    await basecoin
      .verifyTransaction(verifyOptions)
      .should.be.rejectedWith('Error on token enablements: token enablement only supports a single recipient');
  });

  it('should reject spoofed TxHex in token enablement transaction', async function () {
    const txParams = createValidTxParams();
    const spoofedTxHex = testData.rawTx.fungibleTokenTransfer.unsigned;
    const txPrebuild = createTxPrebuild(spoofedTxHex);

    const verifyOptions: VerifyTransactionOptions = {
      txParams,
      txPrebuild,
      wallet: { id: 'test-wallet' } as any,
      verification: { verifyTokenEnablement: true },
    };

    await basecoin
      .verifyTransaction(verifyOptions)
      .should.be.rejectedWith(
        `Invalid transaction type on token enablement: expected "${TransactionType.StorageDeposit}", got "${TransactionType.Send}".`
      );
  });

  it('should validate token enablement transaction from wallet platform', async function () {
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

    const txPrebuild = createTxPrebuild(testData.rawTx.selfStorageDeposit.unsigned);

    const verifyOptions: VerifyTransactionOptions = {
      txParams,
      txPrebuild,
      wallet: { id: 'wallet-platform-wallet' } as any,
    };

    await basecoin.verifyTransaction(verifyOptions);
  });

  it('should throw error when sendTokenEnablements receives spoofed TxHex', async function () {
    const mockWallet = {
      id: () => 'test-wallet',
      bitgo: bitgo,
      baseCoin: basecoin,

      buildTokenEnablements: async (params: any) => {
        return [
          {
            txHex: testData.rawTx.fungibleTokenTransfer.unsigned,
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
        const verifyOptions: VerifyTransactionOptions = {
          txParams: params.txParams,
          txPrebuild: params.prebuildTx,
          wallet: mockWallet as any,
          verification: { verifyTokenEnablement: true },
        };

        await basecoin.verifyTransaction(verifyOptions);
        return { success: true };
      },

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

    result.success.should.have.length(0);
    result.failure.should.have.length(1);
    result.failure[0].message.should.containEql(
      `Invalid transaction type on token enablement: expected "${TransactionType.StorageDeposit}", got "${TransactionType.Send}".`
    );
  });

  it('should throw error when sendAccountConsolidations receives spoofed TxHex', async function () {
    const mockWallet = {
      id: () => 'test-wallet',
      bitgo: bitgo,
      baseCoin: basecoin,

      buildAccountConsolidations: async (params: any) => {
        return [
          {
            txHex: testData.rawTx.fungibleTokenTransfer.unsigned,
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
        const verifyOptions: VerifyTransactionOptions = {
          txParams: params.txParams,
          txPrebuild: params.prebuildTx,
          wallet: mockWallet as any,
        };

        await basecoin.verifyTransaction(verifyOptions);
        return { success: true };
      },

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

    result.success.should.have.length(0);
    result.failure.should.have.length(1);
    result.failure[0].message.should.containEql('Tx outputs does not match with expected txParams recipients');
  });

  // Following XLM pattern: directly call sendTokenEnablement with spoofed prebuild
  it('should throw an error on spoofed send token enablement call', async function () {
    const wrongAccountTxHex = testData.rawTx.storageDeposit.unsigned;
    const bgUrl = common.Environments['test'].uri;

    nock(bgUrl).get('/api/v2/tnear/key/5b3424f91bf34993006eae94').reply(200, {});

    await wallet
      .sendTokenEnablement({
        prebuildTx: {
          txHex: wrongAccountTxHex,
          key: 'test-key',
          blockHash: 'test-block-hash',
          nonce: BigInt(1),
          buildParams: {
            type: 'enabletoken',
            recipients: [
              {
                address: testData.accounts.account1.address,
                amount: '0',
                tokenName: 'tnear:tnep24dp',
              },
            ],
            wallet: wallet,
          },
        },
        walletPassphrase: 'test',
      })
      .should.be.rejectedWith('Error on token enablements: transaction beneficiary mismatch with user expectation');
  });

  // Test spoofed transaction from API response - uses valid transaction for wrong account
  it('should fail when sendTokenEnablements receives spoofed transaction hex', async function () {
    const spoofedTxHex = testData.rawTx.storageDeposit.unsigned;
    const bgUrl = common.Environments['test'].uri;

    const encryptedPrv = bitgo.encrypt({
      input: testData.accounts.account1.secretKey,
      password: 'test',
    });

    nock(bgUrl).get('/api/v2/tnear/key/5b3424f91bf34993006eae94').reply(200, {
      encryptedPrv: encryptedPrv,
    });

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

    const result = await wallet.sendTokenEnablements({
      enableTokens: [
        {
          name: 'tnear:tnep24dp',
        },
      ],
      walletPassphrase: 'test',
    });

    result.success.should.have.length(0);
    result.failure.should.have.length(1);
    result.failure[0].message.should.containEql('transaction beneficiary mismatch with user expectation');
  });
});
