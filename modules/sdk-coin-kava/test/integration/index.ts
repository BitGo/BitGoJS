import 'should';

import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';

import { Kava, Tkava } from '../../src/index';

describe('Kava', function () {
  let bitgo: TestBitGoAPI;
  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('kava', Kava.createInstance);
    bitgo.safeRegister('tkava', Tkava.createInstance);
    bitgo.initializeTestVars();
  });
});
