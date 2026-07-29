import { BitGoAPI } from '@bitgo/sdk-api';
import { toHex, TransactionType } from '@bitgo/sdk-core';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { fromBase64 } from '@cosmjs/encoding';
import should from 'should';
import { Tzeta, Zeta } from '../../../src';
import * as testData from '../../resources/zeta';

describe('Zeta Redelegate txn Builder', () => {
  let bitgo: TestBitGoAPI;
  let basecoin;
  let factory;
  let testTx;
  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('zeta', Zeta.createInstance);
    bitgo.safeRegister('tzeta', Tzeta.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tzeta');
    factory = basecoin.getBuilder();
    testTx = testData.TEST_REDELEGATE_TX;
  });

  // https://explorer.zetachain.com/cosmos/tx/B88877498F54E8A87E929DBC809321A0B0E0AF53BE63906B50C19093C2C4BF7A
  it('should build a Redelegate tx with signature', async function () {
    const txBuilder = factory.getStakingRedelegateBuilder();
    txBuilder.sequence(testTx.sequence);
    txBuilder.gasBudget(testTx.gasBudget);
    txBuilder.messages([testTx.sendMessage.value]);
    txBuilder.memo('');
    txBuilder.publicKey(toHex(fromBase64(testTx.pubKey)));
    txBuilder.addSignature({ pub: toHex(fromBase64(testTx.pubKey)) }, Buffer.from(testTx.signature, 'base64'));

    const tx = await txBuilder.build();
    const json = await (await txBuilder.build()).toJson();
    should.equal(tx.type, TransactionType.StakingRedelegate);
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
});
