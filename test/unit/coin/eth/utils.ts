import should from 'should';
import {
  sign,
  isValidEthAddress,
  getAddressInitializationData,
  calculateForwarderAddress,
} from '../../../../src/coin/eth/utils';
import * as testData from '../../../resources/eth/eth';
import * as walletUtilConstants from '../../../../src/coin/eth/walletUtil';

describe('ETH util library', function() {
  describe('sign operation', function() {
    it('should return a correct signed transaction', async () => {
      const SIGNATURE = await sign(testData.TXDATA, testData.KEYPAIR_PRV);
      should.equal(SIGNATURE, testData.ENCODED_TRANSACTION);
    });

    it('should fail with missing prv key', function() {
      sign(testData.TXDATA, testData.KEYPAIR_PUB).should.be.rejectedWith(new RegExp('Missing private key'));
    });
  });

  it('Should validate valid createForwarder Id', function() {
    should.equal(getAddressInitializationData(), walletUtilConstants.createForwarderMethodId);
  });

  it('should validate valid address', function() {
    should.equal(isValidEthAddress(testData.ACCOUNT_1), true);
  });

  it('should validate invalid address', function() {
    should.equal(isValidEthAddress(testData.INVALID_ACCOUNT), false);
  });

  it('should generate a proper address', function() {
    should.equal(calculateForwarderAddress(testData.CONTRACT_ADDRESS, 1), '0x016e4eee27f3f355bbb78d0e5eb813c4761822c9');
  });
});
