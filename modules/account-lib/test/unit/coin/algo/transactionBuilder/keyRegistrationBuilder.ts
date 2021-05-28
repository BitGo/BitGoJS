import { BaseCoin as CoinConfig, coins } from '@bitgo/statics';
import should from 'should';
import sinon, { assert } from 'sinon';
import { KeyRegistrationBuilder } from '../../../../../src/coin/algo/keyRegistrationBuilder';

import * as AlgoResources from '../../../../resources/algo';

describe('Algo KeyRegistration Builder', () => {
  let builder: KeyRegistrationBuilder;
  
  const sender = AlgoResources.accounts.account1;
  const receiver = AlgoResources.accounts.account2;


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
      should.doesNotThrow(() => builder.validateKey({ key: txJson.selectionKey }));
      should.deepEqual(txJson.from, sender.address);
      should.deepEqual(txJson.firstRound, 1);
      should.deepEqual(txJson.lastRound, 100);
      should.deepEqual(txJson.voteFirst, 1);
      should.deepEqual(txJson.voteLast, 100);
      should.deepEqual(txJson.voteKeyDilution, 9);
    });
  });
});
