import 'should';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { IWallet } from '@bitgo/sdk-core';

import { register, XdcToken } from '../../src';
import { mockTokenTransferData } from '../resources';

describe('XDC Token:', function () {
  let bitgo: TestBitGoAPI;
  let xdcTokenCoin;
  const tokenName = 'xdc:usdc';

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'prod' });
    register(bitgo);
    bitgo.initializeTestVars();
    xdcTokenCoin = bitgo.coin(tokenName);
  });

  it('should return constants', function () {
    xdcTokenCoin.getChain().should.equal('xdc:usdc');
    xdcTokenCoin.getBaseChain().should.equal('xdc');
    xdcTokenCoin.getFullName().should.equal('XDC Token');
    xdcTokenCoin.getBaseFactor().should.equal(1e6);
    xdcTokenCoin.type.should.equal(tokenName);
    xdcTokenCoin.name.should.equal('USD Coin');
    xdcTokenCoin.coin.should.equal('xdc');
    xdcTokenCoin.network.should.equal('Mainnet');
    xdcTokenCoin.decimalPlaces.should.equal(6);
  });

  describe('Token Registration and TransactionBuilder', function () {
    const mainnetTokens = ['xdc:usdc', 'xdc:lbt', 'xdc:gama', 'xdc:srx', 'xdc:weth'];
    const testnetTokens = ['txdc:tmt'];

    describe('Mainnet tokens', function () {
      mainnetTokens.forEach((tokenName) => {
        it(`${tokenName} should be registered as XdcToken`, function () {
          const token = bitgo.coin(tokenName);
          token.should.be.instanceOf(XdcToken);
        });

        it(`${tokenName} should create TransactionBuilder without error`, function () {
          const token = bitgo.coin(tokenName) as XdcToken;
          // @ts-expect-error - accessing protected method for testing
          (() => token.getTransactionBuilder()).should.not.throw();
        });

        it(`${tokenName} should use XDC-specific TransactionBuilder`, function () {
          const token = bitgo.coin(tokenName) as XdcToken;
          // @ts-expect-error - accessing protected method for testing
          const builder = token.getTransactionBuilder();
          builder.should.have.property('_common');
          // Verify it's using XDC's getCommon, not EVM's
          // XDC's TransactionBuilder should create successfully without SHARED_EVM_SDK feature
          builder.constructor.name.should.equal('TransactionBuilder');
        });
      });
    });

    describe('Testnet tokens', function () {
      testnetTokens.forEach((tokenName) => {
        it(`${tokenName} should be registered as XdcToken`, function () {
          const token = bitgo.coin(tokenName);
          token.should.be.instanceOf(XdcToken);
        });

        it(`${tokenName} should create TransactionBuilder without error`, function () {
          const token = bitgo.coin(tokenName) as XdcToken;
          // @ts-expect-error - accessing protected method for testing
          (() => token.getTransactionBuilder()).should.not.throw();
        });

        it(`${tokenName} should use XDC-specific TransactionBuilder`, function () {
          const token = bitgo.coin(tokenName) as XdcToken;
          // @ts-expect-error - accessing protected method for testing
          const builder = token.getTransactionBuilder();
          builder.should.have.property('_common');
          builder.constructor.name.should.equal('TransactionBuilder');
        });

        it(`${tokenName} should have correct base chain`, function () {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const token: any = bitgo.coin(tokenName);
          token.getBaseChain().should.equal('txdc');
        });

        it(`${tokenName} should not throw "Cannot use common sdk module" error`, function () {
          const token = bitgo.coin(tokenName) as XdcToken;
          let errorThrown = false;
          let errorMessage = '';

          try {
            // @ts-expect-error - accessing protected method for testing
            const builder = token.getTransactionBuilder();
            // Try to use the builder to ensure it's fully functional
            // @ts-expect-error - type expects TransactionType enum
            builder.type('Send');
          } catch (e) {
            errorThrown = true;
            errorMessage = (e as Error).message;
          }

          errorThrown.should.equal(false);
          errorMessage.should.not.match(/Cannot use common sdk module/);
        });
      });
    });

    it('should verify all XDC tokens use XdcToken class, not EthLikeErc20Token', function () {
      const allTokens = [...mainnetTokens, ...testnetTokens];

      allTokens.forEach((tokenName) => {
        const token = bitgo.coin(tokenName);
        token.should.be.instanceOf(XdcToken);
        token.constructor.name.should.equal('XdcToken');
        token.constructor.name.should.not.equal('EthLikeErc20Token');
      });
    });
  });

  describe('verifyTssTransaction', function () {
    it('should return true for valid token transfer params', async function () {
      const token = bitgo.coin('txdc:tmt') as XdcToken;
      const mockWallet = {} as unknown as IWallet;

      const result = await token.verifyTssTransaction({
        txParams: {
          recipients: [
            {
              address: mockTokenTransferData.recipientAddress,
              amount: mockTokenTransferData.tokenAmount,
            },
          ],
        },
        txPrebuild: mockTokenTransferData.txPrebuild as unknown as Parameters<
          typeof token.verifyTssTransaction
        >[0]['txPrebuild'],
        wallet: mockWallet,
      });

      result.should.equal(true);
    });

    it('should return true for transferToken type without recipients', async function () {
      const token = bitgo.coin('txdc:tmt') as XdcToken;
      const mockWallet = {} as unknown as IWallet;

      const result = await token.verifyTssTransaction({
        txParams: {
          type: 'transferToken',
        },
        txPrebuild: mockTokenTransferData.txPrebuild as unknown as Parameters<
          typeof token.verifyTssTransaction
        >[0]['txPrebuild'],
        wallet: mockWallet,
      });

      result.should.equal(true);
    });

    it('should throw error when txParams.recipients is missing and no valid type', async function () {
      const token = bitgo.coin('txdc:tmt') as XdcToken;
      const mockWallet = {} as unknown as IWallet;

      await token
        .verifyTssTransaction({
          txParams: {},
          txPrebuild: mockTokenTransferData.txPrebuild as unknown as Parameters<
            typeof token.verifyTssTransaction
          >[0]['txPrebuild'],
          wallet: mockWallet,
        })
        .should.be.rejectedWith('missing txParams');
    });

    it('should throw error when wallet is missing', async function () {
      const token = bitgo.coin('txdc:tmt') as XdcToken;

      await token
        .verifyTssTransaction({
          txParams: {
            recipients: [
              {
                address: mockTokenTransferData.recipientAddress,
                amount: mockTokenTransferData.tokenAmount,
              },
            ],
          },
          txPrebuild: mockTokenTransferData.txPrebuild as unknown as Parameters<
            typeof token.verifyTssTransaction
          >[0]['txPrebuild'],
          wallet: undefined as unknown as IWallet,
        })
        .should.be.rejectedWith('missing params');
    });

    it('should throw error when txPrebuild is missing', async function () {
      const token = bitgo.coin('txdc:tmt') as XdcToken;
      const mockWallet = {} as unknown as IWallet;

      await token
        .verifyTssTransaction({
          txParams: {
            recipients: [
              {
                address: mockTokenTransferData.recipientAddress,
                amount: mockTokenTransferData.tokenAmount,
              },
            ],
          },
          txPrebuild: undefined as unknown as Parameters<typeof token.verifyTssTransaction>[0]['txPrebuild'],
          wallet: mockWallet,
        })
        .should.be.rejectedWith('missing params');
    });

    it('should throw error for batch + hop transaction', async function () {
      const token = bitgo.coin('txdc:tmt') as XdcToken;
      const mockWallet = {} as unknown as IWallet;

      await token
        .verifyTssTransaction({
          txParams: {
            hop: true,
            recipients: [
              { address: '0x1111111111111111111111111111111111111111', amount: '1000' },
              { address: '0x2222222222222222222222222222222222222222', amount: '2000' },
            ],
          },
          txPrebuild: mockTokenTransferData.txPrebuild as unknown as Parameters<
            typeof token.verifyTssTransaction
          >[0]['txPrebuild'],
          wallet: mockWallet,
        })
        .should.be.rejectedWith('tx cannot be both a batch and hop transaction');
    });

    it('should not throw EIP155 error when verifying token transaction', async function () {
      // This test ensures that verifyTssTransaction does NOT parse the txHex
      // which would fail with "Incompatible EIP155-based V" error
      const token = bitgo.coin('txdc:tmt') as XdcToken;
      const mockWallet = {} as unknown as IWallet;

      // Use the signableHex (with v=51) which would fail if parsed
      const txPrebuildWithSignableHex = {
        ...mockTokenTransferData.txPrebuild,
        txHex: mockTokenTransferData.signableHex,
      };

      // This should NOT throw EIP155 error because verifyTssTransaction
      // does not parse the transaction
      const result = await token.verifyTssTransaction({
        txParams: {
          recipients: [
            {
              address: mockTokenTransferData.recipientAddress,
              amount: mockTokenTransferData.tokenAmount,
            },
          ],
        },
        txPrebuild: txPrebuildWithSignableHex as unknown as Parameters<
          typeof token.verifyTssTransaction
        >[0]['txPrebuild'],
        wallet: mockWallet,
      });

      result.should.equal(true);
    });
  });
});
