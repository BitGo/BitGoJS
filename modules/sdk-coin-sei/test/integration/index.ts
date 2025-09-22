import 'should';

import { BitGoAPI } from '@bitgo-beta/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo-beta/sdk-test';

import { Sei, Tsei } from '../../src/index';

describe('SEI', function () {
  let bitgo: TestBitGoAPI;
  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('sei', Sei.createInstance);
    bitgo.safeRegister('tsei', Tsei.createInstance);
    bitgo.initializeTestVars();
  });
});
