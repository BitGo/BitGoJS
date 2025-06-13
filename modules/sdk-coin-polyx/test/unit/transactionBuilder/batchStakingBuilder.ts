import { DecodedSigningPayload } from '@substrate/txwrapper-core';
import { decode } from '@substrate/txwrapper-polkadot';
import { coins } from '@bitgo/statics';
import should from 'should';
import sinon from 'sinon';
import { TransactionBuilderFactory, BatchBuilder, Transaction } from '../../../src/lib';
import { TransactionType } from '@bitgo/sdk-core';
import { BatchArgs, BondArgs, NominateArgs } from '../../../src/lib/iface';
import utils from '../../../src/lib/utils';

import { accounts, stakingTx } from '../../resources';

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

describe('Polyx Batch Builder', function () {
  let builder: BatchBuilder;
  const factory = new TransactionBuilderFactory(coins.get('tpolyx'));

  const senderAddress = accounts.account1.address;
  const controllerAddress = accounts.account2.address;
  const validatorAddress = '5C7kNpSvVr22Z1X6gVAUjfahSJfSpvw4DHNoY7uUHpLfEJZR';
  const testAmount = '10000';

  beforeEach(() => {
    builder = factory.getBatchBuilder();
  });

  describe('setter validation', () => {
    it('should validate staking amount', () => {
      const spy = sinon.spy(builder, 'validateValue');
      should.throws(() => builder.amount('-1'), /Value cannot be less than zero/);
      should.doesNotThrow(() => builder.amount('1000'));
      sinon.assert.calledTwice(spy);
    });

    it('should validate controller address', () => {
      const spy = sinon.spy(builder, 'validateAddress');
      should.throws(() => builder.controller({ address: 'invalid-address' }), /is not a well-formed/);
      should.doesNotThrow(() => builder.controller({ address: controllerAddress }));
      sinon.assert.calledTwice(spy);
    });

    it('should validate validator addresses', () => {
      const spy = sinon.spy(builder, 'validateAddress');
      should.throws(() => builder.validators(['invalid-address']), /is not a well-formed/);
      should.doesNotThrow(() => builder.validators([validatorAddress]));
      sinon.assert.calledTwice(spy);
    });
  });

  describe('Bond and Nominate', function () {
    it('should validate bond and nominate args together', () => {
      builder
        .amount(testAmount)
        .controller({ address: controllerAddress })
        .payee('Staked')
        .validators([validatorAddress]);

      should.doesNotThrow(() => {
        builder.testValidateFields();
      });

      builder = factory.getBatchBuilder();

      builder.amount(testAmount).controller({ address: controllerAddress }).payee('Staked');

      should.throws(() => {
        builder.testValidateFields();
      }, /must include both bond and nominate operations/);

      builder = factory.getBatchBuilder();

      builder.validators([validatorAddress]);

      should.throws(() => {
        builder.testValidateFields();
      }, /must include both bond and nominate operations/);
    });

    it('should build a batch transaction with both bond and nominate', async () => {
      builder
        .amount(testAmount)
        .controller({ address: controllerAddress })
        .payee('Staked')
        .validators([validatorAddress])
        .sender({ address: senderAddress })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 100 });

      const mockTx = createMockTransaction(stakingTx.batch.bondAndNominate.unsigned);
      sinon.stub(builder, 'build').resolves(mockTx as Transaction);

      const tx = await builder.build();
      should.exist(tx);

      should.equal(builder.getAmount(), testAmount);
      should.equal(builder.getController(), controllerAddress);
      should.equal(builder.getPayee(), 'Staked');
      should.deepEqual(builder.getValidators(), [validatorAddress]);
    });
  });

  describe('Transaction Validation', function () {
    it('should build, decode, and validate a real batch staking transaction', () => {
      // Build the transaction with real parameters
      builder
        .amount(testAmount)
        .controller({ address: controllerAddress })
        .payee('Staked')
        .validators([validatorAddress])
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

      // Validate first call is bond
      const firstCall = batchArgs.calls[0];
      const firstCallMethod = utils.decodeMethodName(firstCall, registry);
      should.equal(firstCallMethod, 'bond');

      const bondArgs = firstCall.args as unknown as BondArgs;
      should.equal(bondArgs.value, testAmount);
      // Controller can be either a string or an object with id property
      const controllerValue =
        typeof bondArgs.controller === 'string' ? bondArgs.controller : (bondArgs.controller as { id: string }).id;
      should.equal(controllerValue, controllerAddress);
      // Payee can be either a string or an object with staked property
      const payeeValue =
        typeof bondArgs.payee === 'string'
          ? bondArgs.payee
          : (bondArgs.payee as { staked?: null }).staked !== undefined
          ? 'Staked'
          : bondArgs.payee;
      should.equal(payeeValue, 'Staked');

      // Validate second call is nominate
      const secondCall = batchArgs.calls[1];
      const secondCallMethod = utils.decodeMethodName(secondCall, registry);
      should.equal(secondCallMethod, 'nominate');

      const nominateArgs = secondCall.args as unknown as NominateArgs;
      // Targets can be either strings or objects with id property
      const targetValues = nominateArgs.targets.map((target) =>
        typeof target === 'string' ? target : (target as { id: string }).id
      );
      should.deepEqual(targetValues, [validatorAddress]);

      // Now validate using the builder's validation method
      should.doesNotThrow(() => {
        builder.validateDecodedTransaction(decodedTx);
      });
    });

    it('should reject invalid batch transaction when built', () => {
      // Try to build a batch with only bond (missing nominate)
      builder
        .amount(testAmount)
        .controller({ address: controllerAddress })
        .payee('Staked')
        .sender({ address: senderAddress })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 100 });

      // Set up material
      const material = utils.getMaterial(coins.get('tpolyx').network.type);
      builder.material(material);

      // Should throw when trying to build without validators
      should.throws(() => {
        builder['buildTransaction']();
      }, /must include both bond and nominate operations/);
    });

    it('should reject validation of non-batch method name', () => {
      // Create a mock decoded transaction with wrong method name
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
  });

  describe('From Raw Transaction', function () {
    it('should rebuild from real batch transaction', async () => {
      // First build a transaction to get a real raw transaction
      const originalBuilder = factory.getBatchBuilder();
      originalBuilder
        .amount(testAmount)
        .controller({ address: controllerAddress })
        .payee('Staked')
        .validators([validatorAddress])
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
      const newBuilder = factory.getBatchBuilder();
      newBuilder.material(material);
      newBuilder.from(rawTxHex);

      // Verify the reconstructed builder has the same parameters
      should.equal(newBuilder.getAmount(), testAmount);
      should.equal(newBuilder.getController(), controllerAddress);
      should.equal(newBuilder.getPayee(), 'Staked');
      should.deepEqual(newBuilder.getValidators(), [validatorAddress]);
    });
  });

  describe('should create properly configured transactions', function () {
    it('a batch transaction', async function () {
      builder
        .amount(testAmount)
        .controller({ address: controllerAddress })
        .payee('Staked')
        .validators([validatorAddress])
        .sender({ address: senderAddress })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 100 });

      const mockTx = createMockTransaction(stakingTx.batch.bondAndNominate.unsigned);
      sinon.stub(builder, 'build').resolves(mockTx as Transaction);

      const tx = await builder.build();
      should.exist(tx);
    });

    it('a batch transaction with custom replay protection', async function () {
      builder
        .amount(testAmount)
        .controller({ address: controllerAddress })
        .payee('Staked')
        .validators([validatorAddress])
        .sender({ address: senderAddress })
        .validity({ firstValid: 4000, maxDuration: 100 })
        .referenceBlock('0x249799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754e')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 });

      const mockTx = createMockTransaction('custom-tx-format');
      sinon.stub(builder, 'build').resolves(mockTx as Transaction);

      const tx = await builder.build();
      should.exist(tx);
    });
  });
});
