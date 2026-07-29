import { toHex, TransactionType } from '@bitgo/sdk-core';
import { fromBase64 } from '@cosmjs/encoding';
import should from 'should';

import { Tia, Ttia } from '../../../src';
import * as testData from '../../resources/tia';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

describe('Tia Delegate txn Builder', () => {
  let bitgo: TestBitGoAPI;
  let basecoin;
  let factory;
  let testTx;
  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('tia', Tia.createInstance);
    bitgo.safeRegister('ttia', Ttia.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('ttia');
    factory = basecoin.getBuilder();
    testTx = testData.TEST_DELEGATE_TX;
  });

  it('should build a Delegate tx with signature', async function () {
    const txBuilder = factory.getStakingActivateBuilder();
    txBuilder.sequence(testTx.sequence);
    txBuilder.gasBudget(testTx.gasBudget);
    txBuilder.messages([testTx.sendMessage.value]);
    txBuilder.publicKey(toHex(fromBase64(testTx.pubKey)));
    txBuilder.addSignature({ pub: toHex(fromBase64(testTx.pubKey)) }, Buffer.from(testTx.signature, 'base64'));

    const tx = await txBuilder.build();
    const json = await (await txBuilder.build()).toJson();
    should.equal(tx.type, TransactionType.StakingActivate);
    should.deepEqual(json.gasBudget, testTx.gasBudget);
    should.deepEqual(json.sendMessages, [testTx.sendMessage]);
    should.deepEqual(json.publicKey, toHex(fromBase64(testTx.pubKey)));
    should.deepEqual(json.sequence, testTx.sequence);
    const rawTx = tx.toBroadcastFormat();
    should.equal(rawTx, testTx.signedTxBase64);
    should.deepEqual(tx.inputs, [
      {
        address: testTx.delegator,
        value: testTx.sendMessage.value.amount.amount,
        coin: basecoin.getChain(),
      },
    ]);
    should.deepEqual(tx.outputs, [
      {
        address: testTx.validator,
        value: testTx.sendMessage.value.amount.amount,
        coin: basecoin.getChain(),
      },
    ]);
  });

  it('should build a Delegate tx without signature', async function () {
    const txBuilder = factory.getStakingActivateBuilder();
    txBuilder.sequence(testTx.sequence);
    txBuilder.gasBudget(testTx.gasBudget);
    txBuilder.messages([testTx.sendMessage.value]);
    txBuilder.publicKey(toHex(fromBase64(testTx.pubKey)));
    const tx = await txBuilder.build();
    const json = await (await txBuilder.build()).toJson();
    should.equal(tx.type, TransactionType.StakingActivate);
    should.deepEqual(json.gasBudget, testTx.gasBudget);
    should.deepEqual(json.sendMessages, [testTx.sendMessage]);
    should.deepEqual(json.publicKey, toHex(fromBase64(testTx.pubKey)));
    should.deepEqual(json.sequence, testTx.sequence);
    tx.toBroadcastFormat();
    should.deepEqual(tx.inputs, [
      {
        address: testTx.delegator,
        value: testTx.sendMessage.value.amount.amount,
        coin: basecoin.getChain(),
      },
    ]);
    should.deepEqual(tx.outputs, [
      {
        address: testTx.validator,
        value: testTx.sendMessage.value.amount.amount,
        coin: basecoin.getChain(),
      },
    ]);
  });

  it('should sign a Delegate tx', async function () {
    const txBuilder = factory.getStakingActivateBuilder();
    txBuilder.sequence(testTx.sequence);
    txBuilder.gasBudget(testTx.gasBudget);
    txBuilder.messages([testTx.sendMessage.value]);
    txBuilder.accountNumber(testTx.accountNumber);
    txBuilder.chainId(testTx.chainId);
    txBuilder.sign({ key: toHex(fromBase64(testTx.privateKey)) });
    const tx = await txBuilder.build();
    const json = await (await txBuilder.build()).toJson();
    should.equal(tx.type, TransactionType.StakingActivate);
    should.deepEqual(json.gasBudget, testTx.gasBudget);
    should.deepEqual(json.sendMessages, [testTx.sendMessage]);
    should.deepEqual(json.publicKey, toHex(fromBase64(testTx.pubKey)));
    should.deepEqual(json.sequence, testTx.sequence);
    const rawTx = tx.toBroadcastFormat();
    should.equal(tx.signature[0], toHex(fromBase64(testTx.signature)));
    should.equal(rawTx, testTx.signedTxBase64);
    should.deepEqual(tx.inputs, [
      {
        address: testTx.delegator,
        value: testTx.sendMessage.value.amount.amount,
        coin: basecoin.getChain(),
      },
    ]);
    should.deepEqual(tx.outputs, [
      {
        address: testTx.validator,
        value: testTx.sendMessage.value.amount.amount,
        coin: basecoin.getChain(),
      },
    ]);
  });

  it('should build a sendMany stake tx', async function () {
    const testSendManyTx = testData.TEST_SEND_MANY_STAKE_TX;
    const txBuilder = factory.getStakingActivateBuilder();
    txBuilder.sequence(testSendManyTx.sequence);
    txBuilder.gasBudget(testSendManyTx.gasBudget);
    txBuilder.messages(testSendManyTx.sendMessages.map((msg) => msg.value));
    txBuilder.publicKey(toHex(fromBase64(testSendManyTx.pubKey)));
    txBuilder.chainId(testSendManyTx.chainId);
    txBuilder.accountNumber(testSendManyTx.accountNumber);
    txBuilder.memo('');
    txBuilder.addSignature(
      { pub: toHex(fromBase64(testSendManyTx.pubKey)) },
      Buffer.from(testSendManyTx.signature, 'base64')
    );

    const tx = await txBuilder.build();
    const json = await (await txBuilder.build()).toJson();
    should.equal(tx.type, TransactionType.StakingActivate);
    should.deepEqual(json.gasBudget, testSendManyTx.gasBudget);
    should.deepEqual(json.sendMessages, testSendManyTx.sendMessages);
    should.deepEqual(json.publicKey, toHex(fromBase64(testSendManyTx.pubKey)));
    should.deepEqual(json.sequence, testSendManyTx.sequence);
    should.deepEqual(
      tx.inputs,
      testSendManyTx.sendMessages.map((msg) => {
        return {
          address: msg.value.delegatorAddress,
          value: msg.value.amount.amount,
          coin: 'ttia',
        };
      })
    );
    should.deepEqual(
      tx.outputs,
      testSendManyTx.sendMessages.map((msg) => {
        return {
          address: msg.value.validatorAddress,
          value: msg.value.amount.amount,
          coin: 'ttia',
        };
      })
    );
    should.equal(tx.id, testSendManyTx.hash);
    const rawTx = tx.toBroadcastFormat();
    should.equal(rawTx, testSendManyTx.signedTxBase64);
  });
});
