import * as nock from 'nock';
import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Taca } from '../../src/index';

nock.disableNetConnect();

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });
bitgo.safeRegister('taca', Taca.createInstance);

describe('Acala', function () {
  before(function () {
    bitgo.initializeTestVars();
  });

  after(function () {
    nock.pendingMocks().should.be.empty();
  });

  it('should instantiate the coin', function () {
    const basecoin = bitgo.coin('taca');
    basecoin.should.be.an.instanceof(Taca);
  });
});
