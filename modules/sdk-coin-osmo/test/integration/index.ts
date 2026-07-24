import 'should';

import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';

import { Osmo, Tosmo } from '../../src/index';

describe('OSMO', function () {
  let bitgo: TestBitGoAPI;
  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('osmo', Osmo.createInstance);
    bitgo.safeRegister('tosmo', Tosmo.createInstance);
    bitgo.initializeTestVars();
  });
});
