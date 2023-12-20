import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';

import { TransactionBuilder } from '../../../src';
import * as testData from '../../resources';
import { coins } from '@bitgo/statics';

describe('Rbtc send transaction', function () {
  let txBuilder: TransactionBuilder;
  const contractAddress = '0xab52bc0aff1b4851a60c1e5e628b1da995445651';
  const initTxBuilder = (): void => {
    txBuilder = new TransactionBuilder(coins.get('trbtc'));
    txBuilder.fee({
      fee: '1000000000',
      gasLimit: '12100000',
    });
    txBuilder.counter(2);
    txBuilder.type(TransactionType.Send);
    txBuilder.contract(contractAddress);
  };

  const key = testData.KEYPAIR_PRV.getKeys().prv as string;

  it('a send funds transaction', async () => {
    initTxBuilder();
    const recipient = testData.ACCOUNT_2;
    const amount = '1000000000';
    txBuilder.transfer().amount(amount).to(recipient).expirationTime(1590066728).contractSequenceId(5).key(key);
    txBuilder.sign({ key: testData.PRIVATE_KEY_1 });
    const tx = await txBuilder.build();
    should.equal(tx.toJson().chainId, 31);

    should.equal(tx.toBroadcastFormat(), testData.SEND_TX_BROADCAST);
    should.equal(tx.signature.length, 2);
    should.equal(tx.inputs.length, 1);
    should.equal(tx.inputs[0].address, contractAddress);
    should.equal(tx.inputs[0].value, amount);
    should.equal(tx.outputs.length, 1);
    should.equal(tx.outputs[0].address, recipient);
    should.equal(tx.outputs[0].value, amount);
  });

  it('a send funds unsigned transaction with final v', async () => {
    initTxBuilder();
    const recipient = testData.ACCOUNT_2;
    const amount = '1000000000';
    txBuilder.transfer().amount(amount).to(recipient).expirationTime(1590066728).contractSequenceId(5).key(key);
    const tx = await txBuilder.build();
    should.equal(tx.toJson().v, '0x61');
  });

  it('a send funds with amount 0 transaction', async () => {
    initTxBuilder();
    txBuilder.transfer().amount('0').to(testData.ACCOUNT_2).expirationTime(1590066728).contractSequenceId(5).key(key);
    txBuilder.sign({ key: testData.PRIVATE_KEY_1 });
    const tx = await txBuilder.build();
    should.equal(tx.toBroadcastFormat(), testData.SEND_TX_AMOUNT_ZERO_BROADCAST);
  });
});

describe('should sign and build from serialized', () => {
  it('a send funds transaction from serialized', async () => {
    const txBuilder = new TransactionBuilder(coins.get('trbtc'));
    txBuilder.from(testData.SEND_TX_BROADCAST);
    const signedTx = await txBuilder.build();
    should.equal(signedTx.toBroadcastFormat(), testData.SEND_TX_BROADCAST);
  });

  it('a send funds transaction with amount 0 from serialized', async () => {
    const txBuilder = new TransactionBuilder(coins.get('trbtc'));
    txBuilder.from(testData.SEND_TX_AMOUNT_ZERO_BROADCAST);
    const signedTx = await txBuilder.build();
    should.equal(signedTx.toBroadcastFormat(), testData.SEND_TX_AMOUNT_ZERO_BROADCAST);
  });
});
