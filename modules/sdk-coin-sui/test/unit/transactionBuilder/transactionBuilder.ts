import { getBuilderFactory } from '../getBuilderFactory';
import * as testData from '../../resources/sui';
import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { SuiTransactionType } from '../../../src/lib/iface';
import { recipients } from '../../resources/sui';

describe('Sui Transaction Builder', async () => {
  let builders;
  const factory = getBuilderFactory('tsui');

  beforeEach(function (done) {
    builders = [factory.getTransferBuilder()];
    done();
  });

  it('should build a transfer transaction and serialize it and deserialize it', async function () {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.type(SuiTransactionType.Transfer);
    txBuilder.sender(testData.sender.address);
    txBuilder.send(recipients);
    txBuilder.gasData(testData.gasData);
    const tx = await txBuilder.build();
    should.equal(tx.type, TransactionType.Send);
    const rawTx = tx.toBroadcastFormat();
    should.equal(rawTx, testData.TRANSFER);
    const reserialized = await factory.from(rawTx).build();
    reserialized.should.be.deepEqual(tx);
    reserialized.toBroadcastFormat().should.equal(rawTx);
  });

  it('should build and sign a transfer paySui tx with gasPayment', async function () {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.type(SuiTransactionType.Transfer);
    txBuilder.sender(testData.sender.address);
    txBuilder.send(recipients);
    txBuilder.gasData(testData.gasData);
    const tx = await txBuilder.build();
    should.equal(tx.id, 'UNAVAILABLE');
    const rawTx = tx.toBroadcastFormat();
    should.equal(rawTx, testData.TRANSFER);

    const txBuilder2 = await factory.from(rawTx);
    await txBuilder2.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
    const signedTx = await txBuilder2.build();
    should.equal(signedTx.type, TransactionType.Send);
    should.equal(signedTx.id, 'Dc6ofSWTtQMUPrqZ5NqXsGgF2Cyom6H6Kze5T3tUv8Ut');

    const rawSignedTx = signedTx.toBroadcastFormat();
    should.equal(rawSignedTx, testData.TRANSFER);
    const reserializedTxBuilder = factory.from(rawSignedTx);
    reserializedTxBuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
    const reserialized = await reserializedTxBuilder.build();

    reserialized.should.be.deepEqual(signedTx);
    reserialized.toBroadcastFormat().should.equal(rawSignedTx);
  });

  it('should fail to build if missing type', async function () {
    for (const txBuilder of builders) {
      txBuilder.sender(testData.sender.address);
      txBuilder.send(recipients);
      txBuilder.gasData(testData.gasData);
      await txBuilder.build().should.rejectedWith('type is required before building');
    }
  });

  it('should fail to build if missing sender', async function () {
    for (const txBuilder of builders) {
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.send(recipients);
      txBuilder.gasData(testData.gasData);
      await txBuilder.build().should.rejectedWith('sender is required before building');
    }
  });

  it('should fail to build if missing recipients', async function () {
    for (const txBuilder of builders) {
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.gasData(testData.gasData);
      await txBuilder.build().should.rejectedWith('at least one recipient is required before building');
    }
  });

  it('should fail to build if missing gasData', async function () {
    for (const txBuilder of builders) {
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send(recipients);
      await txBuilder.build().should.rejectedWith('gasData is required before building');
    }
  });

  it('should fail to build if missing payment coins in gasData', async function () {
    for (const txBuilder of builders) {
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send(recipients);
      should(() => txBuilder.gasData(testData.gasDataWithoutGasPayment)).throwError(
        `gas payment is required before building`
      );
      await txBuilder.build().should.rejectedWith('gasData is required before building');
    }
  });

  it('should build a send from rawTx', async function () {
    const txBuilder = factory.from(testData.TRANSFER);
    const builtTx = await txBuilder.build();
    should.equal(builtTx.type, TransactionType.Send);
    should.equal(builtTx.id, 'Dc6ofSWTtQMUPrqZ5NqXsGgF2Cyom6H6Kze5T3tUv8Ut');
    builtTx.inputs.length.should.equal(1);
    builtTx.inputs[0].should.deepEqual({
      address: testData.sender.address,
      value: (testData.AMOUNT * 2).toString(),
      coin: 'tsui',
    });
    builtTx.outputs.length.should.equal(2);
    builtTx.outputs[0].should.deepEqual({
      address: testData.recipients[0].address,
      value: testData.recipients[0].amount,
      coin: 'tsui',
    });
    builtTx.outputs[1].should.deepEqual({
      address: testData.recipients[1].address,
      value: testData.recipients[1].amount,
      coin: 'tsui',
    });
    const jsonTx = builtTx.toJson();
    jsonTx.gasData.should.deepEqual(testData.gasData);
    jsonTx.kind.ProgrammableTransaction.should.deepEqual({
      inputs: testData.txInputs,
      commands: testData.txCommands,
    });
    jsonTx.sender.should.equal(testData.sender.address);
    jsonTx.gasData.should.deepEqual(testData.gasData);
    builtTx.toBroadcastFormat().should.equal(testData.TRANSFER);
  });
});
