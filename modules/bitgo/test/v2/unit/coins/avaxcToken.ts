import 'should';

import { TestBitGo } from '../../../lib/test_bitgo';
import { Wallet } from '../../../../src';

describe('Avaxc Token:', function () {
  let bitgo;
  let avaxcTokenCoin;

  const address1 = '0x174cfd823af8ce27ed0afee3fcf3c3ba259116be';

  describe('In env test:', function () {
    const tokenName = 'tavaxc:link';

    before(function () {
      bitgo = new TestBitGo({ env: 'test' });
      bitgo.initializeTestVars();
      avaxcTokenCoin = bitgo.coin(tokenName);
    });

    it('should return constants', function () {
      avaxcTokenCoin.getChain().should.equal('tavaxc:link');
      avaxcTokenCoin.getBaseChain().should.equal('tavaxc');
      avaxcTokenCoin.getFullName().should.equal('Avaxc Token');
      avaxcTokenCoin.getBaseFactor().should.equal(1e18);
      avaxcTokenCoin.type.should.equal(tokenName);
      avaxcTokenCoin.name.should.equal('Test Chainlink');
      avaxcTokenCoin.coin.should.equal('tavaxc');
      avaxcTokenCoin.network.should.equal('Testnet');
      avaxcTokenCoin.decimalPlaces.should.equal(18);
    });

    it('should return same token by contract address', function () {
      const tokencoinBycontractAddress = bitgo.coin(avaxcTokenCoin.tokenContractAddress);
      avaxcTokenCoin.should.deepEqual(tokencoinBycontractAddress);
    });

    it('should reject a txPrebuild from the bitgo server with the wrong coin', async function () {
      const wallet = new Wallet(bitgo, avaxcTokenCoin, {});

      const txParams = {
        recipients: [{ amount: '1000000000000', address: address1 }],
        wallet: wallet,
        walletPassphrase: 'fakeWalletPassphrase',
      };

      const txPrebuild = {
        recipients: [{ amount: '1000000000000', address: address1 }],
        nextContractSequenceId: 0,
        gasPrice: 20000000000,
        gasLimit: 500000,
        isBatch: false,
        coin: 'btc',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
        token: 'avaxc:link',
      };

      const verification = {};

      await avaxcTokenCoin.verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith('coin in txPrebuild did not match that in txParams supplied by client');
    });

    it('must return true when sending correct txPrebuild parameters', async function () {
      const wallet = new Wallet(bitgo, avaxcTokenCoin, {});

      const txParams = {
        recipients: [{ amount: '1000000000000', address: address1 }],
        wallet: wallet,
        walletPassphrase: 'fakeWalletPassphrase',
      };

      const txPrebuild = {
        recipients: [{ amount: '1000000000000', address: address1 }],
        nextContractSequenceId: 0,
        gasPrice: 20000000000,
        gasLimit: 500000,
        isBatch: false,
        coin: 'avaxc',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
        token: 'avaxc:link',
      };

      const verification = {};

      await avaxcTokenCoin.verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.true;
    });
  });

  describe('In env prod:', function () {
    const tokenName = 'avaxc:png';
    before(function () {
      bitgo = new TestBitGo({ env: 'prod' });
      bitgo.initializeTestVars();
      avaxcTokenCoin = bitgo.coin(tokenName);
    });

    it('should return constants', function () {
      avaxcTokenCoin.getChain().should.equal('avaxc:png');
      avaxcTokenCoin.getBaseChain().should.equal('avaxc');
      avaxcTokenCoin.getFullName().should.equal('Avaxc Token');
      avaxcTokenCoin.getBaseFactor().should.equal(1e18);
      avaxcTokenCoin.type.should.equal(tokenName);
      avaxcTokenCoin.name.should.equal('Pangolin');
      avaxcTokenCoin.coin.should.equal('avaxc');
      avaxcTokenCoin.network.should.equal('Mainnet');
      avaxcTokenCoin.decimalPlaces.should.equal(18);
    });

    it('should return same token by contract address', function () {
      const tokencoinBycontractAddress = bitgo.coin(avaxcTokenCoin.tokenContractAddress);
      avaxcTokenCoin.should.deepEqual(tokencoinBycontractAddress);
    });

    it('should return mainnet token, however it uses a testnet contract address', function () {
      const tokencoinBycontractAddress = bitgo.coin(bitgo.coin('t' + tokenName).tokenContractAddress);
      avaxcTokenCoin.should.deepEqual(tokencoinBycontractAddress);
    });

    it('should successfully verify coin', function() {
      const txPrebuild = { coin: 'avaxc', token: 'avaxc:png' };
      avaxcTokenCoin.verifyCoin(txPrebuild).should.equal(true);
    });

    it('should fail verify coin', function() {
      const txPrebuild = { coin: 'eth', token: 'eth:png' };
      avaxcTokenCoin.verifyCoin(txPrebuild).should.equal(false);
    });
  });
});
