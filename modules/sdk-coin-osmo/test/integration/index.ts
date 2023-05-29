import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Osmo, Tosmo } from '../../src/index';

describe('OSMO', function () {
  let bitgo: TestBitGoAPI;
  // let basecoin;
  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('osmo', Osmo.createInstance);
    bitgo.safeRegister('tosmo', Tosmo.createInstance);
    bitgo.initializeTestVars();
    // basecoin = bitgo.coin('tosmo');
  });
});
