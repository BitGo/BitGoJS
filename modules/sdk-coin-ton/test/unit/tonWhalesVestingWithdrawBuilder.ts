import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilderFactory } from '../../src';
import { coins } from '@bitgo/statics';
import * as testData from '../resources/ton';

describe('Ton Whales Vesting Withdraw Builder', () => {
  const factory = new TransactionBuilderFactory(coins.get('tton'));
  const fixture = testData.tonWhalesVestingWithdrawFixture;

  it('should build an unsigned vesting withdraw transaction', async function () {
    const txBuilder = factory.getTonWhalesVestingWithdrawBuilder();

    txBuilder.sender(fixture.sender);
    txBuilder.publicKey(fixture.publicKey);
    txBuilder.sequenceNumber(fixture.seqno);
    txBuilder.expireTime(fixture.expireTime);
    txBuilder.bounceable(fixture.bounceable);

    txBuilder.send({
      address: fixture.recipient.address,
      amount: fixture.recipient.amount,
    });
    txBuilder.setForwardAmount(fixture.recipient.amount);
    txBuilder.setWithdrawMessage();

    const tx = await txBuilder.build();

    should.equal(tx.type, TransactionType.TonWhalesVestingWithdrawal);
    should.equal(tx.toJson().bounceable, fixture.bounceable);
    should.equal(tx.toJson().destination, fixture.recipient.address);
    should.equal(tx.toJson().amount, fixture.recipient.amount);

    tx.inputs.length.should.equal(1);
    tx.inputs[0].should.deepEqual({
      address: fixture.sender,
      value: fixture.recipient.amount,
      coin: 'tton',
    });

    tx.outputs.length.should.equal(1);
    tx.outputs[0].should.deepEqual({
      address: fixture.recipient.address,
      value: fixture.recipient.amount,
      coin: 'tton',
    });
  });

  it('should build and parse a vesting withdraw transaction', async function () {
    const txBuilder = factory.getTonWhalesVestingWithdrawBuilder();

    txBuilder.sender(fixture.sender);
    txBuilder.publicKey(fixture.publicKey);
    txBuilder.sequenceNumber(fixture.seqno);
    txBuilder.expireTime(fixture.expireTime);
    txBuilder.bounceable(fixture.bounceable);

    txBuilder.send({
      address: fixture.recipient.address,
      amount: fixture.recipient.amount,
    });
    txBuilder.setForwardAmount(fixture.recipient.amount);
    txBuilder.setWithdrawMessage();

    const tx = await txBuilder.build();
    const rawTx = tx.toBroadcastFormat();

    const txBuilder2 = factory.from(rawTx);
    const tx2 = await txBuilder2.build();

    should.equal(tx2.type, TransactionType.TonWhalesVestingWithdrawal);
    should.equal(tx2.toBroadcastFormat(), rawTx);
  });

  it('should set the correct message for vesting withdraw', async function () {
    const txBuilder = factory.getTonWhalesVestingWithdrawBuilder();

    txBuilder.sender(fixture.sender);
    txBuilder.publicKey(fixture.publicKey);
    txBuilder.sequenceNumber(fixture.seqno);
    txBuilder.expireTime(fixture.expireTime);
    txBuilder.bounceable(fixture.bounceable);

    txBuilder.send({
      address: fixture.recipient.address,
      amount: fixture.recipient.amount,
    });
    txBuilder.setForwardAmount(fixture.recipient.amount);
    txBuilder.setWithdrawMessage();

    const tx = await txBuilder.build();
    const message = tx['message'];
    should.equal(message, 'Withdraw');
  });

  it('should support vesting contract specific flags', async function () {
    const txBuilder = factory.getTonWhalesVestingWithdrawBuilder();

    txBuilder.sender(fixture.sender);
    txBuilder.publicKey(fixture.publicKey);
    txBuilder.sequenceNumber(fixture.seqno);
    txBuilder.expireTime(fixture.expireTime);
    txBuilder.bounceable(true);
    txBuilder.isV3ContractMessage(true);
    txBuilder.subWalletId(268);

    txBuilder.send({
      address: fixture.recipient.address,
      amount: fixture.recipient.amount,
    });
    txBuilder.setForwardAmount(fixture.recipient.amount);
    txBuilder.setWithdrawMessage();

    const tx = await txBuilder.build();

    should.equal(tx.type, TransactionType.TonWhalesVestingWithdrawal);
    should.equal(tx.toJson().bounceable, true);
    should.equal(tx.toJson().sub_wallet_id, 268);
  });
});
