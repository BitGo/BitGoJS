import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { Tbera, Bera } from '../../src';

describe('Bera', function () {
  let bitgo: TestBitGoAPI;
  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('bera', Bera.createInstance);
    bitgo.safeRegister('tbera', Tbera.createInstance);
    bitgo.initializeTestVars();
  });

  it('should return the right info', function () {
    const bera = bitgo.coin('bera');
    const tbera = bitgo.coin('tbera');

    bera.getChain().should.equal('bera');
    bera.getFamily().should.equal('bera');
    bera.getFullName().should.equal('Bera');
    bera.getBaseFactor().should.equal(1e18);

    tbera.getChain().should.equal('tbera');
    tbera.getFamily().should.equal('bera');
    tbera.getFullName().should.equal('Testnet Bera');
    tbera.getBaseFactor().should.equal(1e18);
  });
});
