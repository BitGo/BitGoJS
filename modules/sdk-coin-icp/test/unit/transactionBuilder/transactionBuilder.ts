// import assert from 'assert';
import should from 'should';
import { getBuilderFactory } from '../getBuilderFactory';
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
    payloadsData.unsigned_transaction.should.be.a.String();
    payloadsData.payloads.should.be.an.Array();
    should.equal(payloadsData.unsigned_transaction, testData.payloadsData.unsigned_transaction);
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
    txn.addSignature(testData.signatures);
    txBuilder.sign({ key: testData.accounts.account1.secretKey });
    const signedTxn = txBuilder.transaction.signedTransaction;
    signedTxn.should.be.a.String();
    should.equal(signedTxn, testData.signedTransaction);
    const broadcastTxn = txBuilder.transaction.toBroadcastFormat();
    broadcastTxn.should.be.a.String();
    const broadcastTxnObj = JSON.parse(broadcastTxn);
    should.equal(broadcastTxnObj.signed_transaction, signedTxn);
    should.equal(broadcastTxnObj.network_identifier.network, '00000000000000020101');
  });
});
