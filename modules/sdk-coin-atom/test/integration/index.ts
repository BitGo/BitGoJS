import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Atom, Tatom } from '../../src/index';

describe('ATOM', function () {
  let bitgo: TestBitGoAPI;
  // let basecoin;
  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('atom', Atom.createInstance);
    bitgo.safeRegister('tatom', Tatom.createInstance);
    bitgo.initializeTestVars();
    // basecoin = bitgo.coin('tatom');
  });
});

/*
    nock.disableNetConnect();

    const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.safeRegister('tatom', Tatom.createInstance);

    before(function () {
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tatom');
  });

  after(function () {
    nock.pendingMocks().should.be.empty();
  });

  it('should instantiate the coin', function () {
    const basecoin = bitgo.coin('tatom');
    basecoin.should.be.an.instanceof(Tatom);
  });

  it('isValidAddress should be correct', function () {
    // Add valid addresses for testing
    basecoin.isValidAddress('').should.be.True();
    basecoin.isValidAddress('').should.be.True();
    basecoin.isValidAddress('').should.be.True();
  });

  it('verifyAddress should work', function () {

  }

  it('Should be able to explain an Cosmos transaction', async function () {

  });
});
*/
