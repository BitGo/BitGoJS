import 'should';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { Canton, Tcanton } from '../../src';

describe('Canton:', function () {
  let bitgo: TestBitGoAPI;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('canton', Canton.createInstance);
    bitgo.safeRegister('tcanton', Tcanton.createInstance);
    bitgo.initializeTestVars();
  });
});
