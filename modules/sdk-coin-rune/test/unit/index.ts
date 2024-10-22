import * as nock from 'nock';
import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Trune } from '../../src/index';

nock.disableNetConnect();

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });
bitgo.safeRegister('trune', Trune.createInstance);

describe('Rune', function () {
  let bitgo;
  let basecoin;

  before(function () {
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('trune');
  });

  after(function () {
    nock.pendingMocks().should.be.empty();
  });

  it('should instantiate the coin', function () {
    const basecoin = bitgo.coin('trune');
    basecoin.should.be.an.instanceof(Trune);
  });

  it('isValidAddress should be correct', function () {
    // Add valid addresses for testing
    basecoin.isValidAddress('').should.be.True();
    basecoin.isValidAddress('').should.be.True();
    basecoin.isValidAddress('').should.be.True();
  });
});
