import should from 'should';
import { coins } from '@bitgo/statics';
import sinon, { assert } from 'sinon';
import * as EosJs from 'eosjs';
import { TransactionBuilder as EosTxBuilder } from 'eosjs/dist/eosjs-api';
import { Action } from 'eosjs/dist/eosjs-serialize';
import { TransactionBuilder } from '../../../../../src/coin/eos/transactionBuilder';
import { Transaction } from '../../../../../src/coin/eos/transaction';
import { EosActionBuilder } from '../../../../../src/coin/eos/eosActionBuilder';

class StubTransactionBuilder extends TransactionBuilder {
  protected actionName(): string {
    throw new Error('Method not implemented.');
  }
  protected createAction(builder: EosTxBuilder, action: Action): EosJs.Serialize.Action {
    throw new Error('Method not implemented.');
  }
  actionBuilder(account: string, actors: string[]): EosActionBuilder {
    throw new Error('Method not implemented.');
  }
  getTransaction(): Transaction {
    return this._transaction;
  }
}

describe('Eos Stake builder', () => {
  let builder: StubTransactionBuilder;

  beforeEach(() => {
    const config = coins.get('eos');
    builder = new StubTransactionBuilder(config);
  });

  describe('setter validation', () => {
    it('should validate refBlockNum', () => {
      const spy = sinon.spy(builder, 'refBlockNum');
      should.throws(
        () => builder.refBlockNum(-1),
        (e: Error) => e.message === 'Value cannot be less than zero',
      );
      should.doesNotThrow(() => builder.refBlockNum(100));
      assert.calledTwice(spy);
    });

    it('should validate refBlockPrefix', () => {
      const spy = sinon.spy(builder, 'refBlockPrefix');
      should.throws(
        () => builder.refBlockPrefix(-1),
        (e: Error) => e.message === 'Value cannot be less than zero',
      );
      should.doesNotThrow(() => builder.refBlockPrefix(100));
      assert.calledTwice(spy);
    });
  });
});
