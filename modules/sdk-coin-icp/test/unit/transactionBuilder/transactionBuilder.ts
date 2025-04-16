import should from 'should';
import { getBuilderFactory } from '../getBuilderFactory';
import { BaseKey } from '@bitgo/sdk-core';
import * as testData from '../../resources/icp';
import sinon from 'sinon';

describe('ICP Transaction Builder', async () => {
  const factory = getBuilderFactory('ticp');
  let txBuilder: any;
  let txn: any;

  beforeEach(async function () {
    txBuilder = factory.getTransferBuilder();
    sinon.stub(txBuilder._utils, 'getMetaData').returns({
      metaData: testData.metaData,
      ingressEndTime: testData.metaData.ingress_end,
    });

    txBuilder.sender(testData.accounts.account1.address, testData.accounts.account1.publicKey);
    txBuilder.receiverId(testData.accounts.account2.address);
    txBuilder.amount('10');
    txBuilder.memo(testData.metaData.memo);

    await txBuilder.build();
    txn = txBuilder.transaction;
  });

  afterEach(function () {
    sinon.restore();
  });

  it('should parse an unsigned transaction', async () => {
    const parsedUnsignedTxn = await factory.parseTransaction(testData.payloadsData.unsigned_transaction, false);
    txn.should.be.an.Object();
    should.deepEqual(parsedUnsignedTxn, testData.ParsedUnsignedTransaction);
  });

  it('should parse an signed transaction', async () => {
    const parsedSignedTxn = await factory.parseTransaction(testData.SignedTransaction, true);
    txn.should.be.an.Object();
    should.deepEqual(parsedSignedTxn, testData.ParsedSignedTransaction);
  });

  it('start and build a transfer tx', async () => {
    const icpTransaction = txBuilder.transaction.icpTransaction;
    const payloadsData = txBuilder.transaction.payloadsData;
    should.equal(icpTransaction.metadata.memo, testData.metaData.memo);
    should.equal(icpTransaction.operations[0].account.address, testData.accounts.account1.address);
    should.equal(icpTransaction.operations[1].account.address, testData.accounts.account2.address);
    should.equal(icpTransaction.operations[0].amount.value, '-10');
    should.equal(icpTransaction.operations[1].amount.value, '10');
    should.equal(icpTransaction.operations[2].amount.value, '-10000');
    should.equal(icpTransaction.public_keys[0].hex_bytes, testData.accounts.account1.publicKey);
    payloadsData.payloads.should.be.an.Array();
    payloadsData.payloads.length.should.equal(1);
    should.deepEqual(txBuilder.payloadData(), testData.payloadsData);
    should.deepEqual(payloadsData.payloads, testData.payloadsData.payloads);
  });

  it('should fail to build a txn without sender', async () => {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.receiverId(testData.accounts.account2.address);
    txBuilder.amount('10');
    txBuilder.memo(123456);
    await txBuilder.build().should.rejectedWith('sender is required before building');
  });

  it('should fail to build a txn without amount', async () => {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.sender(testData.accounts.account1.address, testData.accounts.account1.publicKey);
    txBuilder.receiverId(testData.accounts.account2.address);
    txBuilder.memo(123456);
    await txBuilder.build().should.rejectedWith('amount is required before building');
  });

  it('should build a signed txn and give txn in broadcast format', async () => {
    txn.addSignature(testData.Signatures);
    txBuilder.combine();
    const signedTxn = txBuilder.transaction.signedTransaction;
    signedTxn.should.be.a.String();
    should.equal(signedTxn, testData.SignedTransaction);
    const broadcastTxn = txBuilder.transaction.toBroadcastFormat();
    broadcastTxn.should.be.a.String();
    should.equal(broadcastTxn, signedTxn);
  });

  it('should sign a txn and then give txn in broadcast format', async () => {
    const baseKey: BaseKey = { key: testData.accounts.account1.secretKey };
    txBuilder.sign(baseKey);
    should.deepEqual(txBuilder.signaturePayload(), testData.Signatures);
    txBuilder.combine();
    const signedTxn = txBuilder.transaction.signedTransaction;
    signedTxn.should.be.a.String();
    should.equal(signedTxn, testData.SignedTransaction);
    const broadcastTxn = txBuilder.transaction.toBroadcastFormat();
    broadcastTxn.should.be.a.String();
    should.equal(broadcastTxn, signedTxn);
  });

  it('should build a txn then parse it and then again build', async () => {
    sinon.restore(); // do not stub getMetaData
    txBuilder = factory.getTransferBuilder();
    txBuilder.sender(testData.accounts.account1.address, testData.accounts.account1.publicKey);
    txBuilder.receiverId(testData.accounts.account2.address);
    txBuilder.amount('10');
    txBuilder.memo(testData.metaData.memo);

    await txBuilder.build();
    txn = txBuilder.transaction;
    const unsignedTxn = txBuilder.transaction.unsignedTransaction;
    unsignedTxn.should.be.a.String();
    const payloadsData = txBuilder.transaction.payloadsData;
    const serializedTxFormat = {
      serializedTxHex: payloadsData,
      publicKey: testData.accounts.account1.publicKey,
    };
    const serializedTxHex = Buffer.from(JSON.stringify(serializedTxFormat), 'utf-8').toString('hex');
    await txn.fromRawTransaction(serializedTxHex);
    const baseKey: BaseKey = { key: testData.accounts.account1.secretKey };
    txBuilder.sign(baseKey);
    txBuilder.combine();
    const signedTxn = txBuilder.transaction.signedTransaction;
    signedTxn.should.be.a.String();
  });
});

describe('ICP Transaction Builder without memo', async () => {
  const factory = getBuilderFactory('ticp');
  let txBuilder: any;
  let txn: any;

  beforeEach(async function () {
    txBuilder = factory.getTransferBuilder();
    sinon.stub(txBuilder._utils, 'getMetaData').returns({
      metaData: testData.transactionMetaData,
      ingressEndTime: testData.transactionMetaData.ingress_end,
    });

    txBuilder.sender(testData.accounts.account1.address, testData.accounts.account1.publicKey);
    txBuilder.receiverId(testData.accounts.account2.address);
    txBuilder.amount('10');

    await txBuilder.build();
    txn = txBuilder.transaction;
  });

  afterEach(function () {
    sinon.restore();
  });

  it('should parse an unsigned transaction without memo', async () => {
    const parsedUnsignedTxn = await factory.parseTransaction(
      testData.payloadsDataWithoutMemo.unsigned_transaction,
      false
    );
    txn.should.be.an.Object();
    delete (testData.ParsedUnsignedTransaction.metadata as any).memo;
    should.deepEqual(parsedUnsignedTxn, testData.ParsedUnsignedTransaction);
  });

  it('should parse an signed transaction without memo', async () => {
    const parsedSignedTxn = await factory.parseTransaction(testData.SignedTransactionWithoutMemo, true);
    txn.should.be.an.Object();
    delete (testData.ParsedSignedTransaction.metadata as any).memo;
    should.deepEqual(parsedSignedTxn, testData.ParsedSignedTransaction);
  });

  it('start and build a transfer tx without memo', async () => {
    const icpTransaction = txBuilder.transaction.icpTransaction;
    const payloadsData = txBuilder.transaction.payloadsData;
    should.equal(icpTransaction.metadata.memo, undefined);
    should.equal(icpTransaction.operations[0].account.address, testData.accounts.account1.address);
    should.equal(icpTransaction.operations[1].account.address, testData.accounts.account2.address);
    should.equal(icpTransaction.operations[0].amount.value, '-10');
    should.equal(icpTransaction.operations[1].amount.value, '10');
    should.equal(icpTransaction.operations[2].amount.value, '-10000');
    should.equal(icpTransaction.public_keys[0].hex_bytes, testData.accounts.account1.publicKey);
    payloadsData.payloads.should.be.an.Array();
    payloadsData.payloads.length.should.equal(1);
    should.deepEqual(txBuilder.payloadData(), testData.payloadsDataWithoutMemo);
    should.deepEqual(payloadsData.payloads, testData.payloadsDataWithoutMemo.payloads);
  });

  it('should build a signed txn without memo and give txn in broadcast format', async () => {
    txn.addSignature(testData.SignaturesWithoutMemo);
    txBuilder.combine();
    const signedTxn = txBuilder.transaction.signedTransaction;
    signedTxn.should.be.a.String();
    should.equal(signedTxn, testData.SignedTransactionWithoutMemo);
    const broadcastTxn = txBuilder.transaction.toBroadcastFormat();
    broadcastTxn.should.be.a.String();
    should.equal(broadcastTxn, signedTxn);
  });

  it('should sign a txn without memo and then give txn in broadcast format', async () => {
    const baseKey: BaseKey = { key: testData.accounts.account1.secretKey };
    txBuilder.sign(baseKey);
    should.deepEqual(txBuilder.signaturePayload(), testData.SignaturesWithoutMemo);
    txBuilder.combine();
    const signedTxn = txBuilder.transaction.signedTransaction;
    signedTxn.should.be.a.String();
    should.equal(signedTxn, testData.SignedTransactionWithoutMemo);
    const broadcastTxn = txBuilder.transaction.toBroadcastFormat();
    broadcastTxn.should.be.a.String();
    should.equal(broadcastTxn, signedTxn);
  });

  it('should build a txn without memo then parse it and then again build', async () => {
    sinon.restore(); // do not stub getMetaData
    txBuilder = factory.getTransferBuilder();
    txBuilder.sender(testData.accounts.account1.address, testData.accounts.account1.publicKey);
    txBuilder.receiverId(testData.accounts.account2.address);
    txBuilder.amount('10');

    await txBuilder.build();
    txn = txBuilder.transaction;
    const unsignedTxn = txBuilder.transaction.unsignedTransaction;
    unsignedTxn.should.be.a.String();
    const payloadsData = txBuilder.transaction.payloadsData;
    const serializedTxFormat = {
      serializedTxHex: payloadsData,
      publicKey: testData.accounts.account1.publicKey,
    };
    const serializedTxHex = Buffer.from(JSON.stringify(serializedTxFormat), 'utf-8').toString('hex');
    await txn.fromRawTransaction(serializedTxHex);
    const baseKey: BaseKey = { key: testData.accounts.account1.secretKey };
    txBuilder.sign(baseKey);
    txBuilder.combine();
    const signedTxn = txBuilder.transaction.signedTransaction;
    signedTxn.should.be.a.String();
  });
});
