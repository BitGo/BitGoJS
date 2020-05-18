import should from 'should';
import { sign, getContractData, isValidEthAddress, getAddressInitializationData } from '../../../../src/coin/eth/utils';
import * as testData from '../../../resources/eth/eth';
import * as walletUtilConstants from '../../../../src/coin/eth/walletUtil';

describe('ETH util library', function() {
  describe('sign operation', function() {
    it('should return a correct signed transaction', async () => {
      const SIGNATURE = await sign(testData.TXDATA, testData.KEYPAIR_PRV);
      should.equal(SIGNATURE, testData.SIGNED_TX);
    });

    it('should fail with missing prv key', function() {
      sign(testData.TXDATA, testData.KEYPAIR_PUB).should.be.rejectedWith(new RegExp('Missing private key'));
    });
  });

  describe('Obtain contract data', function() {
    const CONTRACT_ADDRESSES = [testData.ACCOUNT_1, testData.ACCOUNT_2, testData.ACCOUNT_3];
    should.equal(getContractData(CONTRACT_ADDRESSES), testData.EXPECTED_CONTRACT_DATA);
  });

  describe('Should validate valid createForwareder Id', function() {
    should.equal(getAddressInitializationData(), walletUtilConstants.createForwarderMethodId);
  });

  describe('shoud validate valid address', function() {
    should.equal(isValidEthAddress(testData.ACCOUNT_1), true);
  });

  describe('shoud validate invalid address', function() {
    should.equal(isValidEthAddress(testData.INVALID_ACCOUNT), false);
  });
});
