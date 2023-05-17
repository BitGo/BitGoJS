import * as nock from 'nock';
import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Tosmo } from '../../src/index';

nock.disableNetConnect();

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });
bitgo.safeRegister('tosmo', Tosmo.createInstance);

describe('Osmosis', function () {
  let bitgo;
  let basecoin;

  before(function () {
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tosmo');
  });

  after(function () {
    nock.pendingMocks().should.be.empty();
  });

  it('should instantiate the coin', function () {
    const basecoin = bitgo.coin('tosmo');
    basecoin.should.be.an.instanceof(Tosmo);
  });

  it('isValidAddress should be correct', function () {
    // Add valid addresses for testing
    basecoin.isValidAddress('').should.be.True();
    basecoin.isValidAddress('').should.be.True();
    basecoin.isValidAddress('').should.be.True();
  });

  // it('verifyAddress should work', function () {});

  // it('Should be able to explain an Osmosis transaction', async function () {});
});
