import { BaseCoin as CoinConfig, coins } from '@bitgo/statics';
import { TransactionJSON } from 'ripple-lib';
import should from 'should';
import sinon, { assert } from 'sinon';
import { AddressValidationError, TransactionBuilder } from '../../../../../src/coin/xrp';
import { Transaction } from '../../../../../src/coin/xrp/transaction';
import { BaseKey } from '../../../../../src/coin/baseCoin/iface';

import * as XrpResources from '../../../../resources/xrp/xrp';
import { TransactionType } from '../../../../../src/coin/baseCoin';

class StubTransactionBuilder extends TransactionBuilder {
  protected buildXRPTxn(): TransactionJSON {
    throw new Error('Method not implemented.');
  }
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  getTransaction(): Transaction {
    return this._transaction;
  }

  buildImplementation(): Promise<Transaction> {
    return super.buildImplementation();
  }

  fromImplementation(rawTransaction: string): Transaction {
    return super.fromImplementation(rawTransaction);
  }

  signImplementation(key: BaseKey): Transaction {
    return super.signImplementation(key);
  }

  protected get transactionType(): TransactionType {
    throw new Error('Method not implemented.');
  }
}

describe('Xrp Transaction Builder', () => {
  let txnBuilder: StubTransactionBuilder;

  const {
    accounts: { acc1 },
  } = XrpResources;

  beforeEach(() => {
    const config = coins.get('xrp');
    txnBuilder = new StubTransactionBuilder(config);
  });

  describe('setter validation', () => {
    it('should validate fee is greater than 0', () => {
      should.throws(() => txnBuilder.fee({ fee: '-1' }), 'Value cannot be less than zero');
      should.doesNotThrow(() => txnBuilder.fee({ fee: '1000' }));
    });

    it('should validate sender address is a valid xrp address', () => {
      const spy = sinon.spy(txnBuilder, 'validateAddress');
      should.throws(
        () => txnBuilder.sender({ address: 'asdf' }),
        (e: Error) => e.name === AddressValidationError.name,
      );
      should.doesNotThrow(() => txnBuilder.sender({ address: acc1.address }));
      assert.calledTwice(spy);
    });
  });

  describe('private key validation', () => {
    it('validates base58 string', () => {
      should.doesNotThrow(() => txnBuilder.validateKey({ key: acc1.prv }));
    });

    it('fails with invalid key ', () => {
      should.throws(() => txnBuilder.validateKey({ key: 'asdf' }), 'Invalid key');
    });
  });

  describe('implementation functions', () => {
    it('should fail to build from invalid string', () => {
      should.throws(() => txnBuilder.fromImplementation('asdj'), 'Invalid Raw tx');
    });

    describe('transaction validation', () => {
      it('should validate a normal transaction', () => {
        txnBuilder
          .sender({ address: acc1.address })
          .flags(2147483648)
          .lastLedgerSequence(19964671)
          .fee({ fee: '12' })
          .sequence(19964661)
          .fulfillment('A0228020D280D1A02BAD0D2EBC0528B92E9BF37AC3E2530832C2C52620307135156F1048')
          .memos([
            {
              Memo: {
                MemoType: '687474703a2f2f6578616d706c652e636f6d2f6d656d6f2f67656e65726963',
                MemoData: '72656e74',
              },
            },
          ]);

        should.doesNotThrow(() => txnBuilder.validateTransaction(txnBuilder.getTransaction()));
      });
    });
  });
});
