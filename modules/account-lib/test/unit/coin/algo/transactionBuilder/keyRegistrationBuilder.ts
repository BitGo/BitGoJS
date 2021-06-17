import { coins } from '@bitgo/statics';
import algosdk from 'algosdk';
import should from 'should';
import sinon, { assert } from 'sinon';
import { Transaction } from '../../../../../src/coin/algo';
import { KeyRegistrationBuilder } from '../../../../../src/coin/algo/keyRegistrationBuilder';

import * as AlgoResources from '../../../../resources/algo';

class StubTransactionBuilder extends KeyRegistrationBuilder {
  getTransaction(): Transaction {
    return this._transaction;
  }
}

describe('Algo KeyRegistration Builder', () => {
  let builder: StubTransactionBuilder;

  const sender = AlgoResources.accounts.account1;
  const { rawTx } = AlgoResources;

  beforeEach(() => {
    const config = coins.get('algo');
    builder = new StubTransactionBuilder(config);
  });

  describe('setter validation', () => {
    it('should validate voteKey, is set and is a valid string', () => {
      should.doesNotThrow(() => builder.voteKey(sender.voteKey));
    });

    it('should validate selection key, is set and is a valid string', () => {
      should.doesNotThrow(() => builder.selectionKey(sender.selectionKey));
    });

    it('should validate voteFirst is gt than 0', () => {
      const spy = sinon.spy(builder, 'validateValue');
      should.throws(
        () => builder.voteFirst(-1),
        (e: Error) => e.message === 'Value cannot be less than zero',
      );
      should.doesNotThrow(() => builder.voteFirst(15));
      assert.calledTwice(spy);
    });

    it('should validate voteLast is gt than 0', () => {
      const validateValueSpy = sinon.spy(builder, 'validateValue');
      builder.voteFirst(1);
      should.throws(
        () => builder.voteLast(-1),
        (e: Error) => e.message === 'Value cannot be less than zero',
      );
      should.doesNotThrow(() => builder.voteLast(15));
      assert.calledThrice(validateValueSpy);
    });

    it('should validate vote Key Dilution', () => {
      const validateValueSpy = sinon.spy(builder, 'validateValue');
      builder.voteFirst(5).voteLast(18);
      should.doesNotThrow(() => builder.voteKeyDilution(2));
      assert.calledThrice(validateValueSpy);
    });
  });

  describe('transaction validation', () => {
    beforeEach(() => {
      builder.sender({ address: sender.address }).fee({ fee: '1000' }).firstRound(1).lastRound(100).testnet();
    });
    it('should validate a normal transaction', () => {
      builder.voteKey(sender.voteKey).selectionKey(sender.selectionKey).voteFirst(1).voteLast(100).voteKeyDilution(9);
      should.doesNotThrow(() => builder.validateTransaction(builder.getTransaction()));
    });
  });

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

    it('should build an unsigned key registration transaction', async () => {
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
        .testnet();
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

    it('should build a trx from an unsigned raw transaction', async () => {
      builder.from(rawTx.keyReg.unsigned);
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

    it('should sign from raw unsigned tx', async () => {
      builder.from(rawTx.keyReg.unsigned);
      builder.numberOfSigners(1);
      builder.sign({ key: sender.secretKey.toString('hex') });
      const tx = await builder.build();
      should.deepEqual(Buffer.from(tx.toBroadcastFormat()).toString('hex'), AlgoResources.rawTx.keyReg.signed);
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
  });

  describe('build multi-sig key registration transaction', () => {
    it('should build a msig registration transaction', async () => {
      const msigAddress = algosdk.multisigAddress({
        version: 1,
        threshold: 2,
        addrs: [AlgoResources.accounts.account1.address, AlgoResources.accounts.account3.address],
      });
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
        .numberOfSigners(2)
        .setSigners([AlgoResources.accounts.account1.address, AlgoResources.accounts.account3.address])
        .sign({ key: AlgoResources.accounts.account1.secretKey.toString('hex') });
      builder.sign({ key: AlgoResources.accounts.account3.secretKey.toString('hex') });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.doesNotThrow(() => builder.validateKey({ key: txJson.voteKey }));
      should.deepEqual(txJson.voteKey.toString('base64'), sender.voteKey);
      should.doesNotThrow(() => builder.validateKey({ key: txJson.selectionKey }));
      should.deepEqual(txJson.selectionKey.toString('base64'), sender.selectionKey);
      should.deepEqual(txJson.from, msigAddress);
      should.deepEqual(txJson.firstRound, 1);
      should.deepEqual(txJson.lastRound, 100);
      should.deepEqual(txJson.voteFirst, 1);
      should.deepEqual(txJson.voteLast, 100);
      should.deepEqual(txJson.voteKeyDilution, 9);
    });
  });
});
