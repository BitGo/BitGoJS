import 'should';

import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';

import { Tia, Ttia } from '../../src/index';

describe('TIA', function () {
  let bitgo: TestBitGoAPI;
  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('tia', Tia.createInstance);
    bitgo.safeRegister('ttia', Ttia.createInstance);
    bitgo.initializeTestVars();
  });
});
