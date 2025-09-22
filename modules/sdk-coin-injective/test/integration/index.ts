import 'should';

import { BitGoAPI } from '@bitgo-beta/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo-beta/sdk-test';

import { Injective, Tinjective } from '../../src/index';

describe('INJ', function () {
  let bitgo: TestBitGoAPI;
  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('injective', Injective.createInstance);
    bitgo.safeRegister('tinjective', Tinjective.createInstance);
    bitgo.initializeTestVars();
  });
});
