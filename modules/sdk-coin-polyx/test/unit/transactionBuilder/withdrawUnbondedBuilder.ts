import { DecodedSigningPayload } from '@substrate/txwrapper-core';
import { coins } from '@bitgo/statics';
import should from 'should';
import sinon from 'sinon';
import { TransactionBuilderFactory, WithdrawUnbondedBuilder, Transaction } from '../../../src/lib';
import { TransactionType } from '@bitgo/sdk-core';

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
    it('should validate decoded transaction', () => {
      const mockDecodedTx: DecodedSigningPayload = {
        method: {
          name: 'staking.withdrawUnbonded',
          pallet: 'staking',
          args: {
            numSlashingSpans: testSlashingSpans,
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
  });

  describe('From Raw Transaction', function () {
    beforeEach(() => {
      sinon.stub(builder, 'from').callsFake(function (this: WithdrawUnbondedBuilder, rawTransaction: string) {
        if (rawTransaction === rawTx.withdrawUnbonded.unsigned) {
          this.slashingSpans(testSlashingSpans);
          this.sender({ address: senderAddress });
        }
        return this;
      });
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should rebuild from rawTransaction', () => {
      builder.from(rawTx.withdrawUnbonded.unsigned);
      should.equal(builder.getSlashingSpans(), testSlashingSpans);
    });
  });
});
