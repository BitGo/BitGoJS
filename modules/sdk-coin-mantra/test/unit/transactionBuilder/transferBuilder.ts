import { TransactionType } from '@bitgo/sdk-core';
import { fromBase64, toHex } from '@cosmjs/encoding';
import should from 'should';
import * as testData from '../../resources/mantra';
import { getBuilderFactory } from '../getBuilderFactory';

describe('Mantra Transfer Builder', () => {
  const factory = getBuilderFactory('tmantra');
  const testTx = testData.TEST_SEND_TX;
  const testTxWithMemo = testData.TEST_TX_WITH_MEMO;
  it('should build a Transfer tx with signature', async function () {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.sequence(testTx.sequence);
    txBuilder.gasBudget(testTx.gasBudget);
    txBuilder.messages([testTx.sendMessage.value]);
    txBuilder.publicKey(toHex(fromBase64(testTx.pubKey)));
    txBuilder.addSignature({ pub: toHex(fromBase64(testTx.pubKey)) }, Buffer.from(testTx.signature, 'base64'));

    const tx = await txBuilder.build();
    const json = await (await txBuilder.build()).toJson();
    should.equal(tx.type, TransactionType.Send);
    should.deepEqual(json.gasBudget, testTx.gasBudget);
    should.deepEqual(json.sendMessages, [testTx.sendMessage]);
    should.deepEqual(json.publicKey, toHex(fromBase64(testTx.pubKey)));
    should.deepEqual(json.sequence, testTx.sequence);
    const rawTx = tx.toBroadcastFormat();
    should.equal(rawTx, testTx.signedTxBase64);
    should.deepEqual(tx.inputs, [
      {
        address: testData.TEST_SEND_TX.sender,
        value: testData.TEST_SEND_TX.sendMessage.value.amount[0].amount,
        coin: 'tmantra',
      },
    ]);
    should.deepEqual(tx.outputs, [
      {
        address: testData.TEST_SEND_TX.sendMessage.value.toAddress,
        value: testData.TEST_SEND_TX.sendMessage.value.amount[0].amount,
        coin: 'tmantra',
      },
    ]);
  });

  it('should build a Transfer tx with signature and memo', async function () {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.sequence(testTxWithMemo.sequence);
    txBuilder.gasBudget(testTxWithMemo.gasBudget);
    txBuilder.messages([testTxWithMemo.sendMessage.value]);
    txBuilder.publicKey(toHex(fromBase64(testTxWithMemo.pubKey)));
    txBuilder.memo(testTxWithMemo.memo);
    txBuilder.addSignature(
      { pub: toHex(fromBase64(testTxWithMemo.pubKey)) },
      Buffer.from(testTxWithMemo.signature, 'base64')
    );

    const tx = await txBuilder.build();
    const json = await (await txBuilder.build()).toJson();
    should.equal(tx.type, TransactionType.Send);
    should.deepEqual(json.gasBudget, testTxWithMemo.gasBudget);
    should.deepEqual(json.sendMessages, [testTxWithMemo.sendMessage]);
    should.deepEqual(json.publicKey, toHex(fromBase64(testTxWithMemo.pubKey)));
    should.deepEqual(json.sequence, testTxWithMemo.sequence);
    should.equal(json.memo, testTxWithMemo.memo);
    const rawTx = tx.toBroadcastFormat();
    should.equal(rawTx, testTxWithMemo.signedTxBase64);
    should.deepEqual(tx.inputs, [
      {
        address: testTxWithMemo.sendMessage.value.fromAddress,
        value: testTxWithMemo.sendMessage.value.amount[0].amount,
        coin: 'tmantra',
      },
    ]);
    should.deepEqual(tx.outputs, [
      {
        address: testTxWithMemo.sendMessage.value.toAddress,
        value: testTxWithMemo.sendMessage.value.amount[0].amount,
        coin: 'tmantra',
      },
    ]);
  });

  it('should build a Transfer tx without signature', async function () {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.sequence(testTx.sequence);
    txBuilder.gasBudget(testTx.gasBudget);
    txBuilder.messages([testTx.sendMessage.value]);
    txBuilder.publicKey(toHex(fromBase64(testTx.pubKey)));
    const tx = await txBuilder.build();
    const json = await (await txBuilder.build()).toJson();
    should.equal(tx.type, TransactionType.Send);
    should.deepEqual(json.gasBudget, testTx.gasBudget);
    should.deepEqual(json.sendMessages, [testTx.sendMessage]);
    should.deepEqual(json.publicKey, toHex(fromBase64(testTx.pubKey)));
    should.deepEqual(json.sequence, testTx.sequence);
    tx.toBroadcastFormat();
    should.deepEqual(tx.inputs, [
      {
        address: testData.TEST_SEND_TX.sender,
        value: testData.TEST_SEND_TX.sendMessage.value.amount[0].amount,
        coin: 'tmantra',
      },
    ]);
    should.deepEqual(tx.outputs, [
      {
        address: testData.TEST_SEND_TX.sendMessage.value.toAddress,
        value: testData.TEST_SEND_TX.sendMessage.value.amount[0].amount,
        coin: 'tmantra',
      },
    ]);
  });

  it('should build a sendMany Transfer tx', async function () {
    const testSendManyTx = testData.TEST_SEND_MANY_TX;
    const txBuilder = factory.getTransferBuilder();
    txBuilder.sequence(testSendManyTx.sequence);
    txBuilder.gasBudget(testSendManyTx.gasBudget);
    txBuilder.messages(testSendManyTx.sendMessages.map((msg) => msg.value));
    txBuilder.publicKey(toHex(fromBase64(testSendManyTx.pubKey)));
    txBuilder.chainId(testSendManyTx.chainId);
    txBuilder.accountNumber(testSendManyTx.accountNumber);
    txBuilder.memo(testSendManyTx.memo);
    txBuilder.addSignature(
      { pub: toHex(fromBase64(testSendManyTx.pubKey)) },
      Buffer.from(testSendManyTx.signature, 'base64')
    );

    const tx = await txBuilder.build();
    const json = await (await txBuilder.build()).toJson();
    should.equal(tx.type, TransactionType.Send);
    should.deepEqual(json.gasBudget, testSendManyTx.gasBudget);
    should.deepEqual(json.sendMessages, testSendManyTx.sendMessages);
    should.deepEqual(json.publicKey, toHex(fromBase64(testSendManyTx.pubKey)));
    should.deepEqual(json.sequence, testSendManyTx.sequence);
    should.deepEqual(
      tx.inputs,
      testSendManyTx.sendMessages.map((msg) => {
        return {
          address: msg.value.fromAddress,
          value: msg.value.amount[0].amount,
          coin: 'tmantra',
        };
      })
    );
    should.deepEqual(
      tx.outputs,
      testSendManyTx.sendMessages.map((msg) => {
        return {
          address: msg.value.toAddress,
          value: msg.value.amount[0].amount,
          coin: 'tmantra',
        };
      })
    );
    should.equal(tx.id, testSendManyTx.hash);
    const rawTx = tx.toBroadcastFormat();
    should.equal(rawTx, testSendManyTx.signedTxBase64);
  });
});
