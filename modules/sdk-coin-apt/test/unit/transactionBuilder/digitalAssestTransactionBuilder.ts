import { getBuilderFactory } from '../getBuilderFactory';
import { coins } from '@bitgo/statics';
import * as testData from '../../resources/apt';
import { TransactionType } from '@bitgo/sdk-core';
import should from 'should';
import { DigitalAssetTransaction } from '../../../src/lib/transaction/digitalAssetTransaction';

describe('Apt Digital Asset Transfer Builder', () => {
  const factory = getBuilderFactory('tapt');
  //TODO: change coin 'tapt' to digital asset (nft) when configured
  it('should build a digital asset transfer', async function () {
    const digitalAssetTransfer = new DigitalAssetTransaction(coins.get('tapt'));
    const txBuilder = factory.getDigitalAssetTransactionBuilder(digitalAssetTransfer);
    txBuilder.sender(testData.sender2.address);
    txBuilder.recipient(testData.digitalTokenRecipients[0]);
    txBuilder.gasData({
      maxGasAmount: 200000,
      gasUnitPrice: 100,
    });
    txBuilder.assetId(testData.digitalAssetAddress);
    txBuilder.sequenceNumber(14);
    txBuilder.expirationTime(1736246155);
    txBuilder.addFeePayerAddress(testData.feePayer.address);
    const tx = (await txBuilder.build()) as DigitalAssetTransaction;
    should.equal(tx.sender, testData.sender2.address);
    should.equal(tx.recipient.address, testData.digitalTokenRecipients[0].address);
    should.equal(tx.assetId, testData.digitalAssetAddress);
    should.equal(tx.maxGasAmount, 200000);
    should.equal(tx.gasUnitPrice, 100);
    should.equal(tx.sequenceNumber, 14);
    should.equal(tx.expirationTime, 1736246155);
    should.equal(tx.type, TransactionType.SendNFT);
    tx.inputs.length.should.equal(1);
    tx.inputs[0].should.deepEqual({
      address: testData.sender2.address,
      value: testData.digitalTokenRecipients[0].amount,
      coin: 'tapt',
    });
    tx.outputs.length.should.equal(1);
    tx.outputs[0].should.deepEqual({
      address: testData.digitalTokenRecipients[0].address,
      value: testData.digitalTokenRecipients[0].amount,
      coin: 'tapt',
    });
    const rawTx = tx.toBroadcastFormat();
    should.equal(txBuilder.isValidRawTransaction(rawTx), true);
    rawTx.should.equal(
      '0x1aed808916ab9b1b30b07abb53561afd46847285ce28651221d406173a3724490e00000000000000020000000000000000000000000000000000000000000000000000000000000001066f626a656374087472616e736665720107000000000000000000000000000000000000000000000000000000000000000405746f6b656e05546f6b656e0002202e356062777469d39ca5d9b72512ce2d5713d7938ed6ca9193d4fc2016a819fd20f7405c28a02cf5bab4ea4498240bb3579db45951794eb1c843bef0534c093ad9400d03000000000064000000000000008b037d670000000002030020000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000dbc87a1c816d9bcd06b683c37e80c7162e4d48da7812198b830e4d5d8e0629f2002000000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
    );
  });

  it('should build and send a signed tx', async function () {
    const txBuilder = factory.from(testData.DIGITAL_ASSET_TRANSFER);
    const tx = (await txBuilder.build()) as DigitalAssetTransaction;
    should.equal(tx.type, TransactionType.SendNFT);
    tx.inputs.length.should.equal(1);
    tx.inputs[0].should.deepEqual({
      address: testData.sender2.address,
      value: testData.digitalTokenRecipients[0].amount,
      coin: 'tapt',
    });
    tx.outputs.length.should.equal(1);
    tx.outputs[0].should.deepEqual({
      address: testData.digitalTokenRecipients[0].address,
      value: testData.digitalTokenRecipients[0].amount,
      coin: 'tapt',
    });
    should.equal(tx.id, '0xfb4f870c4ae1bc74f6ceff72d8ee92f109239be8e12ddb07ddf30d7e6bd30586');
    should.equal(tx.maxGasAmount, 200000);
    should.equal(tx.gasUnitPrice, 100);
    should.equal(tx.sequenceNumber, 171);
    should.equal(tx.expirationTime, 1738041170);
    should.equal(tx.type, TransactionType.SendNFT);
    const rawTx = tx.toBroadcastFormat();
    should.equal(txBuilder.isValidRawTransaction(rawTx), true);
    should.equal(rawTx, testData.DIGITAL_ASSET_TRANSFER);
  });

  it('should succeed to validate a valid signablePayload', async function () {
    const transaction = new DigitalAssetTransaction(coins.get('tapt'));
    const txBuilder = factory.getDigitalAssetTransactionBuilder(transaction);
    txBuilder.sender(testData.sender2.address);
    txBuilder.recipient(testData.digitalTokenRecipients[0]);
    txBuilder.gasData({
      maxGasAmount: 200000,
      gasUnitPrice: 100,
    });
    txBuilder.sequenceNumber(14);
    txBuilder.expirationTime(1736246155);
    txBuilder.assetId(testData.digitalAssetAddress);
    txBuilder.addFeePayerAddress(testData.feePayer.address);
    const tx = (await txBuilder.build()) as DigitalAssetTransaction;
    const signablePayload = tx.signablePayload;
    should.equal(
      signablePayload.toString('hex'),
      '5efa3c4f02f83a0f4b2d69fc95c607cc02825cc4e7be536ef0992df050d9e67c011aed808916ab9b1b30b07abb53561afd46847285ce28651221d406173a3724490e00000000000000020000000000000000000000000000000000000000000000000000000000000001066f626a656374087472616e736665720107000000000000000000000000000000000000000000000000000000000000000405746f6b656e05546f6b656e0002202e356062777469d39ca5d9b72512ce2d5713d7938ed6ca9193d4fc2016a819fd20f7405c28a02cf5bab4ea4498240bb3579db45951794eb1c843bef0534c093ad9400d03000000000064000000000000008b037d67000000000200dbc87a1c816d9bcd06b683c37e80c7162e4d48da7812198b830e4d5d8e0629f2'
    );
  });

  it('should build a unsigned tx and validate its toJson', async function () {
    const transaction = new DigitalAssetTransaction(coins.get('tapt'));
    const txBuilder = factory.getDigitalAssetTransactionBuilder(transaction);
    txBuilder.sender(testData.sender2.address);
    txBuilder.recipient(testData.digitalTokenRecipients[0]);
    txBuilder.gasData({
      maxGasAmount: 200000,
      gasUnitPrice: 100,
    });
    txBuilder.sequenceNumber(14);
    txBuilder.expirationTime(1736246155);
    txBuilder.assetId(testData.digitalAssetAddress);
    txBuilder.addFeePayerAddress(testData.feePayer.address);
    const tx = (await txBuilder.build()) as DigitalAssetTransaction;
    const toJson = tx.toJson();
    should.equal(toJson.sender, testData.sender2.address);
    should.deepEqual(toJson.recipient, {
      address: testData.digitalTokenRecipients[0].address,
      amount: testData.digitalTokenRecipients[0].amount,
    });
    should.equal(toJson.sequenceNumber, 14);
    should.equal(tx.assetId, testData.digitalAssetAddress);
    should.equal(toJson.maxGasAmount, 200000);
    should.equal(toJson.gasUnitPrice, 100);
    should.equal(toJson.expirationTime, 1736246155);
    should.equal(toJson.feePayer, testData.feePayer.address);
  });

  it('should build a signed tx and validate its toJson', async function () {
    const txBuilder = factory.from(testData.DIGITAL_ASSET_TRANSFER);
    const tx = (await txBuilder.build()) as DigitalAssetTransaction;
    const toJson = tx.toJson();
    should.equal(toJson.id, '0xfb4f870c4ae1bc74f6ceff72d8ee92f109239be8e12ddb07ddf30d7e6bd30586');
    should.equal(toJson.sender, testData.sender2.address);
    should.deepEqual(toJson.recipient, {
      address: testData.digitalTokenRecipients[0].address,
      amount: testData.digitalTokenRecipients[0].amount.toString(),
    });
    should.equal(tx.assetId, testData.digitalAssetAddress);
    should.equal(toJson.sequenceNumber, 171);
    should.equal(toJson.maxGasAmount, 200000);
    should.equal(toJson.gasUnitPrice, 100);
    should.equal(toJson.expirationTime, 1738041170);
  });
});
