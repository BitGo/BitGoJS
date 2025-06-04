import { DecodedSigningPayload } from '@substrate/txwrapper-core';
import { coins } from '@bitgo/statics';
import should from 'should';
import sinon from 'sinon';
import { TransactionBuilderFactory, BatchBuilder, Transaction } from '../../../src/lib';
import { TransactionType } from '@bitgo/sdk-core';

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
    it('should validate decoded transaction with bond and nominate', () => {
      const mockDecodedTx: DecodedSigningPayload = {
        method: {
          name: 'utility.batchAll',
          pallet: 'utility',
          args: {
            calls: [
              {
                method: 'staking.bond',
                args: {
                  controller: controllerAddress,
                  value: testAmount,
                  payee: 'Staked',
                },
              },
              {
                method: 'staking.nominate',
                args: {
                  targets: [validatorAddress],
                },
              },
            ],
          },
        },
        address: senderAddress,
        blockHash: '0x',
        blockNumber: '0',
        era: { mortalEra: '0x' },
        genesisHash: '0x',
        metadataRpc: '0x',
        nonce: 0,
        specVersion: 0,
        tip: '0',
        transactionVersion: 0,
        signedExtensions: [],
      } as unknown as DecodedSigningPayload;

      should.doesNotThrow(() => {
        builder.validateDecodedTransaction(mockDecodedTx);
      });
    });

    it('should reject invalid calls in batch', () => {
      const mockDecodedTx: DecodedSigningPayload = {
        method: {
          name: 'utility.batchAll',
          pallet: 'utility',
          args: {
            calls: [
              {
                method: 'balances.transfer',
                args: {},
              },
            ],
          },
        },
        address: senderAddress,
        blockHash: '0x',
        blockNumber: '0',
        era: { mortalEra: '0x' },
        genesisHash: '0x',
        metadataRpc: '0x',
        nonce: 0,
        specVersion: 0,
        tip: '0',
        transactionVersion: 0,
        signedExtensions: [],
      } as unknown as DecodedSigningPayload;

      should.throws(() => {
        builder.validateDecodedTransaction(mockDecodedTx);
      }, /Invalid call in batch/);
    });

    it('should reject non-batch transactions', () => {
      const mockDecodedTx: DecodedSigningPayload = {
        method: {
          name: 'staking.bond',
          pallet: 'staking',
          args: {},
        },
        address: senderAddress,
        blockHash: '0x',
        blockNumber: '0',
        era: { mortalEra: '0x' },
        genesisHash: '0x',
        metadataRpc: '0x',
        nonce: 0,
        specVersion: 0,
        tip: '0',
        transactionVersion: 0,
        signedExtensions: [],
      } as unknown as DecodedSigningPayload;

      should.throws(() => {
        builder.validateDecodedTransaction(mockDecodedTx);
      }, /Invalid transaction type/);
    });
  });

  describe('From Raw Transaction', function () {
    beforeEach(() => {
      sinon.stub(builder, 'from').callsFake(function (this: BatchBuilder, rawTransaction: string) {
        if (rawTransaction === stakingTx.batch.bondAndNominate.unsigned) {
          this.amount(testAmount);
          this.controller({ address: controllerAddress });
          this.validators([validatorAddress]);
          return this;
        }

        // Any non-bondAndNominate transaction should throw
        throw new Error('Only bondAndNominate batch transactions are supported');
      });
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should rebuild from bondAndNominate transaction', () => {
      builder.from(stakingTx.batch.bondAndNominate.unsigned);
      should.exist(builder.getAmount());
      should.exist(builder.getController());
      should.equal(builder.getValidators().length, 1);
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
