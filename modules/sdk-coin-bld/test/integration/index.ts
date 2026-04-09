import 'should';

import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';

import { Bld, Tbld } from '../../src/index';

describe('BLD', function () {
  let bitgo: TestBitGoAPI;
  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('bld', Bld.createInstance);
    bitgo.safeRegister('tbld', Tbld.createInstance);
    bitgo.initializeTestVars();
  });
});
