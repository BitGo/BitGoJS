import 'should';

import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';

import { Zeta, Tzeta } from '../../src/index';

describe('Zeta', function () {
  let bitgo: TestBitGoAPI;
  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('zeta', Zeta.createInstance);
    bitgo.safeRegister('tzeta', Tzeta.createInstance);
    bitgo.initializeTestVars();
  });
});
