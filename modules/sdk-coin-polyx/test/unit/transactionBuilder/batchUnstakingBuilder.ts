import { DecodedSigningPayload } from '@substrate/txwrapper-core';
import { decode } from '@substrate/txwrapper-polkadot';
import { coins } from '@bitgo/statics';
import should from 'should';
import sinon from 'sinon';
import { TransactionBuilderFactory, BatchUnstakingBuilder, Transaction } from '../../../src/lib';
import { TransactionType } from '@bitgo/sdk-core';
import { BatchArgs } from '../../../src/lib/iface';
import utils from '../../../src/lib/utils';

import { accounts, rawTx } from '../../resources';

function createMockTransaction(txData: string): Partial<Transaction> {
  return {
    id: '123',
    type: TransactionType.Batch,
    toBroadcastFormat: () => txData,
    inputs: [],
    outputs: [],
    signature: ['mock-signature'],
    toJson: () => ({
      id: '123',
      type: 'Batch',
      sender: accounts.account1.address,
      referenceBlock: '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d',
      blockNumber: 100,
      genesisHash: '0x',
      nonce: 1,
      tip: 0,
      specVersion: 1,
      transactionVersion: 1,
      chainName: 'Polymesh',
      inputs: [],
      outputs: [],
    }),
  };
}

describe('Polyx BatchUnstaking Builder', function () {
  let builder: BatchUnstakingBuilder;
  const factory = new TransactionBuilderFactory(coins.get('tpolyx'));

  const senderAddress = accounts.account1.address;
  const testAmount = '10000';

  beforeEach(() => {
    builder = factory.getBatchUnstakingBuilder();
  });

  describe('setter validation', () => {
    it('should validate unstaking amount', () => {
      const spy = sinon.spy(builder, 'validateValue');
      should.throws(() => builder.amount('-1'), /Value cannot be less than zero/);
      should.doesNotThrow(() => builder.amount('1000'));
      sinon.assert.calledTwice(spy);
    });
  });

  describe('Build and Sign', function () {
    it('should build a batch unstaking transaction', async () => {
      builder
        .amount(testAmount)
        .sender({ address: senderAddress })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 100 });

      const mockTx = createMockTransaction(rawTx.unstake.unsigned);
      sinon.stub(builder, 'build').resolves(mockTx as Transaction);

      const tx = await builder.build();
      should.exist(tx);

      should.equal(builder.getAmount(), testAmount);
    });
  });

  describe('Transaction Validation', function () {
    it('should build, decode, and validate a real batch unstaking transaction', () => {
      // Build the transaction with real parameters
      builder
        .amount(testAmount)
        .sender({ address: senderAddress })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 100 });

      // Set up material for decoding
      const material = utils.getMaterial(coins.get('tpolyx').network.type);
      builder.material(material);

      // Build the actual unsigned transaction
      const unsignedTx = builder['buildTransaction']();
      const registry = builder['_registry'];

      // Decode the actual built transaction
      const decodedTx = decode(unsignedTx, {
        metadataRpc: material.metadata,
        registry: registry,
      });

      // Validate the decoded transaction structure
      should.equal(decodedTx.method.name, 'batchAll');
      should.equal(decodedTx.method.pallet, 'utility');

      const batchArgs = decodedTx.method.args as unknown as BatchArgs;
      should.exist(batchArgs.calls);
      should.equal(batchArgs.calls.length, 2);

      // Validate first call is chill
      const firstCall = batchArgs.calls[0];
      const firstCallMethod = utils.decodeMethodName(firstCall, registry);
      should.equal(firstCallMethod, 'chill');

      // Validate second call is unbond
      const secondCall = batchArgs.calls[1];
      const secondCallMethod = utils.decodeMethodName(secondCall, registry);
      should.equal(secondCallMethod, 'unbond');

      const unbondArgs = secondCall.args as { value: string };
      should.equal(unbondArgs.value, testAmount);

      // Now validate using the builder's validation method
      should.doesNotThrow(() => {
        builder.validateDecodedTransaction(decodedTx);
      });
    });

    it('should reject invalid transaction types', () => {
      const mockDecodedTx: DecodedSigningPayload = {
        method: {
          name: 'transfer',
          pallet: 'balances',
          args: {},
        },
      } as unknown as DecodedSigningPayload;

      should.throws(() => {
        builder.validateDecodedTransaction(mockDecodedTx);
      }, /Invalid transaction type/);
    });

    it('should validate amount is positive', () => {
      builder.amount(testAmount);
      should.doesNotThrow(() => {
        builder.testValidateFields();
      });

      should.throws(() => {
        builder.amount('-10');
        builder.testValidateFields();
      }, /Value cannot be less than zero/);
    });
  });

  describe('From Raw Transaction', function () {
    it('should rebuild from real batch unstaking transaction', async () => {
      // First build a transaction to get a real raw transaction
      const originalBuilder = factory.getBatchUnstakingBuilder();
      originalBuilder
        .amount(testAmount)
        .sender({ address: senderAddress })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 100 });

      // Set up material
      const material = utils.getMaterial(coins.get('tpolyx').network.type);
      originalBuilder.material(material);

      // Build the transaction and get the serialized hex
      const tx = await originalBuilder.build();
      const rawTxHex = tx.toBroadcastFormat();

      // Create a new builder and reconstruct from the transaction hex
      const newBuilder = factory.getBatchUnstakingBuilder();
      newBuilder.material(material);
      newBuilder.from(rawTxHex);

      // Verify the reconstructed builder has the same parameters
      should.equal(newBuilder.getAmount(), testAmount);
    });
  });
});
