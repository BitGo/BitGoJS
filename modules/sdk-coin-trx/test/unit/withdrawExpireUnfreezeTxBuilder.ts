import { TransactionType } from '@bitgo/sdk-core';
import { before, describe, it } from 'node:test';
import assert from 'assert';
import { WithdrawExpireUnfreezeTxBuilder } from '../../src/lib/withdrawExpireUnfreezeTxBuilder';
import { validWithdrawUnsignedTx } from '../resources';
import { getBuilder } from '../../src/lib/builder';

describe('Tron WithdrawBuilder', function () {
  let withdrawBuilder: WithdrawExpireUnfreezeTxBuilder;
  let wrappedBuilder;

  before(() => {
    wrappedBuilder = getBuilder('ttrx');
    // Get WithdrawBuilder from the wrapped builder
    withdrawBuilder = wrappedBuilder.getWithdrawExpireUnfreezeTxBuilder();
  });

  describe('validateTransaction', () => {
    it('should validate a correct withdraw transaction', () => {
      assert.doesNotThrow(() => withdrawBuilder.validateTransaction(validWithdrawUnsignedTx));
    });

    it('should reject a transaction with wrong contract type', () => {
      const invalidTx = JSON.parse(JSON.stringify(validWithdrawUnsignedTx));
      invalidTx.raw_data.contract[0].type = 'TransferContract';
      assert.throws(
        () => withdrawBuilder.validateTransaction(invalidTx),
        /expected contract type WithdrawExpireUnfreezeContract/
      );
    });

    it('should reject a transaction with missing owner_address', () => {
      const invalidTx = JSON.parse(JSON.stringify(validWithdrawUnsignedTx));
      delete invalidTx.raw_data.contract[0].parameter.value.owner_address;
      assert.throws(() => withdrawBuilder.validateTransaction(invalidTx), /missing or invalid owner_address/);
    });

    it('should reject a transaction with empty owner_address', () => {
      const invalidTx = JSON.parse(JSON.stringify(validWithdrawUnsignedTx));
      invalidTx.raw_data.contract[0].parameter.value.owner_address = '';
      assert.throws(() => withdrawBuilder.validateTransaction(invalidTx), /missing or invalid owner_address/);
    });

    it('should reject a transaction with missing parameter value', () => {
      const invalidTx = JSON.parse(JSON.stringify(validWithdrawUnsignedTx));
      delete invalidTx.raw_data.contract[0].parameter.value;
      assert.throws(() => withdrawBuilder.validateTransaction(invalidTx), /missing parameter value/);
    });

    it('should reject a transaction with empty contract array', () => {
      const invalidTx = JSON.parse(JSON.stringify(validWithdrawUnsignedTx));
      invalidTx.raw_data.contract = [];
      assert.throws(() => withdrawBuilder.validateTransaction(invalidTx), /missing or empty contract array/);
    });

    it('should reject a transaction without contract array', () => {
      const invalidTx = JSON.parse(JSON.stringify(validWithdrawUnsignedTx));
      delete invalidTx.raw_data.contract;
      assert.throws(() => withdrawBuilder.validateTransaction(invalidTx), /missing or empty contract array/);
    });
  });

  describe('canSign', () => {
    it('should return true for valid withdraw transaction', () => {
      const result = withdrawBuilder.canSign(validWithdrawUnsignedTx);
      assert.strictEqual(result, true);
    });

    it('should return false for invalid withdraw transaction', () => {
      const invalidTx = JSON.parse(JSON.stringify(validWithdrawUnsignedTx));
      invalidTx.raw_data.contract[0].type = 'TransferContract';
      const result = withdrawBuilder.canSign(invalidTx);
      assert.strictEqual(result, false);
    });
  });

  describe('transaction type', () => {
    it('should set transaction type to StakingWithdraw', () => {
      assert.strictEqual(withdrawBuilder['transactionType'], TransactionType.StakingWithdraw);
    });
  });
});
