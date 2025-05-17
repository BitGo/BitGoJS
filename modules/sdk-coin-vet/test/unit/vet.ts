import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { Vet, Tvet } from '../../src';

describe('Vechain', function () {
  let bitgo: TestBitGoAPI;
  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('vet', Vet.createInstance);
    bitgo.safeRegister('tvet', Tvet.createInstance);
    bitgo.initializeTestVars();
  });

  it('should return the right info', function () {
    const vet = bitgo.coin('vet');
    const tvet = bitgo.coin('tvet');

    vet.getChain().should.equal('vet');
    vet.getFamily().should.equal('vet');
    vet.getFullName().should.equal('VeChain');
    vet.getBaseFactor().should.equal(1e18);

    tvet.getChain().should.equal('tvet');
    tvet.getFamily().should.equal('vet');
    tvet.getFullName().should.equal('Testnet VeChain');
    tvet.getBaseFactor().should.equal(1e18);
  });
});
