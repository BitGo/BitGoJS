import assert from 'assert';
import should from 'should';
import utils from '../../src/lib/utils';
import {
  CANTON_ADDRESSES,
  GenerateTopologyResponse,
  PreparedTransactionRawData,
  PrepareSubmissionResponse,
} from '../resources';

describe('Canton Util', function () {
  describe('Raw transaction parser', function () {
    it('should parse the prepared transaction', () => {
      const parsedData = utils.parseRawCantonTransactionData(PreparedTransactionRawData);
      should.exist(parsedData);
      assert.equal(parsedData.sender, 'abc-1::12200c1ee226fbdf9fba3461c2c0c73331b69d3c6fd8cfce28cdf864141141cc656d');
      assert.equal(parsedData.receiver, 'abc-2::12207e96ada18a845adf4dc01410265633d5266dca9bb280c98e35c3692db87d3e35');
      assert.equal(parsedData.amount, '20.0000000000');
    });
  });

  describe('Wallet init transaction', function () {
    it('should locally generate and validate the hash for topology transaction', function () {
      const computedHash = utils.computeHashFromCreatePartyResponse(GenerateTopologyResponse.topologyTransactions);
      should.exist(computedHash);
      assert.strictEqual(computedHash, GenerateTopologyResponse.multiHash);
    });
  });

  describe('Prepare submission response validation', function () {
    it('should locally generate and validate the hash for prepare submission response', async function () {
      const computedHash = await utils.computeHashFromPrepareSubmissionResponse(
        PrepareSubmissionResponse.preparedTransaction
      );
      should.exist(computedHash);
      assert.strictEqual(computedHash, PrepareSubmissionResponse.preparedTransactionHash);
    });
  });

  describe('Check if the address is valid', function () {
    it('should return true when the address is valid', function () {
      const isValid = utils.isValidAddress(CANTON_ADDRESSES.VALID_ADDRESS);
      should.exist(isValid);
      assert.strictEqual(isValid, true);
    });

    it('should return false when party hint is invalid', function () {
      const isValid = utils.isValidAddress(CANTON_ADDRESSES.INVALID_PARTY_HINT);
      should.exist(isValid);
      assert.strictEqual(isValid, false);
    });

    it('should return false when fingerprint is invalid', function () {
      const isValid = utils.isValidAddress(CANTON_ADDRESSES.INVALID_FINGERPRINT);
      should.exist(isValid);
      assert.strictEqual(isValid, false);
    });

    it('should return false when party hint is missing', function () {
      const isValid = utils.isValidAddress(CANTON_ADDRESSES.MISSING_PARTY_HINT);
      should.exist(isValid);
      assert.strictEqual(isValid, false);
    });

    it('should return false when fingerprint is missing', function () {
      const isValid = utils.isValidAddress(CANTON_ADDRESSES.MISSING_FINGERPRINT);
      should.exist(isValid);
      assert.strictEqual(isValid, false);
    });
  });
});
