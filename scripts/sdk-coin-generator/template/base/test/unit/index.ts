import * as nock from 'nock';
import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { <%= testnetConstructor %> } from '../../src/index';

nock.disableNetConnect();

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });
bitgo.safeRegister('<%= testnetSymbol %>', <%= testnetConstructor %>.createInstance);

describe('<%= coin %>', function () {
  let bitgo;
  let basecoin;

  before(function () {
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('<%= testnetSymbol %>');
  });

  after(function () {
    nock.pendingMocks().should.be.empty();
  });

  it('should instantiate the coin', function () {
    const basecoin = bitgo.coin('<%= testnetSymbol %>');
    basecoin.should.be.an.instanceof(<%= testnetConstructor %>);
  });

  it('isValidAddress should be correct', function () {
    // Add valid addresses for testing
    basecoin.isValidAddress('').should.be.True();
    basecoin.isValidAddress('').should.be.True();
    basecoin.isValidAddress('').should.be.True();
  });

  it('verifyAddress should work', function () {

  }

  it('Should be able to explain an <%= coin %> transaction', async function () {
    
  });
});
