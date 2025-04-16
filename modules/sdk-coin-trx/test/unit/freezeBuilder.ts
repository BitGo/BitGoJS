import { beforeEach, describe, it } from 'node:test';
import assert from 'assert';
import { FreezeBuilder, FreezeResource } from '../../src/lib/freezeBuilder';
import { validFreezeUnsignedTx } from '../resources';
import { getBuilder } from '../../src/lib/builder';

describe('Tron FreezeBuilder', function () {
  let freezeBuilder: FreezeBuilder;
  let wrappedBuilder;

  beforeEach(() => {
    wrappedBuilder = getBuilder('ttrx');
    // Get FreezeBuilder from the wrapped builder
    freezeBuilder = wrappedBuilder.getFreezeBuilder();
  });

  describe('validateTransaction', () => {
    it('should validate a correct freeze transaction', () => {
      assert.doesNotThrow(() => freezeBuilder.validateTransaction(validFreezeUnsignedTx));
    });

    it('should reject a transaction with invalid resource', () => {
      const invalidTx = JSON.parse(JSON.stringify(validFreezeUnsignedTx));
      invalidTx.raw_data.contract[0].parameter.value.resource = 'INVALID_RESOURCE';
      assert.throws(() => freezeBuilder.validateTransaction(invalidTx), /Invalid freeze transaction: resource/);
    });

    it('should reject a transaction with zero frozen_balance', () => {
      const invalidTx = JSON.parse(JSON.stringify(validFreezeUnsignedTx));
      invalidTx.raw_data.contract[0].parameter.value.frozen_balance = 0;
      assert.throws(() => freezeBuilder.validateTransaction(invalidTx), /frozen_balance must be positive/);
    });

    it('should reject a transaction with negative frozen_balance', () => {
      const invalidTx = JSON.parse(JSON.stringify(validFreezeUnsignedTx));
      invalidTx.raw_data.contract[0].parameter.value.frozen_balance = -100;
      assert.throws(() => freezeBuilder.validateTransaction(invalidTx), /frozen_balance must be positive/);
    });

    it('should reject a transaction with missing owner_address', () => {
      const invalidTx = JSON.parse(JSON.stringify(validFreezeUnsignedTx));
      delete invalidTx.raw_data.contract[0].parameter.value.owner_address;
      assert.throws(() => freezeBuilder.validateTransaction(invalidTx), /missing or invalid owner_address/);
    });

    it('should reject a transaction with wrong contract type', () => {
      const invalidTx = JSON.parse(JSON.stringify(validFreezeUnsignedTx));
      invalidTx.raw_data.contract[0].type = 'TransferContract';
      assert.throws(
        () => freezeBuilder.validateTransaction(invalidTx),
        /expected contract type FreezeBalanceV2Contract/
      );
    });

    it('should reject a transaction with missing parameter value', () => {
      const invalidTx = JSON.parse(JSON.stringify(validFreezeUnsignedTx));
      delete invalidTx.raw_data.contract[0].parameter.value;
      assert.throws(() => freezeBuilder.validateTransaction(invalidTx), /missing parameter value/);
    });
  });

  describe('canSign', () => {
    it('should return true for valid freeze transaction', () => {
      const result = freezeBuilder.canSign(validFreezeUnsignedTx);
      assert.strictEqual(result, true);
    });

    it('should return false for invalid freeze transaction', () => {
      const invalidTx = JSON.parse(JSON.stringify(validFreezeUnsignedTx));
      invalidTx.raw_data.contract[0].type = 'TransferContract';
      const result = freezeBuilder.canSign(invalidTx);
      assert.strictEqual(result, false);
    });
  });

  describe.skip('builder integration', () => {
    it('should be able to deserialize a valid freeze transaction using from method', () => {
      assert.doesNotThrow(() => wrappedBuilder.from(validFreezeUnsignedTx));

      assert.strictEqual(wrappedBuilder._builder instanceof FreezeBuilder, true);
    });
  });

  describe('FreezeResource enum', () => {
    it('should contain the expected resource types', () => {
      assert.strictEqual(FreezeResource.BANDWIDTH, 'BANDWIDTH');
      assert.strictEqual(FreezeResource.ENERGY, 'ENERGY');
      assert.strictEqual(Object.keys(FreezeResource).length, 2);
    });

    it('should validate the resource in validFreezeUnsignedTx', () => {
      const resource = validFreezeUnsignedTx.raw_data.contract[0].parameter.value.resource;
      assert.strictEqual(resource, FreezeResource.ENERGY);
    });
  });
});
