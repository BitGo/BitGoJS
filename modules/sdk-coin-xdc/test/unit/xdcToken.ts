import 'should';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TransactionType, Wallet } from '@bitgo/sdk-core';

import { register, XdcToken } from '../../src';
import { TransactionBuilder } from '../../src/lib';
import { getBuilder } from './getBuilder';

/** Encode ERC-20 transfer(address,uint256) calldata without ethereumjs-abi. */
function encodeErc20Transfer(to: string, amount: string): string {
  const address = to.toLowerCase().replace(/^0x/, '').padStart(64, '0');
  const value = BigInt(amount).toString(16).padStart(64, '0');
  return `0xa9059cbb${address}${value}`;
}

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
    const recipientAddress = '0x174cfd823af8ce27ed0afee3fcf3c3ba259116be';
    const wrongAddress = '0x7e85bdc27c050e3905ebf4b8e634d9ad6edd0de6';
    const tokenContractAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

    it('should accept an ERC-20 transfer where calldata matches declared recipient', async function () {
      const token = bitgo.coin('txdc:tmt') as XdcToken;

      const erc20TransferData = encodeErc20Transfer(recipientAddress, '10000000');

      const txBuilder = getBuilder('txdc') as TransactionBuilder;
      txBuilder.type(TransactionType.ContractCall);
      txBuilder.fee({ fee: '10', gasLimit: '60000' });
      txBuilder.counter(1);
      txBuilder.contract(tokenContractAddress);
      txBuilder.data(erc20TransferData);
      const tx = await txBuilder.build();
      const txHex = tx.toBroadcastFormat();

      const wallet = new Wallet(bitgo, token, { coinSpecific: { baseAddress: recipientAddress } });

      const result = await token.verifyTssTransaction({
        txParams: {
          type: 'transfer',
          recipients: [{ address: recipientAddress, amount: '10000000' }],
        } as any,
        txPrebuild: { txHex, coin: 'txdc:tmt', walletId: 'fakeWalletId' } as any,
        wallet,
      });
      result.should.equal(true);
    });

    it('should reject an ERC-20 transfer when calldata recipient does not match declared recipient', async function () {
      const token = bitgo.coin('txdc:tmt') as XdcToken;

      const erc20TransferData = encodeErc20Transfer(wrongAddress, '10000000');

      const txBuilder = getBuilder('txdc') as TransactionBuilder;
      txBuilder.type(TransactionType.ContractCall);
      txBuilder.fee({ fee: '10', gasLimit: '60000' });
      txBuilder.counter(1);
      txBuilder.contract(tokenContractAddress);
      txBuilder.data(erc20TransferData);
      const tx = await txBuilder.build();
      const txHex = tx.toBroadcastFormat();

      const wallet = new Wallet(bitgo, token, { coinSpecific: { baseAddress: recipientAddress } });

      await token
        .verifyTssTransaction({
          txParams: {
            type: 'transfer',
            recipients: [{ address: recipientAddress, amount: '10000000' }],
          } as any,
          txPrebuild: { txHex, coin: 'txdc:tmt', walletId: 'fakeWalletId' } as any,
          wallet,
        })
        .should.be.rejectedWith('destination address does not match with the recipient address');
    });

    it('should throw error when txParams.recipients is missing and no valid type', async function () {
      const token = bitgo.coin('txdc:tmt') as XdcToken;
      const wallet = new Wallet(bitgo, token, { coinSpecific: { baseAddress: recipientAddress } });

      await token
        .verifyTssTransaction({
          txParams: {},
          txPrebuild: { txHex: '0x00', coin: 'txdc:tmt', walletId: 'fakeWalletId' } as any,
          wallet,
        })
        .should.be.rejectedWith('missing txParams');
    });

    it('should throw error when wallet is missing', async function () {
      const token = bitgo.coin('txdc:tmt') as XdcToken;

      await token
        .verifyTssTransaction({
          txParams: {
            type: 'transfer',
            recipients: [{ address: recipientAddress, amount: '10000000' }],
          } as any,
          txPrebuild: { txHex: '0x00', coin: 'txdc:tmt', walletId: 'fakeWalletId' } as any,
          wallet: undefined as unknown as Wallet,
        })
        .should.be.rejectedWith('missing params');
    });
  });
});
