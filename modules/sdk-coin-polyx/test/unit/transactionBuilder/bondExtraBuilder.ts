import { DecodedSigningPayload } from '@substrate/txwrapper-core';
import { decode } from '@substrate/txwrapper-polkadot';
import { coins } from '@bitgo/statics';
import should from 'should';
import sinon from 'sinon';
import { TransactionBuilderFactory, BondExtraBuilder, Transaction } from '../../../src/lib';
import { TransactionType } from '@bitgo/sdk-core';
import utils from '../../../src/lib/utils';

import { accounts, stakingTx } from '../../resources';

function createMockTransaction(txData: string): Partial<Transaction> {
  return {
    id: '123',
    type: TransactionType.StakingActivate,
    toBroadcastFormat: () => txData,
    inputs: [],
    outputs: [],
    signature: ['mock-signature'],
    toJson: () => ({
      id: '123',
      type: 'StakingActivate',
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

describe('Polyx BondExtra Builder', function () {
  let builder: BondExtraBuilder;
  const factory = new TransactionBuilderFactory(coins.get('tpolyx'));

  const senderAddress = accounts.account1.address;
  const testAmount = '10000';

  beforeEach(() => {
    builder = factory.getBondExtraBuilder();
  });

  describe('setter validation', () => {
    it('should validate staking amount', () => {
      const spy = sinon.spy(builder, 'validateValue');
      should.throws(() => builder.amount('-1'), /Value cannot be less than zero/);
      should.doesNotThrow(() => builder.amount('1000'));
      sinon.assert.calledTwice(spy);
    });
  });

  describe('Build and Sign', function () {
    it('should build a bondExtra transaction', async () => {
      builder
        .amount(testAmount)
        .sender({ address: senderAddress })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 100 });

      const mockTx = createMockTransaction(stakingTx.bondExtra.unsigned);
      sinon.stub(builder, 'build').resolves(mockTx as Transaction);

      const tx = await builder.build();
      should.exist(tx);

      should.equal(builder.getAmount(), testAmount);
    });
  });

  describe('Transaction Validation', function () {
    it('should build, decode, and validate a real bondExtra transaction', () => {
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
      should.equal(decodedTx.method.name, 'bondExtra');
      should.equal(decodedTx.method.pallet, 'staking');

      const bondExtraArgs = decodedTx.method.args as { maxAdditional: string };
      should.equal(bondExtraArgs.maxAdditional, testAmount);

      // validate using the builder's validation method
      should.doesNotThrow(() => {
        builder.validateDecodedTransaction(decodedTx);
      });
    });

    it('should reject non-bondExtra transactions', () => {
      const mockDecodedTx: DecodedSigningPayload = {
        method: {
          name: 'bond',
          pallet: 'staking',
          args: {},
        },
      } as unknown as DecodedSigningPayload;

      should.throws(() => {
        builder.validateDecodedTransaction(mockDecodedTx);
      }, /Invalid transaction type/);
    });

    it('should validate amount is positive', () => {
      should.doesNotThrow(() => {
        builder.validateAmount('2000');
      });

      should.doesNotThrow(() => {
        builder.validateAmount('500');
      });

      should.doesNotThrow(() => {
        builder.validateAmount('1');
      });

      should.doesNotThrow(() => {
        builder.validateAmount('0.0001');
      });

      should.throws(() => {
        builder.validateAmount('0');
      }, /must be a positive number/);

      should.throws(() => {
        builder.validateAmount('-10');
      }, /must be a positive number/);
    });
  });

  describe('From Raw Transaction', function () {
    it('should rebuild from real bondExtra transaction', async () => {
      // First build a transaction to get a real raw transaction
      const originalBuilder = factory.getBondExtraBuilder();
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
      const newBuilder = factory.getBondExtraBuilder();
      newBuilder.material(material);
      newBuilder.from(rawTxHex);

      // Verify the reconstructed builder has the same parameters
      should.equal(newBuilder.getAmount(), testAmount);
    });
  });
});
