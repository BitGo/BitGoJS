import { toHex, TransactionType } from '@bitgo/sdk-core';
import { fromBase64 } from '@cosmjs/encoding';
import should from 'should';

import * as testData from '../../resources/asi';
import { getBuilderFactory } from '../getBuilderFactory';

describe('Fetch Undelegate txn Builder', () => {
  const factory = getBuilderFactory('tasi');
  const testTx = testData.TEST_UNDELEGATE_TX;
  it('should build undelegate tx with signature', async function () {
    const txBuilder = factory.getStakingDeactivateBuilder();
    txBuilder.sequence(testTx.sequence);
    txBuilder.gasBudget(testTx.gasBudget);
    txBuilder.messages([testTx.sendMessage.value]);
    txBuilder.addSignature({ pub: toHex(fromBase64(testTx.pubKey)) }, Buffer.from(testTx.signature, 'base64'));
    const tx = await txBuilder.build();
    const json = await (await txBuilder.build()).toJson();
    should.equal(tx.type, TransactionType.StakingDeactivate);
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
        coin: 'tasi',
      },
    ]);
    should.deepEqual(tx.outputs, [
      {
        address: testTx.validator,
        value: testTx.sendMessage.value.amount.amount,
        coin: 'tasi',
      },
    ]);
  });

  it('should build undelegate tx without signature', async function () {
    const txBuilder = factory.getStakingDeactivateBuilder();
    txBuilder.sequence(testTx.sequence);
    txBuilder.gasBudget(testTx.gasBudget);
    txBuilder.messages([testTx.sendMessage.value]);
    txBuilder.publicKey(toHex(fromBase64(testTx.pubKey)));
    const tx = await txBuilder.build();
    const json = await (await txBuilder.build()).toJson();
    should.equal(tx.type, TransactionType.StakingDeactivate);
    should.deepEqual(json.gasBudget, testTx.gasBudget);
    should.deepEqual(json.sendMessages, [testTx.sendMessage]);
    should.deepEqual(json.publicKey, toHex(fromBase64(testTx.pubKey)));
    should.deepEqual(json.sequence, testTx.sequence);
    tx.toBroadcastFormat();
    should.deepEqual(tx.inputs, [
      {
        address: testTx.delegator,
        value: testTx.sendMessage.value.amount.amount,
        coin: 'tasi',
      },
    ]);
    should.deepEqual(tx.outputs, [
      {
        address: testTx.validator,
        value: testTx.sendMessage.value.amount.amount,
        coin: 'tasi',
      },
    ]);
  });
});
