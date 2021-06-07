import should from 'should';
import { coins } from '@bitgo/statics';
import * as AlgoResources from '../../../resources/algo';
import { Transaction } from '../../../../src/coin/algo/transaction';
import { KeyPair } from '../../../../src/coin/algo';

describe('Algo Transaction', () => {
  let tx: Transaction;

  beforeEach(() => {
    const config = coins.get('algo');
    tx = new Transaction(config);
  });

  describe('empty transaction', () => {
    it('should throw empty transaction', () => {
      should.throws(() => tx.toJson(), 'Empty transaction');
      should.throws(() => tx.toBroadcastFormat(), 'Empty transaction');
    });

    it('should not sign', () => {
      should.throws(
        () => tx.sign([new KeyPair({ prv: AlgoResources.accounts.default.secretKey.toString('hex') })]),
        'Empty transaction',
      );
      tx.setNumberOfRequiredSigners(2);
      should.throws(
        () => tx.sign([new KeyPair({ prv: AlgoResources.accounts.default.secretKey.toString('hex') })]),
        'Empty transaction',
      );
    });
  });

  describe('sign transaction', () => {
    it('cannot sign - no signer required', () => {
      should.deepEqual(tx.canSign({ key: 'some' }), false);
    });

    it('cannot sign - wrong account secret', () => {
      tx.setNumberOfRequiredSigners(1);
      tx.sender(AlgoResources.accounts.account1.address);
      should.deepEqual(tx.canSign({ key: AlgoResources.accounts.account2.secretKey.toString('hex') }), false);
    });

    it('can sign', () => {
      tx.setNumberOfRequiredSigners(1);
      tx.sender(AlgoResources.accounts.account2.address);
      should.deepEqual(tx.canSign({ key: AlgoResources.accounts.account2.secretKey.toString('hex') }), true);
    });
  });
});
