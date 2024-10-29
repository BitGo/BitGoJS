import { BitGoAPI } from '@bitgo/sdk-api';
import { TransactionType } from '@bitgo/sdk-core';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { fromBase64, toHex } from '@cosmjs/encoding';
import should from 'should';
import { Rune, Trune } from '../../../src';
import * as testData from '../../resources/trune';
const bech32 = require('bech32-buffer');

describe('Rune Transfer Builder', () => {
  let bitgo: TestBitGoAPI;
  let basecoin;
  let factory;
  let testTx;
  let testTxWithMemo;
  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('thorchain:rune', Rune.createInstance);
    bitgo.safeRegister('thorchain:trune', Trune.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('thorchain:trune');
    factory = basecoin.getBuilder();
    testTx = testData.TEST_SEND_TX;
    testTxWithMemo = testData.TEST_TX_WITH_MEMO;
  });

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
    should.deepEqual(json.sendMessages[0].typeUrl, testTx.sendMessage.typeUrl);
    should.deepEqual(json.sendMessages[0].value.amount, testTx.sendMessage.value.amount);
    should.deepEqual(
      bech32.encode('sthor', json.sendMessages[0].value.fromAddress),
      testTx.sendMessage.value.fromAddress
    );
    should.deepEqual(bech32.encode('sthor', json.sendMessages[0].value.toAddress), testTx.sendMessage.value.toAddress);
    should.deepEqual(json.publicKey, toHex(fromBase64(testTx.pubKey)));
    should.deepEqual(json.sequence, testTx.sequence);
    const rawTx = tx.toBroadcastFormat();
    should.equal(rawTx, testTx.signedTxBase64);
    should.deepEqual(tx.inputs, [
      {
        address: bech32.decode(testData.TEST_SEND_TX.sender).data,
        value: testData.TEST_SEND_TX.sendMessage.value.amount[0].amount,
        coin: basecoin.getChain(),
      },
    ]);
    should.deepEqual(tx.outputs, [
      {
        address: bech32.decode(testData.TEST_SEND_TX.sendMessage.value.toAddress).data,
        value: testData.TEST_SEND_TX.sendMessage.value.amount[0].amount,
        coin: basecoin.getChain(),
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
    should.deepEqual(json.sendMessages[0].typeUrl, testTx.sendMessage.typeUrl);
    should.deepEqual(json.sendMessages[0].value.amount, testTx.sendMessage.value.amount);
    should.deepEqual(
      bech32.encode('sthor', json.sendMessages[0].value.fromAddress),
      testTx.sendMessage.value.fromAddress
    );
    should.deepEqual(bech32.encode('sthor', json.sendMessages[0].value.toAddress), testTx.sendMessage.value.toAddress);
    should.deepEqual(json.publicKey, toHex(fromBase64(testTxWithMemo.pubKey)));
    should.deepEqual(json.sequence, testTxWithMemo.sequence);
    should.equal(json.memo, testTxWithMemo.memo);
    const rawTx = tx.toBroadcastFormat();
    should.equal(rawTx, testTxWithMemo.signedTxBase64);
    should.deepEqual(tx.inputs, [
      {
        address: bech32.decode(testTxWithMemo.sendMessage.value.fromAddress).data,
        value: testTxWithMemo.sendMessage.value.amount[0].amount,
        coin: basecoin.getChain(),
      },
    ]);
    should.deepEqual(tx.outputs, [
      {
        address: bech32.decode(testTxWithMemo.sendMessage.value.toAddress).data,
        value: testTxWithMemo.sendMessage.value.amount[0].amount,
        coin: basecoin.getChain(),
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
    should.deepEqual(json.sendMessages[0].typeUrl, testTx.sendMessage.typeUrl);
    should.deepEqual(json.sendMessages[0].value.amount, testTx.sendMessage.value.amount);
    should.deepEqual(
      bech32.encode('sthor', json.sendMessages[0].value.fromAddress),
      testTx.sendMessage.value.fromAddress
    );
    should.deepEqual(bech32.encode('sthor', json.sendMessages[0].value.toAddress), testTx.sendMessage.value.toAddress);

    should.deepEqual(json.publicKey, toHex(fromBase64(testTx.pubKey)));
    should.deepEqual(json.sequence, testTx.sequence);
    tx.toBroadcastFormat();
    should.deepEqual(tx.inputs, [
      {
        address: bech32.decode(testData.TEST_SEND_TX.sender).data,
        value: testData.TEST_SEND_TX.sendMessage.value.amount[0].amount,
        coin: basecoin.getChain(),
      },
    ]);
    should.deepEqual(tx.outputs, [
      {
        address: bech32.decode(testData.TEST_SEND_TX.sendMessage.value.toAddress).data,
        value: testData.TEST_SEND_TX.sendMessage.value.amount[0].amount,
        coin: basecoin.getChain(),
      },
    ]);
  });

  it('should sign a Transfer tx', async function () {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.sequence(testTx.sequence);
    txBuilder.gasBudget(testTx.gasBudget);
    txBuilder.messages([testTx.sendMessage.value]);
    txBuilder.accountNumber(testTx.accountNumber);
    txBuilder.chainId(testTx.chainId);
    txBuilder.sign({ key: toHex(fromBase64(testTx.privateKey)) });
    const tx = await txBuilder.build();
    const json = await (await txBuilder.build()).toJson();
    should.equal(tx.type, TransactionType.Send);
    should.deepEqual(json.gasBudget, testTx.gasBudget);
    should.deepEqual(json.sendMessages[0].typeUrl, testTx.sendMessage.typeUrl);
    should.deepEqual(json.sendMessages[0].value.amount, testTx.sendMessage.value.amount);
    should.deepEqual(
      bech32.encode('sthor', json.sendMessages[0].value.fromAddress),
      testTx.sendMessage.value.fromAddress
    );
    should.deepEqual(bech32.encode('sthor', json.sendMessages[0].value.toAddress), testTx.sendMessage.value.toAddress);
    should.deepEqual(json.publicKey, toHex(fromBase64(testTx.pubKey)));
    should.deepEqual(json.sequence, testTx.sequence);
    const rawTx = tx.toBroadcastFormat();
    should.equal(tx.signature[0], toHex(fromBase64(testTx.signature)));
    should.equal(rawTx, testTx.signedTxBase64);
    should.deepEqual(tx.inputs, [
      {
        address: bech32.decode(testData.TEST_SEND_TX.sender).data,
        value: testData.TEST_SEND_TX.sendMessage.value.amount[0].amount,
        coin: basecoin.getChain(),
      },
    ]);
    should.deepEqual(tx.outputs, [
      {
        address: bech32.decode(testData.TEST_SEND_TX.sendMessage.value.toAddress).data,
        value: testData.TEST_SEND_TX.sendMessage.value.amount[0].amount,
        coin: basecoin.getChain(),
      },
    ]);
  });
});
