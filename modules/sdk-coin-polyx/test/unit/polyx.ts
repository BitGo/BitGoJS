import 'should';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Polyx, Tpolyx } from '../../src';
import { POLYX_ADDRESS_FORMAT, TPOLYX_ADDRESS_FORMAT } from '../../src/lib/constants';

describe('Polyx:', function () {
  let bitgo: TestBitGoAPI;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('polyx', Polyx.createInstance);
    bitgo.safeRegister('tpolyx', Tpolyx.createInstance);
    bitgo.initializeTestVars();
  });

  describe('Address Format Constants', function () {
    it('should have the correct address format constants', function () {
      // Verify the constants are defined correctly
      POLYX_ADDRESS_FORMAT.should.equal(12);
      TPOLYX_ADDRESS_FORMAT.should.equal(42);
    });
  });
});
