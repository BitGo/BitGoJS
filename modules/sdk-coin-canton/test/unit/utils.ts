import assert from 'assert';
import should from 'should';

import { TransactionType } from '@bitgo/sdk-core';

import utils from '../../src/lib/utils';
import {
  CANTON_ADDRESSES,
  CANTON_BLOCK_HEIGHT,
  GenerateTopologyResponse,
  OneStepPreApprovalPrepareResponse,
  PreparedTransactionRawData,
  PreparedTxn1StepReceiver,
  PreparedTxn2StepReceiver,
  PrepareSubmissionResponse,
  TransferAcceptancePrepareResponse,
  TransferRejectionPrepareResponse,
} from '../resources';

describe('Canton Util', function () {
  describe('Raw transaction parser', function () {
    it('should parse the prepared transaction', () => {
      const parsedData = utils.parseRawCantonTransactionData(PreparedTransactionRawData, TransactionType.Send);
      should.exist(parsedData);
      assert.equal(parsedData.sender, 'abc-1::12200c1ee226fbdf9fba3461c2c0c73331b69d3c6fd8cfce28cdf864141141cc656d');
      assert.equal(parsedData.receiver, 'abc-2::12207e96ada18a845adf4dc01410265633d5266dca9bb280c98e35c3692db87d3e35');
      assert.equal(parsedData.amount, '200000000000');
    });

    it('should parse correctly when receiver is on 2-step', () => {
      const parsedData = utils.parseRawCantonTransactionData(PreparedTxn2StepReceiver, TransactionType.Send);
      should.exist(parsedData);
      assert.equal(parsedData.sender, '1220a::1220ade60300cf7d0b18ffaa2ffe4f492ad1ad601cfc162b20f77ec99d16c2c2f158');
      assert.equal(
        parsedData.receiver,
        'ravi-test-party-1::122092e7d33ac10c0f3d55976342f37555df05da5b742956d56a62ae2367769079d2'
      );
      assert.equal(parsedData.amount, '20000000000');
    });

    it('should parse correctly 1', () => {
      const parsedData = utils.parseRawCantonTransactionData(PreparedTxn1StepReceiver, TransactionType.Send);
      should.exist(parsedData);
      assert.equal(parsedData.sender, '1220a::1220ade60300cf7d0b18ffaa2ffe4f492ad1ad601cfc162b20f77ec99d16c2c2f158');
      assert.equal(
        parsedData.receiver,
        'ravi-demo-party-txn-01-tapper::1220ea7ab5a723f8a6b2078e617e6c58cb7e78e49947ddc239e1a941aa56e6ba08b4'
      );
      assert.equal(parsedData.amount, '20000000000');
    });

    it('should parse the acceptance prepared transaction', () => {
      const parsedData = utils.parseRawCantonTransactionData(
        TransferAcceptancePrepareResponse.preparedTransaction,
        TransactionType.TransferAccept
      );
      should.exist(parsedData);
      assert.equal(parsedData.sender, 'DSO::1220be58c29e65de40bf273be1dc2b266d43a9a002ea5b18955aeef7aac881bb471a');
      assert.equal(parsedData.receiver, 'abcde::12205b4e3537a95126d90604592344d8ad3c3ddccda4f79901954280ee19c576714d');
      assert.equal(parsedData.amount, '50000000000');
    });

    it('should parse the rejection prepared transaction', () => {
      const parsedData = utils.parseRawCantonTransactionData(
        TransferRejectionPrepareResponse.preparedTransaction,
        TransactionType.TransferReject
      );
      should.exist(parsedData);
      assert.equal(parsedData.sender, 'DSO::1220be58c29e65de40bf273be1dc2b266d43a9a002ea5b18955aeef7aac881bb471a');
      assert.equal(parsedData.receiver, '12201::122038402cf1650876d2920d6047b11a4aaf0de7b428e9916009cba2a22b1ae22c1a');
      assert.equal(parsedData.amount, '50000000000');
    });

    it('should parse the one-step preapproval prepared transaction', () => {
      const parsedData = utils.parseRawCantonTransactionData(
        OneStepPreApprovalPrepareResponse.preparedTransaction,
        TransactionType.OneStepPreApproval
      );
      should.exist(parsedData);
      assert.equal(
        parsedData.sender,
        'Bitgo-devnet-validator-1::1220a0a0f60b0e62b5d750c484b18c091dba23080c133d944614ba75a5858cba3045'
      );
      assert.equal(
        parsedData.receiver,
        'ravi-test-party-1::12205b4e3537a95126d90604592344d8ad3c3ddccda4f79901954280ee19c576714d'
      );
      assert.equal(parsedData.amount, '0');
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
      const isValid = utils.isValidAddress(CANTON_ADDRESSES.VALID_PARTY_HINT);
      should.exist(isValid);
      assert.strictEqual(isValid, true);
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

    it('should return true when memo id is valid', function () {
      const isValid = utils.isValidAddress(CANTON_ADDRESSES.VALID_MEMO_ID);
      should.exist(isValid);
      assert.strictEqual(isValid, true);
    });
  });

  describe('Check if block hash is valid', function () {
    it('should return true when the block hash is valid', function () {
      const isValid = utils.isValidBlockId(CANTON_BLOCK_HEIGHT.VALID_HASH);
      should.exist(isValid);
      assert.strictEqual(isValid, true);
    });

    it('should return false when the block hash is not a number', function () {
      const isValid = utils.isValidBlockId(CANTON_BLOCK_HEIGHT.INVALID_BLOCK_HASH);
      should.exist(isValid);
      assert.strictEqual(isValid, false);
    });

    it('should return false when the block hash is negative', function () {
      const isValid = utils.isValidBlockId(CANTON_BLOCK_HEIGHT.NEGATIVE_BLOCK_HASH);
      should.exist(isValid);
      assert.strictEqual(isValid, false);
    });
  });
});
