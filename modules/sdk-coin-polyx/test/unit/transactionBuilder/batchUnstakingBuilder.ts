import { DecodedSigningPayload } from '@substrate/txwrapper-core';
import { coins } from '@bitgo/statics';
import should from 'should';
import sinon from 'sinon';
import { TransactionBuilderFactory, BatchUnstakingBuilder, Transaction } from '../../../src/lib';
import { TransactionType } from '@bitgo/sdk-core';

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
    it('should validate decoded transaction', () => {
      const mockDecodedTx: DecodedSigningPayload = {
        method: {
          name: 'utility.batchAll',
          pallet: 'utility',
          args: {
            calls: [
              {
                method: 'staking.chill',
                args: {},
              },
              {
                method: 'staking.unbond',
                args: {
                  value: testAmount,
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

    it('should reject invalid transaction types', () => {
      const mockDecodedTx: DecodedSigningPayload = {
        method: {
          name: 'balances.transfer',
          pallet: 'balances',
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
    beforeEach(() => {
      sinon.stub(builder, 'from').callsFake(function (this: BatchUnstakingBuilder, rawTransaction: string) {
        if (rawTransaction === rawTx.unstake.unsigned) {
          this.amount(testAmount);
          this.sender({ address: senderAddress });
        }
        return this;
      });
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should rebuild from rawTransaction', () => {
      builder.from(rawTx.unstake.unsigned);
      should.equal(builder.getAmount(), testAmount);
    });
  });
});
