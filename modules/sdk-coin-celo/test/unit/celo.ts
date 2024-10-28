import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Celo, Tcelo } from '../../src';
import { Wallet } from '@bitgo/sdk-core';

describe('Celo Gold', function () {
  let bitgo: TestBitGoAPI;
  let basecoin;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('tcelo', Tcelo.createInstance);
    bitgo.safeRegister('celo', Celo.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('celo');
  });

  it('should instantiate the coin', function () {
    let localBasecoin = bitgo.coin('tcelo');
    localBasecoin.should.be.an.instanceof(Tcelo);

    localBasecoin = bitgo.coin('celo');
    localBasecoin.should.be.an.instanceof(Celo);
  });

  describe('Verify Transaction', function () {
    const address1 = '5Ge59qRnZa8bxyhVFE6BDoY3kuhSrNVETRxXYLty1Hh6XTaf';
    const address2 = '5DiMLZugmcKEH3igPZP367FqummZkWeW5Z6zDCHLfxRjnPXe';
    it('should reject a txPrebuild with more than one recipient', async function () {
      const wallet = new Wallet(bitgo, basecoin, {});

      const txParams = {
        recipients: [
          { amount: '1000000000000', address: address1 },
          { amount: '2500000000000', address: address2 },
        ],
        wallet: wallet,
        walletPassphrase: 'fakeWalletPassphrase',
      };

      await basecoin
        .verifyTransaction({ txParams })
        .should.be.rejectedWith('txParams should only have 1 recipient but 2 found');
    });
  });
});
