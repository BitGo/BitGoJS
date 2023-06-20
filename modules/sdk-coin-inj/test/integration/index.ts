import 'should';

import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';

import { Inj, Tinj } from '../../src/index';

describe('INJ', function () {
  let bitgo: TestBitGoAPI;
  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('inj', Inj.createInstance);
    bitgo.safeRegister('tinj', Tinj.createInstance);
    bitgo.initializeTestVars();
  });
});
