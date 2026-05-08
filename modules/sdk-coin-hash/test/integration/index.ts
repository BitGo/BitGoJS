import 'should';

import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';

import { Hash, Thash } from '../../src/index';

describe('HASH', function () {
  let bitgo: TestBitGoAPI;
  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('hash', Hash.createInstance);
    bitgo.safeRegister('thash', Thash.createInstance);
    bitgo.initializeTestVars();
  });
});
