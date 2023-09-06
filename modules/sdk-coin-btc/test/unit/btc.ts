import 'should';

import { TestBitGoAPI, TestBitGo } from '@bitgo/sdk-test';

import { Tbtc } from '../../src';
import { BitGoAPI } from '@bitgo/sdk-api';
import * as utxolib from '@bitgo/utxo-lib';

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
      const invalidBase58Address = '2MV1FGP8GHSQSSXYG7WQCYMHZDURDGVTUBN';
      coin.isValidAddress(invalidBase58Address).should.be.false();
    });

    it('should validate a bech32 address', () => {
      const validBech32Address = 'tb1qtxxqmkkdx4n4lcp0nt2cct89uh3h3dlcu940kw9fcqyyq36peh0st94hfp';
      coin.isValidAddress(validBech32Address).should.be.true();
      coin.isValidAddress(validBech32Address.toUpperCase()).should.be.false();
    });

    it('should validate a bech32m address', () => {
      // https://github.com/bitcoin/bips/blob/master/bip-0350.mediawiki#Test_vectors_for_Bech32m
      const validBech32mAddress = 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7';
      coin.isValidAddress(validBech32mAddress).should.be.true();
      coin.isValidAddress(validBech32mAddress.toUpperCase()).should.be.false();
    });
  });

  describe('Post Build Validation', () => {
    let coin: Tbtc;
    before(() => {
      coin = bitgo.coin('tbtc') as Tbtc;
    });

    it('should not modify locktime on postProcessPrebuild', async () => {
      const txHex =
        '0100000001a8ec78f09f7acb0d344622ed3082c1a98e51ba1b1ab65406044f6e0a801609020100000000ffffffff02a0860100000000001976a9149f9a7abd600c0caa03983a77c8c3df8e062cb2fa88acfbf2150000000000220020b922cc1e737e679d24ff2d2b18cfa9fff4e35a733b4fba94282eaa1b7cfe56d200000000';
      const blockHeight = 100;
      const preBuild = { txHex, blockHeight };
      const postProcessBuilt = await coin.postProcessPrebuild(preBuild);
      const transaction = utxolib.bitgo.createTransactionFromHex(
        postProcessBuilt.txHex as string,
        utxolib.networks.bitcoin
      );

      transaction.locktime.should.equal(0);
      const inputs = transaction.ins;
      for (const input of inputs) {
        input.sequence.should.equal(0xffffffff);
      }
    });
  });
});
