import 'should';

import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';

import { Inj, Tinj } from '../../src/index';

describe('INJ', function () {
  let bitgo: TestBitGoAPI;
  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('injective', Inj.createInstance);
    bitgo.safeRegister('tinjective', Tinj.createInstance);
    bitgo.initializeTestVars();
  });
});
