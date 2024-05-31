import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { Bcha, Tbcha } from '../../src';

describe('Bcha', function () {
  const coinName = 'tbcha';
  let bitgo: TestBitGoAPI;
  let basecoin;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, {
      env: 'mock',
    });
    bitgo.initializeTestVars();
    bitgo.safeRegister('bcha', Bcha.createInstance);
    bitgo.safeRegister('tbcha', Tbcha.createInstance);
    basecoin = bitgo.coin(coinName);
  });

  it('should instantiate the coin', function () {
    let localBasecoin = bitgo.coin('tbcha');
    localBasecoin.should.be.an.instanceof(Tbcha);

    localBasecoin = bitgo.coin('bcha');
    localBasecoin.should.be.an.instanceof(Bcha);
  });

  it('should return tbcha', function () {
    basecoin.getChain().should.equal('tbcha');
  });

  it('should return full name', function () {
    basecoin.getFullName().should.equal('Testnet Bitcoin ABC');
  });

  it('should convert addresses', function () {
    const mainnetBasecoin = bitgo.coin('bcha');

    mainnetBasecoin
      .canonicalAddress('38oymyUayu35QoLLKmc8CozbcHynH6Btkn', 'cashaddr')
      .should.equal('ecash:pp8pnl7k6y8g073cggczfh22xrprxut5hymhjkq3er');
    mainnetBasecoin
      .canonicalAddress('ecash:pp8pnl7k6y8g073cggczfh22xrprxut5hymhjkq3er')
      .should.equal('38oymyUayu35QoLLKmc8CozbcHynH6Btkn');
    basecoin
      .canonicalAddress('mzopZJiBCjeAHXkShhgxfRsALgrYt3kxNP', 'cashaddr')
      .should.equal('ectest:qrfekq9s0c8tcuh75wpcxqnyl5e7dhqk4gq6pjct44');
    basecoin
      .canonicalAddress('ectest:qrfekq9s0c8tcuh75wpcxqnyl5e7dhqk4gq6pjct44')
      .should.equal('mzopZJiBCjeAHXkShhgxfRsALgrYt3kxNP');
  });
});
