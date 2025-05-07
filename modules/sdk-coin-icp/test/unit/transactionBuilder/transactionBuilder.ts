import should from 'should';
import { getBuilderFactory } from '../getBuilderFactory';
import { BaseKey } from '@bitgo/sdk-core';
import * as testData from '../../resources/icp';
import sinon from 'sinon';
import { DEFAULT_MEMO, MAX_INGRESS_TTL } from '../../../src/lib/iface';

describe('ICP Transaction Builder', async () => {
  const factory = getBuilderFactory('ticp');
  let txBuilder: any;
  let txn: any;

  beforeEach(async function () {
    txBuilder = factory.getTransferBuilder();
    sinon.stub(txBuilder._utils, 'getMetaData').returns({
      metaData: testData.MetaDataWithMemo,
      ingressEndTime: testData.MetaDataWithMemo.ingress_end,
    });

    txBuilder.sender(testData.Accounts.account1.address, testData.Accounts.account1.publicKey);
    txBuilder.receiverId(testData.Accounts.account2.address);
    txBuilder.amount('10');
    txBuilder.memo(testData.MetaDataWithMemo.memo);

    await txBuilder.build();
    txn = txBuilder.transaction;
  });

  afterEach(function () {
    sinon.restore();
  });

  it('should parse an unsigned transaction', async () => {
    const parsedUnsignedTxn = await factory.parseTransaction(testData.PayloadsData.unsigned_transaction, false);
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
    should.equal(icpTransaction.metadata.memo, testData.MetaDataWithMemo.memo);
    should.equal(icpTransaction.operations[0].account.address, testData.Accounts.account1.address);
    should.equal(icpTransaction.operations[1].account.address, testData.Accounts.account2.address);
    should.equal(icpTransaction.operations[0].amount.value, '-10');
    should.equal(icpTransaction.operations[1].amount.value, '10');
    should.equal(icpTransaction.operations[2].amount.value, '-10000');
    should.equal(icpTransaction.public_keys[0].hex_bytes, testData.Accounts.account1.publicKey);
    payloadsData.payloads.should.be.an.Array();
    payloadsData.payloads.length.should.equal(1);
    should.deepEqual(txBuilder.payloadData(), testData.PayloadsData);
    should.deepEqual(payloadsData.payloads, testData.PayloadsData.payloads);
  });

  it('should fail to build a txn without sender', async () => {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.receiverId(testData.Accounts.account2.address);
    txBuilder.amount('10');
    txBuilder.memo(123456);
    await txBuilder.build().should.rejectedWith('sender is required before building');
  });

  it('should fail to build a txn without amount', async () => {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.sender(testData.Accounts.account1.address, testData.Accounts.account1.publicKey);
    txBuilder.receiverId(testData.Accounts.account2.address);
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
    const baseKey: BaseKey = { key: testData.Accounts.account1.secretKey };
    txBuilder.sign(baseKey);
    should.deepEqual(txBuilder.signaturePayload(), testData.Signatures);
    txBuilder.combine();
    const signedTxn = txBuilder.transaction.signedTransaction;
    signedTxn.should.be.a.String();
    should.equal(signedTxn, testData.SignedTransaction);
    const transactionHash = txBuilder.transaction.id;
    should.equal(transactionHash, testData.OnChainTransactionHash);
    const broadcastTxn = txBuilder.transaction.toBroadcastFormat();
    broadcastTxn.should.be.a.String();
    should.equal(broadcastTxn, signedTxn);
  });

  it('should generate a correct txn hash', async () => {
    sinon.stub(txn._utils, 'validateExpireTime').returns(true);
    const unsignedTxn = txBuilder.transaction.unsignedTransaction;
    unsignedTxn.should.be.a.String();
    const payloadsData = txBuilder.transaction.payloadsData;
    const serializedTxFormat = {
      serializedTxHex: payloadsData,
      publicKey: testData.Accounts.account1.publicKey,
    };
    const serializedTxHex = Buffer.from(JSON.stringify(serializedTxFormat), 'utf-8').toString('hex');
    await txn.fromRawTransaction(serializedTxHex);
    const transactionHash = txBuilder.transaction.id;
    should.equal(transactionHash, testData.OnChainTransactionHash);
  });

  it('should build a txn then parse it and then again build', async () => {
    sinon.restore(); // do not stub getMetaData
    txBuilder = factory.getTransferBuilder();
    txBuilder.sender(testData.Accounts.account1.address, testData.Accounts.account1.publicKey);
    txBuilder.receiverId(testData.Accounts.account2.address);
    txBuilder.amount('10');
    txBuilder.memo(testData.MetaDataWithMemo.memo);
    txBuilder.ingressEnd(1904384564000000000n);
    await txBuilder.build();
    txn = txBuilder.transaction;
    const unsignedTxn = txBuilder.transaction.unsignedTransaction;
    unsignedTxn.should.be.a.String();
    const payloadsData = txBuilder.transaction.payloadsData;
    const serializedTxFormat = {
      serializedTxHex: payloadsData,
      publicKey: testData.Accounts.account1.publicKey,
    };
    const serializedTxHex = Buffer.from(JSON.stringify(serializedTxFormat), 'utf-8').toString('hex');
    await txn.fromRawTransaction(serializedTxHex);
    const baseKey: BaseKey = { key: testData.Accounts.account1.secretKey };
    txBuilder.sign(baseKey);
    txBuilder.combine();
    const signedTxn = txBuilder.transaction.signedTransaction;
    signedTxn.should.be.a.String();
    txBuilder.transaction.icpTransaction.metadata.ingress_start.should.equal(
      Number(1904384564000000000n) - MAX_INGRESS_TTL
    );
  });
});

describe('ICP Transaction Builder with default memo as 0', async () => {
  const factory = getBuilderFactory('ticp');
  let txBuilder: any;
  let txn: any;

  beforeEach(async function () {
    txBuilder = factory.getTransferBuilder();

    sinon.stub(txBuilder._utils, 'getMetaData').returns({
      metaData: testData.MetaDataWithDefaultMemo,
      ingressEndTime: testData.MetaDataWithDefaultMemo.ingress_end,
    });

    testData.ParsedUnsignedTransaction.metadata.memo = DEFAULT_MEMO;
    testData.ParsedSignedTransaction.metadata.memo = DEFAULT_MEMO;

    txBuilder.receiverId(testData.Accounts.account2.address);
    txBuilder.sender(testData.Accounts.account1.address, testData.Accounts.account1.publicKey);
    txBuilder.receiverId(testData.Accounts.account2.address);
    txBuilder.amount('10');

    await txBuilder.build();
    txn = txBuilder.transaction;
  });

  afterEach(function () {
    sinon.restore();
  });

  it('should parse an unsigned transaction with default memo', async () => {
    const parsedUnsignedTxn = await factory.parseTransaction(
      testData.PayloadsDataWithDefaultMemo.unsigned_transaction,
      false
    );
    txn.should.be.an.Object();
    should.deepEqual(parsedUnsignedTxn, testData.ParsedUnsignedTransaction);
  });

  it('should parse an signed transaction with default memo', async () => {
    const parsedSignedTxn = await factory.parseTransaction(testData.SignedTransactionWithDefaultMemo, true);
    txn.should.be.an.Object();
    should.deepEqual(parsedSignedTxn, testData.ParsedSignedTransaction);
  });

  it('start and build a transfer tx with default memo', async () => {
    const icpTransaction = txBuilder.transaction.icpTransaction;
    const payloadsData = txBuilder.transaction.payloadsData;
    should.equal(icpTransaction.metadata.memo, DEFAULT_MEMO);
    should.equal(icpTransaction.operations[0].account.address, testData.Accounts.account1.address);
    should.equal(icpTransaction.operations[1].account.address, testData.Accounts.account2.address);
    should.equal(icpTransaction.operations[0].amount.value, '-10');
    should.equal(icpTransaction.operations[1].amount.value, '10');
    should.equal(icpTransaction.operations[2].amount.value, '-10000');
    should.equal(icpTransaction.public_keys[0].hex_bytes, testData.Accounts.account1.publicKey);
    payloadsData.payloads.should.be.an.Array();
    payloadsData.payloads.length.should.equal(1);
    should.deepEqual(txBuilder.payloadData(), testData.PayloadsDataWithDefaultMemo);
    should.deepEqual(payloadsData.payloads, testData.PayloadsDataWithDefaultMemo.payloads);
  });

  it('should build a signed txn with default memo and give txn in broadcast format', async () => {
    txn.addSignature(testData.SignaturesWithDefaultMemo);
    txBuilder.combine();
    const signedTxn = txBuilder.transaction.signedTransaction;
    signedTxn.should.be.a.String();
    should.equal(signedTxn, testData.SignedTransactionWithDefaultMemo);
    const broadcastTxn = txBuilder.transaction.toBroadcastFormat();
    broadcastTxn.should.be.a.String();
    should.equal(broadcastTxn, signedTxn);
  });

  it('should sign a txn with default memo and then give txn in broadcast format', async () => {
    const baseKey: BaseKey = { key: testData.Accounts.account1.secretKey };
    txBuilder.sign(baseKey);
    should.deepEqual(txBuilder.signaturePayload(), testData.SignaturesWithDefaultMemo);
    txBuilder.combine();
    const signedTxn = txBuilder.transaction.signedTransaction;
    signedTxn.should.be.a.String();
    should.equal(signedTxn, testData.SignedTransactionWithDefaultMemo);
    const broadcastTxn = txBuilder.transaction.toBroadcastFormat();
    broadcastTxn.should.be.a.String();
    should.equal(broadcastTxn, signedTxn);
  });

  it('should build a txn without memo then parse it and then again build', async () => {
    sinon.restore(); // do not stub getMetaData
    txBuilder = factory.getTransferBuilder();
    txBuilder.sender(testData.Accounts.account1.address, testData.Accounts.account1.publicKey);
    txBuilder.receiverId(testData.Accounts.account2.address);
    txBuilder.amount('10');

    await txBuilder.build();
    txn = txBuilder.transaction;
    const unsignedTxn = txBuilder.transaction.unsignedTransaction;
    unsignedTxn.should.be.a.String();
    const payloadsData = txBuilder.transaction.payloadsData;
    const serializedTxFormat = {
      serializedTxHex: payloadsData,
      publicKey: testData.Accounts.account1.publicKey,
    };
    const serializedTxHex = Buffer.from(JSON.stringify(serializedTxFormat), 'utf-8').toString('hex');
    await txn.fromRawTransaction(serializedTxHex);
    const baseKey: BaseKey = { key: testData.Accounts.account1.secretKey };
    txBuilder.sign(baseKey);
    txBuilder.combine();
    const signedTxn = txBuilder.transaction.signedTransaction;
    signedTxn.should.be.a.String();
  });
});
