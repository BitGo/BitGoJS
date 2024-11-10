import 'should';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Apt, Tapt } from '../../src';

describe('APT:', function () {
  let bitgo: TestBitGoAPI;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('apt', Apt.createInstance);
    bitgo.safeRegister('tapt', Tapt.createInstance);
    bitgo.initializeTestVars();
  });
});
