import assert from 'assert';
import { TransactionType } from '@bitgo/sdk-core';
import { describe, it } from 'node:test';
import { PARTICIPANTS, BLOCK_HASH, BLOCK_NUMBER, EXPIRATION, VOTE_WITNESS_CONTRACT } from '../../resources';
import { getBuilder } from '../../../src/lib/builder';
import { Transaction, WrappedBuilder } from '../../../src';

describe('Tron VoteWitnessContract builder', function () {
  const voteArray = [
    {
      vote_address: 'TXyZjVcYurrbE43b2MfMtN34uA3tJL85zy',
      vote_count: 1000,
    },
    {
      vote_address: 'TUtzEvZRqVoNr4ifVyGTnVcyDUpWsrXkJ3',
      vote_count: 2000,
    },
  ];
  const initTxBuilder = () => {
    const builder = (getBuilder('ttrx') as WrappedBuilder).getVoteWitnessTxBuilder();

    builder
      .source({ address: PARTICIPANTS.custodian.address })
      .block({ number: BLOCK_NUMBER, hash: BLOCK_HASH })
      .setVotes(voteArray);

    return builder;
  };

  describe('should build successfully', () => {
    it('a transaction with correct inputs', async () => {
      const timestamp = Date.now();
      const txBuilder = initTxBuilder();
      txBuilder.timestamp(timestamp);
      txBuilder.expiration(timestamp + 40000);
      const tx = (await txBuilder.build()) as Transaction;
      const txJson = tx.toJson();
      assert.equal(tx.type, TransactionType.StakingVote);
      assert.equal(tx.inputs.length, 1);
      assert.equal(tx.inputs[0].address, PARTICIPANTS.custodian.address);
      assert.equal(tx.inputs[0].value, '3000');
      assert.equal(tx.outputs[0].value, '3000');
      assert.equal(tx.outputs[0].address, PARTICIPANTS.custodian.address);
      assert.deepStrictEqual(txJson.raw_data.contract, VOTE_WITNESS_CONTRACT);
    });

    it('an unsigned transaction from a string and from a JSON', async () => {
      const timestamp = Date.now();
      const txBuilder = initTxBuilder();
      txBuilder.timestamp(timestamp);
      txBuilder.expiration(timestamp + 40000);
      const tx = await txBuilder.build();

      const txBuilder2 = getBuilder('ttrx').from(tx.toBroadcastFormat());
      txBuilder2.sign({ key: PARTICIPANTS.custodian.pk });
      const tx2 = await txBuilder2.build();

      const txBuilder3 = getBuilder('ttrx').from(tx.toJson());
      txBuilder3.sign({ key: PARTICIPANTS.custodian.pk });
      const tx3 = await txBuilder3.build();

      assert.deepStrictEqual(tx2, tx3);
    });

    it('an unsigned transaction with extended duration', async () => {
      const timestamp = Date.now();
      const expiration = timestamp + EXPIRATION;
      const extension = 60000;
      const txBuilder = initTxBuilder();
      txBuilder.timestamp(timestamp);
      txBuilder.expiration(expiration);
      const tx = await txBuilder.build();

      const txBuilder2 = getBuilder('ttrx').from(tx.toBroadcastFormat());
      txBuilder2.extendValidTo(extension);
      txBuilder2.sign({ key: PARTICIPANTS.custodian.pk });
      const tx2 = await txBuilder2.build();

      assert.equal(tx2.inputs.length, 1);
      assert.equal(tx2.inputs[0].address, PARTICIPANTS.custodian.address);
      assert.equal(tx2.inputs[0].value, '3000');
      assert.equal(tx2.outputs[0].value, '3000');
      assert.equal(tx2.outputs[0].address, PARTICIPANTS.custodian.address);
      const txJson = tx2.toJson();
      assert.equal(txJson.raw_data.expiration, expiration + extension);
    });

    it('a transaction signed multiple times', async () => {
      const timestamp = Date.now();
      const txBuilder = initTxBuilder();
      txBuilder.timestamp(timestamp);
      txBuilder.expiration(timestamp + EXPIRATION);
      const tx = await txBuilder.build();
      let txJson = tx.toJson();
      let rawData = txJson.raw_data;
      assert.deepStrictEqual(rawData.contract, VOTE_WITNESS_CONTRACT);
      assert.equal(txJson.signature.length, 0);

      const txBuilder2 = getBuilder('ttrx').from(tx.toJson());
      txBuilder2.sign({ key: PARTICIPANTS.custodian.pk });
      const tx2 = await txBuilder2.build();
      txJson = tx2.toJson();
      rawData = txJson.raw_data;
      assert.deepStrictEqual(rawData.contract, VOTE_WITNESS_CONTRACT);
      assert.equal(txJson.signature.length, 1);

      const txBuilder3 = getBuilder('ttrx').from(tx2.toJson());
      txBuilder3.sign({ key: PARTICIPANTS.from.pk });
      const tx3 = await txBuilder3.build();
      txJson = tx3.toJson();
      rawData = txJson.raw_data;
      assert.deepStrictEqual(rawData.contract, VOTE_WITNESS_CONTRACT);
      assert.equal(txJson.signature.length, 2);

      const txBuilder4 = getBuilder('ttrx').from(tx3.toJson());
      txBuilder4.sign({ key: PARTICIPANTS.multisig.pk });
      const tx4 = await txBuilder4.build();
      assert.equal(tx4.inputs.length, 1);
      assert.equal(tx4.inputs[0].address, PARTICIPANTS.custodian.address);
      assert.equal(tx4.inputs[0].value, '3000');
      assert.equal(tx4.outputs[0].value, '3000');
      assert.equal(tx4.outputs[0].address, PARTICIPANTS.custodian.address);
      txJson = tx4.toJson();
      rawData = txJson.raw_data;
      assert.deepStrictEqual(rawData.contract, VOTE_WITNESS_CONTRACT);
      assert.equal(txJson.signature.length, 3);
      assert.equal(rawData.expiration, timestamp + EXPIRATION);
      assert.equal(rawData.timestamp, timestamp);
    });
  });

  describe('should validate', () => {
    it('a valid expiration', async () => {
      const now = Date.now();
      const expiration = now + EXPIRATION;
      const txBuilder = initTxBuilder();
      txBuilder.timestamp(now);
      txBuilder.expiration(expiration + 1000);
      txBuilder.expiration(expiration);
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      assert.equal(txJson.raw_data.expiration, expiration);
    });

    it('an expiration greater than one day', async () => {
      const now = Date.now();
      const txBuilder = initTxBuilder();
      txBuilder.timestamp(now);
      assert.throws(
        () => {
          txBuilder.expiration(now + 31536000001);
        },
        (e: any) => e.message === 'Expiration must not be greater than one day'
      );
    });

    it('an expiration less than the current date', async () => {
      const now = Date.now();
      const txBuilder = initTxBuilder();
      txBuilder.timestamp(now - 2000);
      assert.throws(
        () => {
          txBuilder.expiration(now - 1000);
        },
        (e: any) => e.message === 'Expiration must be greater than current time'
      );
    });

    it('an expiration less than the timestamp', async () => {
      const now = Date.now();
      const txBuilder = initTxBuilder();
      txBuilder.timestamp(now + 2000);
      assert.throws(
        () => {
          txBuilder.expiration(now + 1000);
        },
        (e: any) => e.message === 'Expiration must be greater than timestamp'
      );
    });

    it('an expiration set after build', async () => {
      const now = Date.now();
      const expiration = now + EXPIRATION;
      const txBuilder = initTxBuilder();
      await txBuilder.build();
      assert.throws(
        () => {
          txBuilder.expiration(expiration);
        },
        (e: any) => e.message === 'Expiration is already set, it can only be extended'
      );
    });

    it('an expiration set after deserializing', async () => {
      const now = Date.now();
      const expiration = now + EXPIRATION;
      const txBuilder = initTxBuilder();
      const tx = await txBuilder.build();
      const txBuilder2 = getBuilder('ttrx').from(tx.toBroadcastFormat());
      assert.throws(
        () => {
          txBuilder2.expiration(expiration);
        },
        (e: any) => e.message === 'Expiration is already set, it can only be extended'
      );
    });

    it('an extension without a set expiration', async () => {
      const txBuilder = initTxBuilder();
      assert.throws(
        () => {
          txBuilder.extendValidTo(20000);
        },
        (e: any) => e.message === 'There is not expiration to extend'
      );
    });

    it('a zero millisecond extension', async () => {
      const txBuilder = initTxBuilder();
      const expiration = Date.now() + EXPIRATION;
      txBuilder.expiration(expiration);
      const tx = await txBuilder.build();

      const txBuilder2 = getBuilder('ttrx').from(tx.toBroadcastFormat());
      assert.throws(
        () => {
          txBuilder2.extendValidTo(0);
        },
        (e: any) => e.message === 'Value cannot be below zero'
      );
    });

    it('an extension grater than one year', async () => {
      const txBuilder = initTxBuilder();
      const expiration = Date.now() + EXPIRATION;
      txBuilder.expiration(expiration);
      const tx = await txBuilder.build();

      const txBuilder2 = getBuilder('ttrx').from(tx.toBroadcastFormat());
      assert.throws(
        () => {
          txBuilder2.extendValidTo(31536000001);
        },
        (e: any) => e.message === 'The expiration cannot be extended more than one year'
      );
    });

    it('an extension after signing', async () => {
      const txBuilder = initTxBuilder();
      txBuilder.sign({ key: PARTICIPANTS.custodian.pk });
      const tx = await txBuilder.build();

      const txBuilder2 = getBuilder('ttrx').from(tx.toBroadcastFormat());
      assert.throws(
        () => {
          txBuilder2.extendValidTo(20000);
        },
        (e: any) => e.message === 'Cannot extend a signed transaction'
      );
    });

    it('valid votes', async () => {
      const builder = (getBuilder('ttrx') as WrappedBuilder).getVoteWitnessTxBuilder();
      builder
        .source({ address: PARTICIPANTS.custodian.address })
        .block({ number: BLOCK_NUMBER, hash: BLOCK_HASH })
        .setVotes(voteArray);

      assert.doesNotReject(() => {
        return builder.build();
      });
    });

    it('invalid vote count', async () => {
      const builder = (getBuilder('ttrx') as WrappedBuilder).getVoteWitnessTxBuilder();
      const invalidVoteArray = [
        {
          vote_address: 'TXyZjVcYurrbE43b2MfMtN34uA3tJL85zy',
          vote_count: -1,
        },
        {
          vote_address: 'TUtzEvZRqVoNr4ifVyGTnVcyDUpWsrXkJ3',
          vote_count: 2000,
        },
      ];
      builder.source({ address: PARTICIPANTS.custodian.address }).block({ number: BLOCK_NUMBER, hash: BLOCK_HASH });

      assert.throws(() => builder.setVotes(invalidVoteArray), new Error('Invalid vote count'));
    });

    it('invalid vote address', async () => {
      const builder = (getBuilder('ttrx') as WrappedBuilder).getVoteWitnessTxBuilder();
      const invalidAddress = 'abc';
      const invalidVoteArray = [
        {
          vote_address: invalidAddress,
          vote_count: 1000,
        },
        {
          vote_address: 'TUtzEvZRqVoNr4ifVyGTnVcyDUpWsrXkJ3',
          vote_count: 2000,
        },
      ];
      builder.source({ address: PARTICIPANTS.custodian.address }).block({ number: BLOCK_NUMBER, hash: BLOCK_HASH });

      assert.throws(
        () => builder.setVotes(invalidVoteArray),
        new Error(`${invalidAddress} is not a valid base58 address.`)
      );
    });

    it('empty vote object', async () => {
      const builder = (getBuilder('ttrx') as WrappedBuilder).getVoteWitnessTxBuilder();
      const invalidVoteArray = [];
      builder.source({ address: PARTICIPANTS.custodian.address }).block({ number: BLOCK_NUMBER, hash: BLOCK_HASH });

      assert.throws(() => builder.setVotes(invalidVoteArray), new Error('Votes array is missing or empty'));
    });

    it('transaction mandatory fields', async () => {
      const txBuilder = (getBuilder('ttrx') as WrappedBuilder).getVoteWitnessTxBuilder();

      await assert.rejects(txBuilder.build(), {
        message: 'Missing parameter: source',
      });

      txBuilder.source({ address: PARTICIPANTS.custodian.address });
      await assert.rejects(txBuilder.build(), {
        message: 'Missing block reference information',
      });

      txBuilder.block({ number: BLOCK_NUMBER, hash: BLOCK_HASH });
      await assert.rejects(txBuilder.build(), {
        message: 'Missing or empty votes array',
      });

      txBuilder.setVotes(voteArray);
      assert.doesNotReject(() => {
        return txBuilder.build();
      });
    });
  });
});
