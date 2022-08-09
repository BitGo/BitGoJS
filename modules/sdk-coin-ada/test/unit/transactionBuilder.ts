import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import * as testData from '../resources';
import { TransactionBuilderFactory } from '../../src';
import { coins } from '@bitgo/statics';

describe('ADA Transaction Builder', async () => {
  const factory = new TransactionBuilderFactory(coins.get('tada'));
  it('start and build an unsigned transfer tx', async () => {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.input({
      transaction_id: '3677e75c7ba699bfdc6cd57d42f246f86f63aefd76025006ac78313fad2bba21',
      transaction_index: 1,
    });
    txBuilder.output({
      address:
        'addr1q8rm9z7w4yx5gz652kn2q238efvms6t0qelur9nlglun8eu4tr5knj4fu4adelzqhxg8adu5xca4jra0gtllfrpcawyq9psz23',
      amount: '7328383',
    });
    txBuilder.ttl(800000000);
    const tx = await txBuilder.build();
    should.equal(tx.type, TransactionType.Send);

    const txBroadcast = tx.toBroadcastFormat();
    should.equal(txBroadcast, testData.rawTx.unsignedTx2);
    const txData = tx.toJson();
    txData.witnesses.length.should.equal(0);
  });

  it('build and sign a transfer tx', async () => {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.input({
      transaction_id: '3677e75c7ba699bfdc6cd57d42f246f86f63aefd76025006ac78313fad2bba21',
      transaction_index: 1,
    });
    txBuilder.output({
      address:
        'addr1q8rm9z7w4yx5gz652kn2q238efvms6t0qelur9nlglun8eu4tr5knj4fu4adelzqhxg8adu5xca4jra0gtllfrpcawyq9psz23',
      amount: '7328383',
    });
    txBuilder.ttl(800000000);
    txBuilder.sign({ key: testData.privateKeys.prvKey4 });
    const tx = await txBuilder.build();
    should.equal(tx.type, TransactionType.Send);

    const txBroadcast = tx.toBroadcastFormat();
    should.equal(txBroadcast, testData.rawTx.signedTx2);
  });

  it('build a send from rawTx', async () => {
    const txBuilder = factory.from(testData.rawTx.signedTx);
    const builtTx = await txBuilder.build();
    should.equal(builtTx.type, TransactionType.Send);
    should.equal(builtTx.id, testData.rawTx.txHash);
    builtTx.inputs.length.should.equal(0);
    builtTx.outputs.length.should.equal(2);
    builtTx.outputs[0].should.deepEqual(testData.rawTx.outputAddress1);
    builtTx.outputs[1].should.deepEqual(testData.rawTx.outputAddress2);
  });

  it('build a send from unsigned rawTx', async () => {
    const txBuilder = factory.from(testData.rawTx.unsignedTx);
    const builtTx = await txBuilder.build();
    should.equal(builtTx.type, TransactionType.Send);
    should.equal(builtTx.id, testData.rawTx.txHash);
    builtTx.inputs.length.should.equal(0);
    builtTx.outputs.length.should.equal(2);
    builtTx.outputs[0].should.deepEqual(testData.rawTx.outputAddress1);
    builtTx.outputs[1].should.deepEqual(testData.rawTx.outputAddress2);
  });
});
