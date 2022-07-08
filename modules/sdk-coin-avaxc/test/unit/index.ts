import * as nock from 'nock';
import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Tavaxc } from '../../src/index';

nock.disableNetConnect();

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });
bitgo.safeRegister('tavaxc', Tavaxc.createInstance);

describe('Avalanche c-chain', function () {
  let bitgo;
  let basecoin;

  before(function () {
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tavaxc');
  });

  after(function () {
    nock.pendingMocks().should.be.empty();
  });

  it('should instantiate the coin', function () {
    const basecoin = bitgo.coin('tavaxc');
    basecoin.should.be.an.instanceof(Tavaxc);
  });

  it('isValidAddress should be correct', function () {
    // Add valid addresses for testing
    basecoin.isValidAddress('').should.be.True();
    basecoin.isValidAddress('').should.be.True();
    basecoin.isValidAddress('').should.be.True();
  });

  it('verifyAddress should work', function () {

  }

  it('Should be able to explain an Avalanche c-chain transaction', async function () {
    
  });
});
