import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Sui, Tsui } from '../../src';

describe('SUI:', function () {
  let bitgo: TestBitGoAPI;
  // let basecoin;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('sui', Sui.createInstance);
    bitgo.safeRegister('tsui', Tsui.createInstance);
    bitgo.initializeTestVars();
    // basecoin = bitgo.coin('tsui');
  });
});
/*
nock.disableNetConnect();

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });
bitgo.safeRegister('tsui', Tsui.createInstance);

describe('Sui', function () {
  let bitgo;
  let basecoin;

  before(function () {
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tsui');
  });

  after(function () {
    nock.pendingMocks().should.be.empty();
  });

  it('should instantiate the coin', function () {
    const basecoin = bitgo.coin('tsui');
    basecoin.should.be.an.instanceof(Tsui);
  });

  it('isValidAddress should be correct', function () {
    // Add valid addresses for testing
    basecoin.isValidAddress('').should.be.True();
    basecoin.isValidAddress('').should.be.True();
    basecoin.isValidAddress('').should.be.True();
  });

  it('verifyAddress should work', function () {

  });

  it('Should be able to explain a Sui transaction', async function () {

  });
});
*/
