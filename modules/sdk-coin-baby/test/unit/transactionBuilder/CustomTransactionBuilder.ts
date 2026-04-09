import { toHex, TransactionType } from '@bitgo/sdk-core';
import { fromBase64 } from '@cosmjs/encoding';
import should from 'should';

import { Baby, Tbaby } from '../../../src';
import * as testData from '../../resources/baby';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

describe('Baby Custom txn Builder', () => {
  let bitgo: TestBitGoAPI;
  let basecoin;
  let factory;
  let testTxs;
  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('baby', Baby.createInstance);
    bitgo.safeRegister('tbaby', Tbaby.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tbaby');
    factory = basecoin.getBuilder();
    testTxs = [testData.TEST_CUSTOM_MsgCreateBTCDelegation_TX, testData.TEST_CUSTOM_MsgWithdrawReward_TX];
  });

  it('should build a Custom tx with signature', async function () {
    for (const testTx of testTxs) {
      const txBuilder = factory.getCustomTransactionBuilder();
      txBuilder.sequence(testTx.sequence);
      txBuilder.gasBudget(testTx.gasBudget);
      txBuilder.messages([testTx.sendMessage.value]);
      txBuilder.publicKey(toHex(fromBase64(testTx.pubKey)));
      txBuilder.addSignature({ pub: toHex(fromBase64(testTx.pubKey)) }, Buffer.from(testTx.signature, 'base64'));

      const tx = await txBuilder.build();
      const json = await (await txBuilder.build()).toJson();
      should.equal(tx.type, TransactionType.CustomTx);
      should.deepEqual(json.gasBudget, testTx.gasBudget);
      should.deepEqual(json.sendMessages, [testTx.sendMessage]);
      should.deepEqual(json.publicKey, toHex(fromBase64(testTx.pubKey)));
      should.deepEqual(json.sequence, testTx.sequence);
      const rawTx = tx.toBroadcastFormat();
      should.equal(rawTx, testTx.signedTxBase64);
      should.deepEqual(tx.inputs, testTx.inputs);
      should.deepEqual(tx.outputs, testTx.outputs);
    }
  });

  it('should build a Custom tx without signature', async function () {
    for (const testTx of testTxs) {
      const txBuilder = factory.getCustomTransactionBuilder();
      txBuilder.sequence(testTx.sequence);
      txBuilder.gasBudget(testTx.gasBudget);
      txBuilder.messages([testTx.sendMessage.value]);
      txBuilder.publicKey(toHex(fromBase64(testTx.pubKey)));
      const tx = await txBuilder.build();
      const json = await (await txBuilder.build()).toJson();
      should.equal(tx.type, TransactionType.CustomTx);
      should.deepEqual(json.gasBudget, testTx.gasBudget);
      should.deepEqual(json.sendMessages, [testTx.sendMessage]);
      should.deepEqual(json.publicKey, toHex(fromBase64(testTx.pubKey)));
      should.deepEqual(json.sequence, testTx.sequence);
      tx.toBroadcastFormat();
      should.deepEqual(tx.inputs, testTx.inputs);
      should.deepEqual(tx.outputs, testTx.outputs);
    }
  });

  it('should sign a Custom tx', async function () {
    for (const testTx of testTxs) {
      const txBuilder = factory.getCustomTransactionBuilder();
      txBuilder.sequence(testTx.sequence);
      txBuilder.gasBudget(testTx.gasBudget);
      txBuilder.messages([testTx.sendMessage.value]);
      txBuilder.accountNumber(testTx.accountNumber);
      txBuilder.chainId(testTx.chainId);
      txBuilder.sign({ key: toHex(fromBase64(testTx.privateKey)) });
      const tx = await txBuilder.build();
      const json = await (await txBuilder.build()).toJson();
      should.equal(tx.type, TransactionType.CustomTx);
      should.deepEqual(json.gasBudget, testTx.gasBudget);
      should.deepEqual(json.sendMessages, [testTx.sendMessage]);
      should.deepEqual(json.publicKey, toHex(fromBase64(testTx.pubKey)));
      should.deepEqual(json.sequence, testTx.sequence);
      const rawTx = tx.toBroadcastFormat();
      should.equal(tx.signature[0], toHex(fromBase64(testTx.signature)));
      should.equal(rawTx, testTx.signedTxBase64);
      should.deepEqual(tx.inputs, testTx.inputs);
      should.deepEqual(tx.outputs, testTx.outputs);
    }
  });
});
