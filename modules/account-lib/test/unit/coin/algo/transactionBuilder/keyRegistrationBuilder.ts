import { BaseCoin as CoinConfig, coins } from '@bitgo/statics';
import should from 'should';
import sinon, { assert } from 'sinon';
import { KeyRegistrationBuilder } from '../../../../../src/coin/algo/keyRegistrationBuilder';
import utils from '../../../../../src/coin/algo/utils';

import * as AlgoResources from '../../../../resources/algo';

describe('Algo KeyRegistration Builder', () => {
  let builder: KeyRegistrationBuilder;
  
  const sender = AlgoResources.accounts.account1;
  const receiver = AlgoResources.accounts.account2;
  const { rawTransactions } = AlgoResources


  beforeEach(() => {
    const config = coins.get('algo');
    builder = new KeyRegistrationBuilder(config)
  });

  describe('setter validation', () => {
    it('should validate voteKey, is set and is a valid string', () => {
      const spy = sinon.spy(builder, 'voteKey');
      should.throws(
        () => builder.voteKey(""),
        (e: Error) => e.message === "voteKey can not be undefined",
      );
      should.doesNotThrow(() => builder.voteKey(sender.voteKey));
      assert.calledTwice(spy);
    });

    it('should validate selection key, is set and is a valid string', () => {
      const spy = sinon.spy(builder, 'selectionKey');
      should.throws(
        () => builder.selectionKey(""),
        (e: Error) => e.message === 'selectionKey can not be undefined'
      );
      should.doesNotThrow(() => builder.selectionKey(sender.selectionKey));
      assert.calledTwice(spy);
    });
    
    it('should validate vote First key is gt than 0', () => {
      const spy = sinon.spy(builder, 'voteFirst');
      should.throws(
        () => builder.voteFirst(-1),
        (e: Error) => e.message === 'Value cannot be less than zero',
      );
      should.doesNotThrow(() => builder.voteFirst(15));
      assert.calledTwice(spy);
    });

    it('should validate vote Last key is gt than 0', () => {
      const spy = sinon.spy(builder, 'voteLast');
      should.throws(
        () => builder.voteLast(-1),
        (e: Error) => e.message === 'Value cannot be less than zero',
      );
      should.doesNotThrow(() => builder.voteLast(15));
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
      const spy = sinon.spy(builder, 'voteKeyDilution');
      builder.voteFirst(5);
      builder.voteLast(18)
      should.throws(
        () => builder.voteKeyDilution(25),
        (e: Error) => e.message === 'Key dilution value must be less than or equal to the square root of the voteKey validity range.',
      );
      should.doesNotThrow(() => builder.voteKeyDilution(2));
      assert.calledTwice(spy);
    });
  });

  describe('validation should fail', () => {
    it("missing: voteKey", () => {
      builder.selectionKey(sender.selectionKey)
      builder.voteFirst(1);
      builder.voteLast(100);
      builder.voteKeyDilution(9)
      should.throws(
        () => builder.validateTransaction(),
        (e: Error) => e.message === "Invalid transaction: missing voteKey",
      );
    })
    it("missing: selectionKey", () => {
      builder.voteKey(sender.voteKey)
      builder.voteFirst(1);
      builder.voteLast(100);
      builder.voteKeyDilution(9)
      should.throws(
        () => builder.validateTransaction(),
        (e: Error) => e.message === "Invalid transaction: missing selectionKey",
      );
    })
    it("missing: voteFirst", () => {
      builder.voteKey(sender.voteKey)
      builder.selectionKey(sender.selectionKey)
      builder.voteLast(100);
      builder.voteKeyDilution(9)
      should.throws(
        () => builder.validateTransaction(),
        (e: Error) => e.message === "Invalid transaction: missing voteFirst",
      );
    })
    it("missing: voteLast", () => {
      builder.voteKey(sender.voteKey)
      builder.selectionKey(sender.selectionKey)
      builder.voteFirst(1);
      builder.voteKeyDilution(9)
      should.throws(
        () => builder.validateTransaction(),
        (e: Error) => e.message === "Invalid transaction: missing voteLast",
      );
    })
    it("missing: voteKeyDilution", () => {
      builder.voteKey(sender.voteKey)
      builder.selectionKey(sender.selectionKey)
      builder.voteFirst(1);
      builder.voteLast(100);
      should.throws(
        () => builder.validateTransaction(),
        (e: Error) => e.message === "Invalid transaction: missing voteKeyDilution",
      );
    })
  })
  

  describe('build key registration transaction', () => {
    it('should build a key registration transaction', async () => {
      builder.sender({ address: sender.address });
      builder.fee({ fee: '1000' });
      builder.firstRound(1);
      builder.lastRound(100);
      builder.voteKey(sender.voteKey)
      builder.selectionKey(sender.selectionKey)
      builder.voteFirst(1);
      builder.voteLast(100);
      builder.voteKeyDilution(9)
      builder.testnet();
      builder.numberOfSigners(1);
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
      const rawTransaction = utils.hexStringToUInt8Array(rawTransactions.unsigned);
      builder.from(rawTransaction);
      builder.numberOfSigners(1);
      builder.sign({ key: sender.secretKey.toString('hex') });
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
