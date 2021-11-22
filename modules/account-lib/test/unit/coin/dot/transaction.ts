import { coins } from '@bitgo/statics';
import should from 'should';
import { KeyPair, Transaction, TransferBuilder } from '../../../../src/coin/dot';
import * as DotResources from '../../../resources/dot';
import { buildTestConfig } from './transactionBuilder/base';

describe('Dot Transaction', () => {
  let tx: Transaction;

  beforeEach(() => {
    const config = buildTestConfig();
    tx = new Transaction(config);
  });

  describe('empty transaction', () => {
    it('should throw empty transaction', () => {
      should.throws(() => tx.toJson(), 'Empty transaction');
      should.throws(() => tx.toBroadcastFormat(), 'Empty transaction');
    });

    it('should not sign', async () => {
      try {
        await tx.sign(new KeyPair({ prv: DotResources.accounts.account1.secretKey }));
      } catch (e) {
        should.equal(e.message, 'No transaction data to sign');
      }
    });
  });

  describe('sign transaction', () => {
    it('cannot sign - wrong account secret', () => {
      tx.sender(DotResources.accounts.account1.address);
      should.deepEqual(tx.canSign({ key: DotResources.accounts.account2.secretKey }), false);
    });

    it('can sign', () => {
      tx.sender(DotResources.accounts.account2.address);
      should.deepEqual(tx.canSign({ key: DotResources.accounts.account2.secretKey }), true);
    });
  });

  describe('should build from raw unsigned tx', async () => {
    it('Transaction size validation', async () => {
      const builder = new TransferBuilder(coins.get('dot'));
      builder.from(DotResources.rawTx.transfer.unsigned);
      builder
        .validity({ firstValid: 3933 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sender({ address: DotResources.accounts.account1.address });
      const tx = (await builder.build()) as Transaction;
      should.deepEqual(tx.transactionSize(), DotResources.rawTx.transfer.unsigned.length / 2);
    });
  });
});
