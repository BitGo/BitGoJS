import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Ton, Tton } from '../../src';

describe('TON:', function () {
  let bitgo: TestBitGoAPI;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('ton', Ton.createInstance);
    bitgo.safeRegister('tton', Tton.createInstance);
    bitgo.initializeTestVars();
  });
});
