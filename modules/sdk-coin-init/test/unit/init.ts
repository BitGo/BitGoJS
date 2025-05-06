import 'should';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Init, Tinit } from '../../src/index';

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });
bitgo.safeRegister('tinit', Tinit.createInstance);

describe('Init', function () {
  let bitgo: TestBitGoAPI;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('init', Init.createInstance);
    bitgo.safeRegister('tinit', Tinit.createInstance);
    bitgo.initializeTestVars();
  });

  it('should return the right info', function () {
    const init = bitgo.coin('init');
    const tinit = bitgo.coin('tinit');

    init.getChain().should.equal('init');
    init.getFamily().should.equal('init');
    init.getFullName().should.equal('Initia');
    init.getBaseFactor().should.equal(1e6);

    tinit.getChain().should.equal('tinit');
    tinit.getFamily().should.equal('init');
    tinit.getFullName().should.equal('Testnet Initia');
    tinit.getBaseFactor().should.equal(1e6);
  });
});
