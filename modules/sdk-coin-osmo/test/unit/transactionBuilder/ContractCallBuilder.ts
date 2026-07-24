import { toHex, TransactionType } from '@bitgo/sdk-core';
import { fromBase64 } from '@cosmjs/encoding';
import should from 'should';

import * as testData from '../../resources/osmo';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Osmo, Tosmo } from '../../../src';

describe('Osmo contract call txn Builder', () => {
  let bitgo: TestBitGoAPI;
  let basecoin;
  let factory;
  let testTx;
  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('osmo', Osmo.createInstance);
    bitgo.safeRegister('tosmo', Tosmo.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tosmo');
    factory = basecoin.getBuilder();
    testTx = testData.TEST_EXECUTE_CONTRACT_TRANSACTION;
  });

  it('should build a contractCall tx with signature', async function () {
    const txBuilder = factory.getContractCallBuilder();
    txBuilder.sequence(testTx.sequence);
    txBuilder.gasBudget(testTx.gasBudget);
    txBuilder.messages([testTx.message.value]);
    txBuilder.publicKey(toHex(fromBase64(testTx.pubKey)));
    txBuilder.addSignature({ pub: toHex(fromBase64(testTx.pubKey)) }, Buffer.from(testTx.signature, 'base64'));

    const tx = await txBuilder.build();
    const json = await (await txBuilder.build()).toJson();
    should.equal(tx.type, TransactionType.ContractCall);
    should.deepEqual(json.gasBudget, testTx.gasBudget);
    should.deepEqual(json.sendMessages, [testTx.message]);
    should.deepEqual(json.publicKey, toHex(fromBase64(testTx.pubKey)));
    should.deepEqual(json.sequence, testTx.sequence);
    const rawTx = tx.toBroadcastFormat();
    should.equal(rawTx, testTx.signedTxBase64);
    should.deepEqual(tx.inputs, [
      {
        address: testTx.from,
        value: '0',
        coin: basecoin.getChain(),
      },
    ]);
    should.deepEqual(tx.outputs, [
      {
        address: testTx.to,
        value: '0',
        coin: basecoin.getChain(),
      },
    ]);
  });

  it('should build a contractCall tx without signature', async function () {
    const txBuilder = factory.getContractCallBuilder();
    txBuilder.sequence(testTx.sequence);
    txBuilder.gasBudget(testTx.gasBudget);
    txBuilder.messages([testTx.message.value]);
    txBuilder.publicKey(toHex(fromBase64(testTx.pubKey)));
    const tx = await txBuilder.build();
    const json = await (await txBuilder.build()).toJson();
    should.equal(tx.type, TransactionType.ContractCall);
    should.deepEqual(json.gasBudget, testTx.gasBudget);
    should.deepEqual(json.sendMessages, [testTx.message]);
    should.deepEqual(json.publicKey, toHex(fromBase64(testTx.pubKey)));
    should.deepEqual(json.sequence, testTx.sequence);
    tx.toBroadcastFormat();
    should.deepEqual(tx.inputs, [
      {
        address: testTx.from,
        value: '0',
        coin: basecoin.getChain(),
      },
    ]);
    should.deepEqual(tx.outputs, [
      {
        address: testTx.to,
        value: '0',
        coin: basecoin.getChain(),
      },
    ]);
  });

  it('should sign a contract call tx', async function () {
    const txBuilder = factory.getContractCallBuilder();
    txBuilder.sequence(testTx.sequence);
    txBuilder.gasBudget(testTx.gasBudget);
    txBuilder.messages([testTx.message.value]);
    txBuilder.accountNumber(testTx.accountNumber);
    txBuilder.chainId(testTx.chainId);
    txBuilder.sign({ key: toHex(fromBase64(testTx.privateKey)) });
    const tx = await txBuilder.build();
    const json = await (await txBuilder.build()).toJson();
    should.equal(tx.type, TransactionType.ContractCall);
    should.deepEqual(json.gasBudget, testTx.gasBudget);
    should.deepEqual(json.sendMessages, [testTx.message]);
    should.deepEqual(json.publicKey, toHex(fromBase64(testTx.pubKey)));
    should.deepEqual(json.sequence, testTx.sequence);
    const rawTx = tx.toBroadcastFormat();
    should.equal(tx.signature[0], toHex(fromBase64(testTx.signature)));
    should.equal(rawTx, testTx.signedTxBase64);
    should.deepEqual(tx.inputs, [
      {
        address: testTx.from,
        value: '0',
        coin: basecoin.getChain(),
      },
    ]);
    should.deepEqual(tx.outputs, [
      {
        address: testTx.to,
        value: '0',
        coin: basecoin.getChain(),
      },
    ]);
  });
});
