import 'should';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Zec, Tzec } from '../../src';

describe('Zec', function () {
  const coinName = 'tzec';
  let bitgo: BitGoAPI;
  let basecoin;

  before(function () {
    bitgo = new BitGoAPI({ env: 'mock' });
    bitgo.register('zec', Zec.createInstance);
    bitgo.register('tzec', Tzec.createInstance);
    basecoin = bitgo.coin(coinName);
  });

  it('should instantiate the coin', function () {
    let localBasecoin = bitgo.coin('tzec');
    localBasecoin.should.be.an.instanceof(Tzec);

    localBasecoin = bitgo.coin('zec');
    localBasecoin.should.be.an.instanceof(Zec);
  });

  it('should return tzec', function () {
    basecoin.getChain().should.equal('tzec');
  });

  it('should return full name', function () {
    basecoin.getFullName().should.equal('Testnet ZCash');
  });
});
