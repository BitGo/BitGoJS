import 'should';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Iota } from '../../src';

describe('Iota:', function () {
  let bitgo: TestBitGoAPI;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('iota', Iota.createInstance);
    bitgo.safeRegister('tiota', Iota.createInstance);
    bitgo.initializeTestVars();
  });
});
