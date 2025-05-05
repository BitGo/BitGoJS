import 'should';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Cronos, Tcronos } from '../../src/index';

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });
bitgo.safeRegister('tcronos', Tcronos.createInstance);

describe('Cronos', function () {
  let bitgo: TestBitGoAPI;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('cronos', Cronos.createInstance);
    bitgo.safeRegister('tcronos', Tcronos.createInstance);
    bitgo.initializeTestVars();
  });

  it('should return the right info', function () {
    const cronos = bitgo.coin('cronos');
    const tcronos = bitgo.coin('tcronos');

    cronos.getChain().should.equal('cronos');
    cronos.getFamily().should.equal('cronos');
    cronos.getFullName().should.equal('Cronos');
    cronos.getBaseFactor().should.equal(1e8);

    tcronos.getChain().should.equal('tcronos');
    tcronos.getFamily().should.equal('cronos');
    tcronos.getFullName().should.equal('Testnet Cronos');
    tcronos.getBaseFactor().should.equal(1e8);
  });
});
