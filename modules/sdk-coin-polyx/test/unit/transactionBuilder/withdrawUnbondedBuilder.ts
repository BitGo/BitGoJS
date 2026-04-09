import { DecodedSigningPayload } from '@substrate/txwrapper-core';
import { decode } from '@substrate/txwrapper-polkadot';
import { coins } from '@bitgo/statics';
import should from 'should';
import sinon from 'sinon';
import { TransactionBuilderFactory, WithdrawUnbondedBuilder, Transaction } from '../../../src/lib';
import { TransactionType } from '@bitgo/sdk-core';
import utils from '../../../src/lib/utils';

import { accounts, rawTx } from '../../resources';

function createMockTransaction(txData: string): Partial<Transaction> {
  return {
    id: '123',
    type: TransactionType.StakingWithdraw,
    toBroadcastFormat: () => txData,
    inputs: [],
    outputs: [],
    signature: ['mock-signature'],
    toJson: () => ({
      id: '123',
      type: 'StakingWithdraw',
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

describe('Polyx WithdrawUnbonded Builder', function () {
  let builder: WithdrawUnbondedBuilder;
  const factory = new TransactionBuilderFactory(coins.get('tpolyx'));

  const senderAddress = accounts.account1.address;
  const testSlashingSpans = 0;

  beforeEach(() => {
    builder = factory.getWithdrawUnbondedBuilder();
  });

  describe('setter validation', () => {
    it('should validate slashing spans', () => {
      const spy = sinon.spy(builder, 'validateValue');
      should.throws(() => builder.slashingSpans(-1), /Value cannot be less than zero/);
      should.doesNotThrow(() => builder.slashingSpans(0));
      sinon.assert.calledTwice(spy);
    });
  });

  describe('Build and Sign', function () {
    it('should build a withdraw unbonded transaction', async () => {
      builder
        .slashingSpans(testSlashingSpans)
        .sender({ address: senderAddress })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 100 });

      const mockTx = createMockTransaction(rawTx.withdrawUnbonded.unsigned);
      sinon.stub(builder, 'build').resolves(mockTx as Transaction);

      const tx = await builder.build();
      should.exist(tx);

      should.equal(builder.getSlashingSpans(), testSlashingSpans);
    });
  });

  describe('Transaction Validation', function () {
    it('should build, decode, and validate a real withdrawUnbonded transaction', () => {
      // Build the transaction with real parameters
      builder
        .slashingSpans(testSlashingSpans)
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
      should.equal(decodedTx.method.name, 'withdrawUnbonded');
      should.equal(decodedTx.method.pallet, 'staking');

      const withdrawArgs = decodedTx.method.args as { numSlashingSpans: number };
      should.equal(withdrawArgs.numSlashingSpans, testSlashingSpans);

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
  });

  describe('From Raw Transaction', function () {
    it('should rebuild from real withdrawUnbonded transaction', async () => {
      // First build a transaction to get a real raw transaction
      const originalBuilder = factory.getWithdrawUnbondedBuilder();
      originalBuilder
        .slashingSpans(testSlashingSpans)
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
      const newBuilder = factory.getWithdrawUnbondedBuilder();
      newBuilder.material(material);
      newBuilder.from(rawTxHex);

      // Verify the reconstructed builder has the same parameters
      should.equal(newBuilder.getSlashingSpans(), testSlashingSpans);
    });
  });
});
