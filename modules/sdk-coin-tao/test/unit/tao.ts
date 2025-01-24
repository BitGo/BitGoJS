import 'should';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Tao, Ttao } from '../../src';

describe('Tao:', function () {
  let bitgo: TestBitGoAPI;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('tao', Tao.createInstance);
    bitgo.safeRegister('ttao', Ttao.createInstance);
    bitgo.initializeTestVars();
  });
});
