import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from '../../../src';
import { getBuilder } from '../../../src/lib/builder';
import * as testData from '../../resources';
import { decodeTransferData } from '@bitgo/sdk-coin-eth';

describe('Etc send transaction', function () {
  let txBuilder: TransactionBuilder;
  const contractAddress = '0x7073b82be1d932c70afe505e1fe211916e978c34';
  const initTxBuilder = (): void => {
    txBuilder = getBuilder('tetc') as TransactionBuilder;
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
    const expireTime = 1590066728;
    const sequenceId = 5;
    txBuilder
      .transfer()
      .amount(amount)
      .to(recipient)
      .expirationTime(1590066728)
      .contractSequenceId(sequenceId)
      .key(key);
    txBuilder.sign({ key: testData.PRIVATE_KEY_1 });
    const tx = await txBuilder.build();
    should.equal(tx.toJson().chainId, 63);

    should.equal(tx.toBroadcastFormat(), testData.SEND_TX_BROADCAST);
    should.equal(tx.signature.length, 2);
    should.equal(tx.inputs.length, 1);
    should.equal(tx.inputs[0].address, contractAddress);
    should.equal(tx.inputs[0].value, amount);
    should.equal(tx.outputs.length, 1);
    should.equal(tx.outputs[0].address, recipient);
    should.equal(tx.outputs[0].value, amount);

    const data = tx.toJson().data;
    const {
      to,
      amount: parsedAmount,
      expireTime: parsedExpireTime,
      sequenceId: parsedSequenceId,
    } = decodeTransferData(data);
    should.equal(to, recipient);
    should.equal(parsedAmount, amount);
    should.equal(parsedExpireTime, expireTime);
    should.equal(parsedSequenceId, sequenceId);
  });

  it('a send funds with amount 0 transaction', async () => {
    initTxBuilder();
    txBuilder.transfer().amount('0').to(testData.ACCOUNT_2).expirationTime(1590066728).contractSequenceId(5).key(key);
    txBuilder.sign({ key: testData.PRIVATE_KEY_1 });
    const tx = await txBuilder.build();
    should.equal(tx.toBroadcastFormat(), testData.SEND_TX_AMOUNT_ZERO_BROADCAST);
  });
  it('unsigned transaction with final v check', async () => {
    initTxBuilder();
    txBuilder.transfer().amount('0').to(testData.ACCOUNT_2).expirationTime(1590066728).contractSequenceId(5).key(key);
    const tx = await txBuilder.build();
    should.equal(tx.toJson().v, '0xa1');
  });
});

describe('should sign and build from serialized', () => {
  it('a send funds transaction from serialized', async () => {
    const txBuilder = getBuilder('tetc') as TransactionBuilder;
    txBuilder.from(testData.SEND_TX_BROADCAST);
    const signedTx = await txBuilder.build();
    should.equal(signedTx.toBroadcastFormat(), testData.SEND_TX_BROADCAST);
  });

  it('a send funds transaction with amount 0 from serialized', async () => {
    const txBuilder = getBuilder('tetc') as TransactionBuilder;
    txBuilder.from(testData.SEND_TX_AMOUNT_ZERO_BROADCAST);
    const signedTx = await txBuilder.build();
    should.equal(signedTx.toBroadcastFormat(), testData.SEND_TX_AMOUNT_ZERO_BROADCAST);
  });
});
