import should from 'should';
import { coins } from '@bitgo/statics';
import * as XrpResources from '../../../resources/xrp/xrp';
import { Transaction } from '../../../../src/coin/xrp/transaction';
import { KeyPair } from '../../../../src/coin/xrp';

describe('XRP Transaction', () => {
  let tx: Transaction;

  beforeEach(() => {
    const config = coins.get('xrp');
    tx = new Transaction(config);
  });

  describe('empty transaction', () => {
    it('should throw empty transaction', () => {
      should.throws(() => tx.toJson(), 'Empty transaction');
      should.throws(() => tx.toBroadcastFormat(), 'Empty transaction');
    });

    it('should not sign', () => {
      should.throws(() => tx.sign([new KeyPair({ prv: XrpResources.accounts.acc1.prv })]), 'Empty transaction');
      should.throws(() => tx.sign([new KeyPair({ prv: XrpResources.accounts.acc1.prv })]), 'Empty transaction');
    });
  });

  describe('sign transaction', () => {
    it('cannot sign - invalid key', () => {
      should.throws(() => tx.canSign({ key: 'some' }), 'Unsupported private key');
    });

    it('cannot sign - wrong account private key', () => {
      tx.sender(XrpResources.accounts.acc1.address);
      should.deepEqual(tx.canSign({ key: XrpResources.accounts.acc2.prv }), false);
    });

    it('can sign', () => {
      tx.sender(XrpResources.accounts.acc1.address);
      should.deepEqual(tx.canSign({ key: XrpResources.accounts.acc1.prv }), true);
    });
  });
});
