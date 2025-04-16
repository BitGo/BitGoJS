import { beforeEach, describe, it } from 'node:test';
import assert from 'assert';
import { VoteBuilder } from '../../src/lib/voteBuilder';
import { validVoteUnsignedTx } from '../resources';
import { getBuilder } from '../../src/lib/builder';
import { TransactionType } from '@bitgo/sdk-core';

describe('Tron VoteBuilder', function () {
  let voteBuilder: VoteBuilder;
  let wrappedBuilder;

  beforeEach(() => {
    wrappedBuilder = getBuilder('ttrx');
    // Get VoteBuilder from the wrapped builder
    voteBuilder = wrappedBuilder.getVoteBuilder();
  });

  describe('validateTransaction', () => {
    it('should validate a correct vote transaction', () => {
      assert.doesNotThrow(() => voteBuilder.validateTransaction(validVoteUnsignedTx));
    });

    it('should reject a transaction with wrong contract type', () => {
      const invalidTx = JSON.parse(JSON.stringify(validVoteUnsignedTx));
      invalidTx.raw_data.contract[0].type = 'TransferContract';
      assert.throws(() => voteBuilder.validateTransaction(invalidTx), /expected contract type VoteWitnessContract/);
    });

    it('should reject a transaction with missing owner_address', () => {
      const invalidTx = JSON.parse(JSON.stringify(validVoteUnsignedTx));
      delete invalidTx.raw_data.contract[0].parameter.value.owner_address;
      assert.throws(() => voteBuilder.validateTransaction(invalidTx), /missing or invalid owner_address/);
    });

    it('should reject a transaction with empty votes array', () => {
      const invalidTx = JSON.parse(JSON.stringify(validVoteUnsignedTx));
      invalidTx.raw_data.contract[0].parameter.value.votes = [];
      assert.throws(() => voteBuilder.validateTransaction(invalidTx), /missing or empty votes array/);
    });

    it('should reject a transaction with invalid vote_address', () => {
      const invalidTx = JSON.parse(JSON.stringify(validVoteUnsignedTx));
      invalidTx.raw_data.contract[0].parameter.value.votes[0].vote_address = '';
      assert.throws(() => voteBuilder.validateTransaction(invalidTx), /vote missing or invalid vote_address/);
    });

    it('should reject a transaction with invalid vote_count', () => {
      const invalidTx = JSON.parse(JSON.stringify(validVoteUnsignedTx));
      invalidTx.raw_data.contract[0].parameter.value.votes[0].vote_count = 0;
      assert.throws(() => voteBuilder.validateTransaction(invalidTx), /vote count must be a positive number/);
    });
  });

  describe('canSign', () => {
    it('should return true for valid vote transaction', () => {
      const result = voteBuilder.canSign(validVoteUnsignedTx);
      assert.strictEqual(result, true);
    });

    it('should return false for invalid vote transaction', () => {
      const invalidTx = JSON.parse(JSON.stringify(validVoteUnsignedTx));
      invalidTx.raw_data.contract[0].type = 'TransferContract';
      const result = voteBuilder.canSign(invalidTx);
      assert.strictEqual(result, false);
    });
  });

  describe('transaction type', () => {
    it('should set transaction type to StakingVote', () => {
      assert.strictEqual(voteBuilder['transactionType'], TransactionType.StakingVote);
    });
  });

  describe.skip('builder integration', () => {
    it('should be able to deserialize a valid vote transaction using from method', () => {
      assert.doesNotThrow(() => wrappedBuilder.from(validVoteUnsignedTx));
      assert.strictEqual(wrappedBuilder._builder instanceof VoteBuilder, true);
    });
  });
});
