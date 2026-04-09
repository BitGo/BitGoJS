import { toHex, TransactionType } from '@bitgo/sdk-core';
import { fromBase64 } from '@cosmjs/encoding';
import axios from 'axios';
import should from 'should';

import { KeyPair } from '../../../src';
import * as testData from '../../resources/atom';
import { getBuilderFactory } from '../getBuilderFactory';

describe('Atom Delegate txn Builder', () => {
  const factory = getBuilderFactory('tatom');
  const testTx = testData.TEST_DELEGATE_TX;
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
        coin: 'tatom',
      },
    ]);
    should.deepEqual(tx.outputs, [
      {
        address: testTx.validator,
        value: testTx.sendMessage.value.amount.amount,
        coin: 'tatom',
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
        coin: 'tatom',
      },
    ]);
    should.deepEqual(tx.outputs, [
      {
        address: testTx.validator,
        value: testTx.sendMessage.value.amount.amount,
        coin: 'tatom',
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
        coin: 'tatom',
      },
    ]);
    should.deepEqual(tx.outputs, [
      {
        address: testTx.validator,
        value: testTx.sendMessage.value.amount.amount,
        coin: 'tatom',
      },
    ]);
  });

  xit('should submit a send transaction', async () => {
    const keyPair = new KeyPair({ prv: toHex(fromBase64(testTx.privateKey)) });
    const axiosConfig = {
      headers: {
        'Content-Type': 'application/cbor',
      },
      timeout: 10000,
    };

    const txBuilder = factory.getStakingActivateBuilder();
    txBuilder.sequence(10);
    txBuilder.gasBudget(testTx.gasBudget);
    txBuilder.messages([testTx.sendMessage.value]);
    txBuilder.accountNumber(testTx.accountNumber);
    txBuilder.chainId(testTx.chainId);
    txBuilder.sign({ key: keyPair.getKeys().prv });
    const tx = await txBuilder.build();
    const serializedTx = tx.toBroadcastFormat();

    try {
      const res = await axios.post(
        'https://rest.sentry-01.theta-testnet.polypore.xyz/cosmos/tx/v1beta1/txs',
        {
          mode: 'BROADCAST_MODE_BLOCK',
          tx_bytes: serializedTx,
        },
        axiosConfig
      );
      console.log(res);
    } catch (err) {
      console.log(err);
    }
  });
});
