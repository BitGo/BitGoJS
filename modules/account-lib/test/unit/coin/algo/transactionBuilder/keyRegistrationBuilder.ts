import { coins } from '@bitgo/statics';
import should from 'should';
import sinon, { assert } from 'sinon';
import { Transaction } from '../../../../../src/coin/algo';
import { KeyRegistrationBuilder } from '../../../../../src/coin/algo/keyRegistrationBuilder';
import utils from '../../../../../src/coin/algo/utils';

import * as AlgoResources from '../../../../resources/algo';

class StubTransactionBuilder extends KeyRegistrationBuilder {
  getTransaction(): Transaction {
    return this._transaction;
  }
}

describe('Algo KeyRegistration Builder', () => {
  let builder: StubTransactionBuilder;
  
  const sender = AlgoResources.accounts.account1;
  const { rawTx } = AlgoResources


  beforeEach(() => {
    const config = coins.get('algo');
    builder = new StubTransactionBuilder(config)
  });

  describe('setter validation', () => {
    it('should validate voteKey, is set and is a valid string', () => {
      const spy = sinon.spy(builder, 'voteKey');
      should.throws(
        () => builder.voteKey(''),
        (e: Error) => e.message === 'voteKey can not be undefined',
      );
      should.doesNotThrow(() => builder.voteKey(sender.voteKey));
      assert.calledTwice(spy);
    });

    it('should validate selection key, is set and is a valid string', () => {
      const spy = sinon.spy(builder, 'selectionKey');
      should.throws(
        () => builder.selectionKey(''),
        (e: Error) => e.message === 'selectionKey can not be undefined'
      );
      should.doesNotThrow(() => builder.selectionKey(sender.selectionKey));
      assert.calledTwice(spy);
    });

    it('should validate vote First key is gt than 0', () => {
      const spy = sinon.spy(builder, 'validateValue');
      should.throws(
        () => builder.voteFirst(-1),
        (e: Error) => e.message === 'Value cannot be less than zero',
      );
      should.doesNotThrow(() => builder.voteFirst(15));
      assert.calledTwice(spy);
    });

    it('should validate vote Last key is gt than 0', () => {
      const validateValueSpy = sinon.spy(builder, 'validateValue');
      const spy = sinon.spy(builder, 'voteLast');
      should.throws(
        () => builder.voteLast(-1),
        (e: Error) => e.message === 'Value cannot be less than zero',
      );
      should.doesNotThrow(() => builder.voteLast(15));
      assert.calledTwice(validateValueSpy)
      assert.calledTwice(spy);
    });

    it('should validate vote Last key is gt than FirstKey', () => {
      const spy = sinon.spy(builder, 'voteLast');
      builder.voteFirst(15);
      should.throws(
        () => builder.voteLast(12),
        (e: Error) => e.message === 'VoteKey last round must be greater than first round',
      );
      should.doesNotThrow(() => builder.voteLast(18));
      assert.calledTwice(spy);
    });

    it('should validate vote Key Dilution', () => {
      const validateValueSpy = sinon.spy(builder, 'validateValue');
      const spy = sinon.spy(builder, 'voteKeyDilution');
      builder
        .voteFirst(5)
        .voteLast(18);
      should.throws(
        () => builder.voteKeyDilution(25),
        (e: Error) => e.message === 'Key dilution value must be less than or equal to the square root of the voteKey validity range.',
      );
      should.doesNotThrow(() => builder.voteKeyDilution(2));
      assert.calledTwice(spy);
      should(validateValueSpy.callCount).be.exactly(4)
    });
  });

  describe('validation should fail', () => {
    beforeEach(() => {
      builder
        .sender({ address: sender.address })
        .fee({ fee: '1000' })
        .firstRound(1)
        .lastRound(100)
        .testnet()
    });
    
    it('missing: voteKey', () => {
      builder
        .selectionKey(sender.selectionKey)
        .voteFirst(1)
        .voteLast(100)
        .voteKeyDilution(9);
      should.throws(
        () => builder.validateTransaction(builder.getTransaction()),
        (e: Error) => e.message === 'Transaction validation failed: "voteKey" is required',
      );
    })
    it('missing: selectionKey', () => {
      builder
        .voteKey(sender.voteKey)
        .voteFirst(1)
        .voteLast(100)
        .voteKeyDilution(9);
      should.throws(
        () => builder.validateTransaction(builder.getTransaction()),
        (e: Error) => e.message === 'Transaction validation failed: "selectionKey" is required',
      );
    })
    it('missing: voteFirst', () => {
      builder
        .voteKey(sender.voteKey)
        .selectionKey(sender.selectionKey)
        .voteLast(100)
        .voteKeyDilution(9)
      should.throws(
        () => builder.validateTransaction(builder.getTransaction()),
        (e: Error) => e.message === 'Transaction validation failed: "voteFirst" is required',
      );
    })
    it('missing: voteLast', () => {
      builder
        .voteKey(sender.voteKey)
        .selectionKey(sender.selectionKey)
        .voteFirst(1)
        .voteKeyDilution(9);
      should.throws(
        () => builder.validateTransaction(builder.getTransaction()),
        (e: Error) => e.message === 'Transaction validation failed: "voteLast" is required',
      );
    })
    it('missing: voteKeyDilution', () => {
      builder
        .voteKey(sender.voteKey)
        .selectionKey(sender.selectionKey)
        .voteFirst(1)
        .voteLast(100);
      should.throws(
        () => builder.validateTransaction(builder.getTransaction()),
        (e: Error) => e.message === 'Transaction validation failed: "voteKeyDilution" is required',
      );
    })
  })
  

  describe('build key registration transaction', () => {
    it('should build a key registration transaction', async () => {
      builder
        .sender({ address: sender.address })
        .fee({ fee: '1000' })
        .firstRound(1)
        .lastRound(100)
        .voteKey(sender.voteKey)
        .selectionKey(sender.selectionKey)
        .voteFirst(1)
        .voteLast(100)
        .voteKeyDilution(9)
        .testnet()
        .numberOfSigners(1);
      builder.sign({ key: sender.secretKey.toString('hex') });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.doesNotThrow(() => builder.validateKey({ key: txJson.voteKey }));
      should.deepEqual(txJson.voteKey.toString('base64'), sender.voteKey);
      should.doesNotThrow(() => builder.validateKey({ key: txJson.selectionKey }));
      should.deepEqual(txJson.selectionKey.toString('base64'), sender.selectionKey);
      should.deepEqual(txJson.from, sender.address);
      should.deepEqual(txJson.firstRound, 1);
      should.deepEqual(txJson.lastRound, 100);
      should.deepEqual(txJson.voteFirst, 1);
      should.deepEqual(txJson.voteLast, 100);
      should.deepEqual(txJson.voteKeyDilution, 9);
    });

    it('should build a signed trx from an unsigned raw transaction', async () => {
      const rawTransaction = utils.hexStringToUInt8Array(rawTx.keyReg.unsigned);
      builder.from(rawTransaction);
      const tx = await builder.build();
      const txJson = tx.toJson()
      should.doesNotThrow(() => builder.validateKey({ key: txJson.voteKey }));
      should.deepEqual(txJson.voteKey.toString('base64'), sender.voteKey);
      should.doesNotThrow(() => builder.validateKey({ key: txJson.selectionKey }));
      should.deepEqual(txJson.selectionKey.toString('base64'), sender.selectionKey);
      should.deepEqual(txJson.from, sender.address);
      should.deepEqual(txJson.firstRound, 1);
      should.deepEqual(txJson.lastRound, 100);
      should.deepEqual(txJson.voteFirst, 1);
      should.deepEqual(txJson.voteLast, 100);
      should.deepEqual(txJson.voteKeyDilution, 9);
    })
  })
})
