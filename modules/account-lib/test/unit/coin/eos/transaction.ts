import should from 'should';
import { coins } from '@bitgo/statics';
import { Transaction } from '../../../../src/coin/eos/transaction';
import { KeyPair } from '../../../../src/coin/eos';
import * as EosResources from '../../../resources/eos';

describe('Eos Transaction', () => {
  let tx: Transaction;
  beforeEach(() => {
    const config = coins.get('eos');
    tx = new Transaction(config);
  });

  describe('empty transaction', async () => {
    it('should throw empty transaction', async () => {
      should.throws(() => tx.toBroadcastFormat(), 'Empty transaction');
      try {
        await tx.toJson();
      } catch (error) {
        should.equal(error.message, 'Empty transaction');
      }
    });

    it('should not sign', () => {
      should.throws(
        () => tx.sign([new KeyPair({ prv: EosResources.accounts.account1.privateKey })]),
        'Empty transaction',
      );
    });
  });
});
