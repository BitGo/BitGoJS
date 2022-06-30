import 'should';

import { TestBitGoAPI, TestBitGo } from '@bitgo/sdk-test';

import { Tbtc } from '../../src';
import { BitGoAPI } from '@bitgo/sdk-api';

describe('BTC:', function () {
  let bitgo: TestBitGoAPI;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.safeRegister('tbtc', Tbtc.createInstance);
    bitgo.initializeTestVars();
  });

  describe('Address validation:', () => {
    let coin: Tbtc;
    before(() => {
      coin = bitgo.coin('tbtc') as Tbtc;
    });

    it('should validate a base58 address', () => {
      const validBase58Address = '2Mv1fGp8gHSqsiXYG7WqcYmHZdurDGVtUbn';
      coin.isValidAddress(validBase58Address).should.be.true();
    });

    it('should validate a bech32 address', () => {
      const validBech32Address = 'tb1qtxxqmkkdx4n4lcp0nt2cct89uh3h3dlcu940kw9fcqyyq36peh0st94hfp';
      coin.isValidAddress(validBech32Address).should.be.true();
    });

    it('should validate a bech32m address', () => {
      // https://github.com/bitcoin/bips/blob/master/bip-0350.mediawiki#Test_vectors_for_Bech32m
      const validBech32mAddress = 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7';
      coin.isValidAddress(validBech32mAddress).should.be.true();
    });
  });
});
