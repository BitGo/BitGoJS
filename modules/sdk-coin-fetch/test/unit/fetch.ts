import 'should';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Fetch, Tfetch } from '../../src/index';

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });
bitgo.safeRegister('tfetch', Tfetch.createInstance);

describe('Fetch', function () {
  let bitgo: TestBitGoAPI;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('fetch', Fetch.createInstance);
    bitgo.safeRegister('tfetch', Tfetch.createInstance);
    bitgo.initializeTestVars();
  });

  it('should return the right info', function () {
    const fetch = bitgo.coin('fetch');
    const tfetch = bitgo.coin('tfetch');

    fetch.getChain().should.equal('fetch');
    fetch.getFamily().should.equal('fetch');
    fetch.getFullName().should.equal('Fetch');
    fetch.getBaseFactor().should.equal(1e18);

    tfetch.getChain().should.equal('tfetch');
    tfetch.getFamily().should.equal('fetch');
    tfetch.getFullName().should.equal('Testnet Fetch');
    tfetch.getBaseFactor().should.equal(1e18);
  });
});
