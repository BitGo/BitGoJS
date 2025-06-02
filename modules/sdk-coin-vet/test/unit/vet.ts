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

  it('should validate address', function () {
    const vet = bitgo.coin('vet');
    vet.isValidAddress('wrongaddress').should.false();
    vet.isValidAddress('25bcb8855effa9f12a23c2f7f34f2d92b5841f19').should.false();
    vet.isValidAddress('0x7Ca00e3bC8a836026C2917C6c7c6D049E52099dd').should.true();
    vet.isValidAddress('0x690fFcefa92876C772E85d4B5963807C2152e08d').should.true();
    vet.isValidAddress('0xe59F1cea4e0FEf511e3d0f4EEc44ADf19C4cbeEC').should.true();
  });
});
