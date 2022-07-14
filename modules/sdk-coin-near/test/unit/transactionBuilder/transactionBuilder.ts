import assert from 'assert';
import should from 'should';
import { getBuilderFactory } from '../getBuilderFactory';
import { TransactionType } from '@bitgo/sdk-core';
import * as testData from '../../resources/near';

describe('NEAR Transaction Builder', async () => {
  let builders;

  const factory = getBuilderFactory('tnear');

  beforeEach(function (done) {
    builders = [factory.getTransferBuilder()];
    done();
  });

  it('start and build an empty a transfer tx', async () => {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.sender(testData.accounts.account1.address, testData.accounts.account1.publicKey);
    txBuilder.nonce(1);
    txBuilder.receiverId(testData.accounts.account2.address);
    txBuilder.recentBlockHash(testData.blockHash.block1);
    txBuilder.amount(testData.AMOUNT);
    const tx = await txBuilder.build();
    should.equal(tx.type, TransactionType.Send);

    const txBroadcast = tx.toBroadcastFormat();
    should.equal(txBroadcast, testData.rawTx.transfer.unsigned);
  });

  it('build and sign a transfer tx', async () => {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.sender(testData.accounts.account1.address, testData.accounts.account1.publicKey);
    txBuilder.nonce(1);
    txBuilder.receiverId(testData.accounts.account2.address);
    txBuilder.recentBlockHash(testData.blockHash.block1);
    txBuilder.amount(testData.AMOUNT);
    txBuilder.sign({ key: testData.accounts.account1.secretKey });
    const tx = await txBuilder.build();
    should.equal(tx.type, TransactionType.Send);

    const txBroadcast = tx.toBroadcastFormat();
    should.equal(txBroadcast, testData.rawTx.transfer.signed);
  });

  it('should fail to build if missing sender', async () => {
    for (const txBuilder of builders) {
      txBuilder.nonce(1);
      txBuilder.receiverId(testData.accounts.account2.address);
      txBuilder.recentBlockHash(testData.blockHash.block1);
      txBuilder.amount(testData.AMOUNT);
      await txBuilder.build().should.rejectedWith('sender is required before building');
    }
  });

  it('build a send from rawTx', async () => {
    const txBuilder = factory.from(testData.rawTx.transfer.unsigned);
    const builtTx = await txBuilder.build();
    should.equal(builtTx.type, TransactionType.Send);
    should.equal(builtTx.id, '5jTEPuDcMCeEgp1iyEbNBKsnhYz4F4c1EPDtRmxm3wCw');
    builtTx.inputs.length.should.equal(1);
    builtTx.inputs[0].should.deepEqual({
      address: testData.accounts.account1.address,
      value: testData.AMOUNT,
      coin: 'tnear',
    });
    builtTx.outputs.length.should.equal(1);
    builtTx.outputs[0].should.deepEqual({
      address: testData.accounts.account2.address,
      value: testData.AMOUNT,
      coin: 'tnear',
    });
    const jsonTx = builtTx.toJson();
    jsonTx.signerId.should.equal(testData.accounts.account1.address);
  });

  it('build a send from signed rawTx', async () => {
    const txBuilder = factory.from(testData.rawTx.transfer.signed);
    const builtTx = await txBuilder.build();
    should.equal(builtTx.type, TransactionType.Send);
    should.equal(builtTx.id, '5jTEPuDcMCeEgp1iyEbNBKsnhYz4F4c1EPDtRmxm3wCw');
    builtTx.inputs.length.should.equal(1);
    builtTx.inputs[0].should.deepEqual({
      address: testData.accounts.account1.address,
      value: testData.AMOUNT,
      coin: 'tnear',
    });
    builtTx.outputs.length.should.equal(1);
    builtTx.outputs[0].should.deepEqual({
      address: testData.accounts.account2.address,
      value: testData.AMOUNT,
      coin: 'tnear',
    });
    const jsonTx = builtTx.toJson();

    jsonTx.signerId.should.equal(testData.accounts.account1.address);
  });

  it('should fail to build if have invalid blockHash', async () => {
    for (const txBuilder of builders) {
      txBuilder.sender(testData.accounts.account1.address, testData.accounts.account1.publicKey);
      txBuilder.nonce(1);
      txBuilder.receiverId(testData.accounts.account2.address);
      assert.throws(
        () => txBuilder.recentBlockHash(testData.errorBlockHash.block1),
        new RegExp('Invalid blockHash CDEwwp7TjjahErrorriSvX3457qZ5uF3TtgEZHj7o5ssKFNs9')
      );
    }
  });

  it('should fail to build if have invalid nonce', async () => {
    for (const txBuilder of builders) {
      txBuilder.sender(testData.accounts.account1.address, testData.accounts.account1.publicKey);
      assert.throws(() => txBuilder.nonce(-1), /Invalid nonce: -1/);
    }
  });

  it('should fail to build if have undefined address', async () => {
    for (const txBuilder of builders) {
      assert.throws(
        () => txBuilder.sender(testData.accounts.account1.publicKey),
        new RegExp('Invalid or missing pubKey, got: undefined')
      );
    }
  });
});
