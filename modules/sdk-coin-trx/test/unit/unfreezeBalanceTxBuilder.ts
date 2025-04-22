import { TransactionType } from '@bitgo/sdk-core';
import { before, describe, it } from 'node:test';
import assert from 'assert';
import { UnfreezeBalanceTxBuilder } from '../../src/lib/unfreezeBalanceTxBuilder';
import { validUnfreezeUnsignedTx } from '../resources';
import { getBuilder } from '../../src/lib/builder';

describe('Tron UnfreezeBuilder', function () {
  let unfreezeBuilder: UnfreezeBalanceTxBuilder;
  let wrappedBuilder;

  before(() => {
    wrappedBuilder = getBuilder('ttrx');
    // Get UnfreezeBuilder from the wrapped builder
    unfreezeBuilder = wrappedBuilder.getUnfreezeBalanceTxBuilder();
  });

  describe('validateTransaction', () => {
    it('should validate a correct unfreeze transaction', () => {
      assert.doesNotThrow(() => unfreezeBuilder.validateTransaction(validUnfreezeUnsignedTx));
    });

    it('should reject a transaction with invalid resource', () => {
      const invalidTx = JSON.parse(JSON.stringify(validUnfreezeUnsignedTx));
      invalidTx.raw_data.contract[0].parameter.value.resource = 'INVALID_RESOURCE';
      assert.throws(() => unfreezeBuilder.validateTransaction(invalidTx), /Invalid unfreeze transaction: resource/);
    });

    it('should reject a transaction with zero unfreeze_balance', () => {
      const invalidTx = JSON.parse(JSON.stringify(validUnfreezeUnsignedTx));
      invalidTx.raw_data.contract[0].parameter.value.unfreeze_balance = 0;
      assert.throws(() => unfreezeBuilder.validateTransaction(invalidTx), /unfreeze_balance must be positive/);
    });

    it('should reject a transaction with negative unfreeze_balance', () => {
      const invalidTx = JSON.parse(JSON.stringify(validUnfreezeUnsignedTx));
      invalidTx.raw_data.contract[0].parameter.value.unfreeze_balance = -100;
      assert.throws(() => unfreezeBuilder.validateTransaction(invalidTx), /unfreeze_balance must be positive/);
    });

    it('should reject a transaction with missing owner_address', () => {
      const invalidTx = JSON.parse(JSON.stringify(validUnfreezeUnsignedTx));
      delete invalidTx.raw_data.contract[0].parameter.value.owner_address;
      assert.throws(() => unfreezeBuilder.validateTransaction(invalidTx), /missing or invalid owner_address/);
    });

    it('should reject a transaction with wrong contract type', () => {
      const invalidTx = JSON.parse(JSON.stringify(validUnfreezeUnsignedTx));
      invalidTx.raw_data.contract[0].type = 'TransferContract';
      assert.throws(
        () => unfreezeBuilder.validateTransaction(invalidTx),
        /expected contract type UnfreezeBalanceV2Contract/
      );
    });

    it('should reject a transaction with missing parameter value', () => {
      const invalidTx = JSON.parse(JSON.stringify(validUnfreezeUnsignedTx));
      delete invalidTx.raw_data.contract[0].parameter.value;
      assert.throws(() => unfreezeBuilder.validateTransaction(invalidTx), /missing parameter value/);
    });
  });

  describe('canSign', () => {
    it('should return true for valid unfreeze transaction', () => {
      const result = unfreezeBuilder.canSign(validUnfreezeUnsignedTx);
      assert.strictEqual(result, true);
    });

    it('should return false for invalid unfreeze transaction', () => {
      const invalidTx = JSON.parse(JSON.stringify(validUnfreezeUnsignedTx));
      invalidTx.raw_data.contract[0].type = 'TransferContract';
      const result = unfreezeBuilder.canSign(invalidTx);
      assert.strictEqual(result, false);
    });
  });

  describe('transaction type', () => {
    it('should set transaction type to StakingUnlock', () => {
      assert.strictEqual(unfreezeBuilder['transactionType'], TransactionType.StakingUnlock);
    });
  });
});
