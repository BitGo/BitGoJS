import 'should';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Polyx, Tpolyx } from '../../src';

describe('Polyx:', function () {
  let bitgo: TestBitGoAPI;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('polyx', Polyx.createInstance);
    bitgo.safeRegister('tpolyx', Tpolyx.createInstance);
    bitgo.initializeTestVars();
  });
});
