import assert from 'assert';
import { TransactionType } from '@bitgo/sdk-core';
import { describe, it } from 'node:test';
import {
  PARTICIPANTS,
  BLOCK_HASH,
  BLOCK_NUMBER,
  EXPIRATION,
  RESOURCE_ENERGY,
  RESOURCE_BANDWIDTH,
  FROZEN_BALANCE,
  FREEZE_BALANCE_V2_CONTRACT,
} from '../../resources';
import { getBuilder } from '../../../src/lib/builder';
import { Transaction, WrappedBuilder } from '../../../src';
import { decodeTransaction } from '../../../src/lib/utils';

describe('Tron FreezeBalanceV2 builder', function () {
  const initTxBuilder = () => {
    const builder = (getBuilder('ttrx') as WrappedBuilder).getFreezeBalanceV2TxBuilder();
    builder
      .source({ address: PARTICIPANTS.custodian.address })
      .block({ number: BLOCK_NUMBER, hash: BLOCK_HASH })
      .setFrozenBalance(FROZEN_BALANCE)
      .setResource(RESOURCE_ENERGY);

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
      assert.equal(tx.type, TransactionType.StakingActivate);
      assert.equal(tx.inputs.length, 1);
      assert.equal(tx.inputs[0].address, PARTICIPANTS.custodian.address);
      assert.equal(tx.inputs[0].value, '1000000');
      assert.equal(tx.outputs[0].value, '1000000');
      assert.equal(tx.outputs[0].address, PARTICIPANTS.custodian.address);
      assert.deepStrictEqual(txJson.raw_data.contract, FREEZE_BALANCE_V2_CONTRACT);
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
      assert.equal(tx2.inputs[0].value, '1000000');
      assert.equal(tx2.outputs[0].value, '1000000');
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
      assert.deepStrictEqual(rawData.contract, FREEZE_BALANCE_V2_CONTRACT);
      assert.equal(txJson.signature.length, 0);

      const txBuilder2 = getBuilder('ttrx').from(tx.toJson());
      txBuilder2.sign({ key: PARTICIPANTS.custodian.pk });
      const tx2 = await txBuilder2.build();
      txJson = tx2.toJson();
      rawData = txJson.raw_data;
      assert.deepStrictEqual(rawData.contract, FREEZE_BALANCE_V2_CONTRACT);
      assert.equal(txJson.signature.length, 1);

      const txBuilder3 = getBuilder('ttrx').from(tx2.toJson());
      txBuilder3.sign({ key: PARTICIPANTS.from.pk });
      const tx3 = await txBuilder3.build();
      txJson = tx3.toJson();
      rawData = txJson.raw_data;
      assert.deepStrictEqual(rawData.contract, FREEZE_BALANCE_V2_CONTRACT);
      assert.equal(txJson.signature.length, 2);

      const txBuilder4 = getBuilder('ttrx').from(tx3.toJson());
      txBuilder4.sign({ key: PARTICIPANTS.multisig.pk });
      const tx4 = await txBuilder4.build();
      assert.equal(tx4.inputs.length, 1);
      assert.equal(tx4.inputs[0].address, PARTICIPANTS.custodian.address);
      assert.equal(tx4.inputs[0].value, '1000000');
      assert.equal(tx4.outputs[0].value, '1000000');
      assert.equal(tx4.outputs[0].address, PARTICIPANTS.custodian.address);
      txJson = tx4.toJson();
      rawData = txJson.raw_data;
      assert.deepStrictEqual(rawData.contract, FREEZE_BALANCE_V2_CONTRACT);
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

    it('an expiration greater than one year', async () => {
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

    it('valid resource: ENERGY', async () => {
      const builder = (getBuilder('ttrx') as WrappedBuilder).getFreezeBalanceV2TxBuilder();
      builder
        .source({ address: PARTICIPANTS.custodian.address })
        .block({ number: BLOCK_NUMBER, hash: BLOCK_HASH })
        .setFrozenBalance(FROZEN_BALANCE);
      builder.setResource('ENERGY');
      assert.doesNotReject(() => {
        return builder.build();
      });
    });

    it('valid resource: BANDWIDTH', async () => {
      const builder = (getBuilder('ttrx') as WrappedBuilder).getFreezeBalanceV2TxBuilder();
      builder
        .source({ address: PARTICIPANTS.custodian.address })
        .block({ number: BLOCK_NUMBER, hash: BLOCK_HASH })
        .setFrozenBalance(FROZEN_BALANCE);
      builder.setResource('BANDWIDTH');
      assert.doesNotReject(() => {
        return builder.build();
      });
    });

    it('invalid resource', async () => {
      const builder = (getBuilder('ttrx') as WrappedBuilder).getFreezeBalanceV2TxBuilder();
      const invalidResource = 'INVALID';
      builder
        .source({ address: PARTICIPANTS.custodian.address })
        .block({ number: BLOCK_NUMBER, hash: BLOCK_HASH })
        .setFrozenBalance(FROZEN_BALANCE);

      assert.throws(() => builder.setResource(invalidResource), `${invalidResource} is a not valid resource type.`);
    });

    it('transaction mandatory fields', async () => {
      const txBuilder = (getBuilder('ttrx') as WrappedBuilder).getFreezeBalanceV2TxBuilder();

      await assert.rejects(txBuilder.build(), {
        message: 'Missing parameter: frozenBalance',
      });

      txBuilder.setFrozenBalance('1000000');
      await assert.rejects(txBuilder.build(), {
        message: 'Missing parameter: source',
      });

      txBuilder.source({ address: PARTICIPANTS.custodian.address });
      await assert.rejects(txBuilder.build(), {
        message: 'Missing parameter: resource',
      });

      txBuilder.setResource('ENERGY');
      await assert.rejects(txBuilder.build(), {
        message: 'Missing block reference information',
      });

      txBuilder.block({ number: BLOCK_NUMBER, hash: BLOCK_HASH });
      assert.doesNotReject(() => {
        return txBuilder.build();
      });
    });
  });

  describe('decode freeze txns correctly', () => {
    it('should decode a freeze transaction with resource as ENERGY', async () => {
      const rawHex =
        '0a0263562208aeb6dfb8e968626440bc91f6c39c335a5a083612560a34747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e467265657a6542616c616e63655632436f6e7472616374121e0a154160b9ab837fd7153c1baa5e55a16d05d60e21d0d31080e1eb17180170fcd8f3c39c33';
      const decodedTransaction = decodeTransaction(rawHex);

      // Verify transaction has contracts
      assert.ok(decodedTransaction.contract?.length > 0, 'Transaction should have at least one contract');

      const contract = decodedTransaction.contract[0];
      assert.ok(contract, 'contract should exist');

      if (!('parameter' in contract) || !contract.parameter?.value || !('resource' in contract.parameter.value)) {
        throw new Error('Invalid contract format: missing parameter or resource');
      }

      // Verify resource type
      assert.equal(contract.parameter.value.resource, RESOURCE_ENERGY, 'Resource type should be ENERGY');
    });

    it('should decode a freeze transaction with resource as BANDWIDTH', async () => {
      const rawHex =
        '0a028d372208f403372490b5b8e240bbaab7f69b335a5b083612570a34747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e467265657a6542616c616e63655632436f6e7472616374121f0a154160b9ab837fd7153c1baa5e55a16d05d60e21d0d31080cab5ee01180070bbcddbf49b33';
      const decodedTransaction = decodeTransaction(rawHex);

      // Verify transaction has contracts
      assert.ok(decodedTransaction.contract?.length > 0, 'Transaction should have at least one contract');

      const contract = decodedTransaction.contract[0];
      assert.ok(contract, 'contract should exist');

      if (!('parameter' in contract) || !contract.parameter?.value || !('resource' in contract.parameter.value)) {
        throw new Error('Invalid contract format: missing parameter or resource');
      }

      // Verify resource type
      assert.equal(contract.parameter.value.resource, RESOURCE_BANDWIDTH, 'Resource type should be BANDWIDTH');
    });
  });

  describe('BANDWIDTH serialization (protobuf3 compatibility)', () => {
    it('should round-trip BANDWIDTH transactions correctly', async () => {
      // Build a BANDWIDTH transaction
      const builder = (getBuilder('ttrx') as WrappedBuilder).getFreezeBalanceV2TxBuilder();
      builder
        .source({ address: PARTICIPANTS.custodian.address })
        .block({ number: BLOCK_NUMBER, hash: BLOCK_HASH })
        .setFrozenBalance(FROZEN_BALANCE)
        .setResource(RESOURCE_BANDWIDTH);

      const tx = await builder.build();
      const txJson = tx.toJson();

      // Verify the built transaction has BANDWIDTH resource
      assert.equal(
        txJson.raw_data.contract[0].parameter.value.resource,
        RESOURCE_BANDWIDTH,
        'Built transaction should have BANDWIDTH resource'
      );

      // Round-trip: deserialize from broadcast format and rebuild
      const builder2 = getBuilder('ttrx').from(tx.toBroadcastFormat());
      const tx2 = await builder2.build();
      const tx2Json = tx2.toJson();

      // Verify resource is preserved after round-trip
      assert.equal(
        tx2Json.raw_data.contract[0].parameter.value.resource,
        RESOURCE_BANDWIDTH,
        'Resource should be BANDWIDTH after round-trip from broadcast format'
      );

      // Round-trip: deserialize from JSON and rebuild
      const builder3 = getBuilder('ttrx').from(tx.toJson());
      const tx3 = await builder3.build();
      const tx3Json = tx3.toJson();

      // Verify resource is preserved after round-trip from JSON
      assert.equal(
        tx3Json.raw_data.contract[0].parameter.value.resource,
        RESOURCE_BANDWIDTH,
        'Resource should be BANDWIDTH after round-trip from JSON'
      );
    });

    it('should round-trip ENERGY transactions correctly', async () => {
      // Build an ENERGY transaction
      const builder = (getBuilder('ttrx') as WrappedBuilder).getFreezeBalanceV2TxBuilder();
      builder
        .source({ address: PARTICIPANTS.custodian.address })
        .block({ number: BLOCK_NUMBER, hash: BLOCK_HASH })
        .setFrozenBalance(FROZEN_BALANCE)
        .setResource(RESOURCE_ENERGY);

      const tx = await builder.build();
      const txJson = tx.toJson();

      // Verify the built transaction has ENERGY resource
      assert.equal(
        txJson.raw_data.contract[0].parameter.value.resource,
        RESOURCE_ENERGY,
        'Built transaction should have ENERGY resource'
      );

      // Round-trip: deserialize from broadcast format and rebuild
      const builder2 = getBuilder('ttrx').from(tx.toBroadcastFormat());
      const tx2 = await builder2.build();
      const tx2Json = tx2.toJson();

      // Verify resource is preserved after round-trip
      assert.equal(
        tx2Json.raw_data.contract[0].parameter.value.resource,
        RESOURCE_ENERGY,
        'Resource should be ENERGY after round-trip from broadcast format'
      );
    });

    it('should produce consistent transaction IDs for BANDWIDTH transactions', async () => {
      // Build a BANDWIDTH transaction
      const builder = (getBuilder('ttrx') as WrappedBuilder).getFreezeBalanceV2TxBuilder();
      builder
        .source({ address: PARTICIPANTS.custodian.address })
        .block({ number: BLOCK_NUMBER, hash: BLOCK_HASH })
        .setFrozenBalance(FROZEN_BALANCE)
        .setResource(RESOURCE_BANDWIDTH);

      const tx = await builder.build();
      const originalTxId = tx.toJson().txID;

      // Round-trip and verify txID is consistent
      const builder2 = getBuilder('ttrx').from(tx.toBroadcastFormat());
      const tx2 = await builder2.build();
      const roundTripTxId = tx2.toJson().txID;

      assert.equal(originalTxId, roundTripTxId, 'Transaction ID should be consistent after round-trip');
    });

    it('should allow signing BANDWIDTH transactions after round-trip', async () => {
      // Build a BANDWIDTH transaction
      const builder = (getBuilder('ttrx') as WrappedBuilder).getFreezeBalanceV2TxBuilder();
      builder
        .source({ address: PARTICIPANTS.custodian.address })
        .block({ number: BLOCK_NUMBER, hash: BLOCK_HASH })
        .setFrozenBalance(FROZEN_BALANCE)
        .setResource(RESOURCE_BANDWIDTH);

      const tx = await builder.build();

      // Round-trip and sign
      const builder2 = getBuilder('ttrx').from(tx.toBroadcastFormat());
      builder2.sign({ key: PARTICIPANTS.custodian.pk });
      const signedTx = await builder2.build();

      // Verify signature was added
      assert.equal(signedTx.toJson().signature.length, 1, 'Transaction should have one signature');

      // Verify resource is still BANDWIDTH
      assert.equal(
        signedTx.toJson().raw_data.contract[0].parameter.value.resource,
        RESOURCE_BANDWIDTH,
        'Resource should still be BANDWIDTH after signing'
      );
    });
  });
});
