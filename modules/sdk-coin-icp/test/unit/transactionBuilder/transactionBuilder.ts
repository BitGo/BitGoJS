// import assert from 'assert';
import should from 'should';
import { getBuilderFactory } from '../getBuilderFactory';
import * as testData from '../../resources/icp';
import sinon from 'sinon';
import Utils from '../../../src/lib/utils';

describe('ICP Transaction Builder', async () => {
  const factory = getBuilderFactory('ticp');

  beforeEach(function (done) {
    done();
  });

  it('start and build a transfer tx', async () => {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.sender(testData.accounts.account1.address, testData.accounts.account1.publicKey);
    txBuilder.receiverId(testData.accounts.account2.address);
    txBuilder.amount('10');
    txBuilder.memo(123456);
    await txBuilder.build();
    const icpTransaction = txBuilder.transaction.icpTransaction;
    const payloadsData = txBuilder.transaction.payloadsData;
    should.equal(icpTransaction.metadata.memo, 123456);
    should.equal(icpTransaction.operations[0].account.address, testData.accounts.account1.address);
    should.equal(icpTransaction.operations[1].account.address, testData.accounts.account2.address);
    should.equal(icpTransaction.operations[0].amount.value, '-10');
    should.equal(icpTransaction.operations[1].amount.value, '10');
    should.equal(icpTransaction.operations[2].amount.value, '-10000');
    should.equal(icpTransaction.public_keys[0].hex_bytes, testData.accounts.account1.publicKey);
    payloadsData.unsigned_transaction.should.be.a.String();
    payloadsData.payloads.should.be.an.Array();
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

  it('should build a txn and sign', async () => {
    sinon.stub(Utils, 'getTransactionSignature').returns(testData.signatures[0]);
    sinon.stub(Utils, 'getReadStateSignature').returns(testData.signatures[1]);
    const txBuilder = factory.getTransferBuilder();
    txBuilder.sender(testData.accounts.account1.address, testData.accounts.account1.publicKey);
    txBuilder.receiverId(testData.accounts.account2.address);
    txBuilder.amount('10');
    txBuilder.memo(123456);
    await txBuilder.build();
    const txn = txBuilder.transaction;
    txn.addSignature(testData.signatures);
    txBuilder.sign({ key: testData.accounts.account1.secretKey });
    const signedTxn = txBuilder.transaction.signedTransaction;
    signedTxn.should.be.a.String();
  });

  it('should build a signed txn and give txn in broadcast format', async () => {
    sinon.stub(Utils, 'getTransactionSignature').returns(testData.signatures[0]);
    sinon.stub(Utils, 'getReadStateSignature').returns(testData.signatures[1]);
    const txBuilder = factory.getTransferBuilder();
    txBuilder.sender(testData.accounts.account1.address, testData.accounts.account1.publicKey);
    txBuilder.receiverId(testData.accounts.account2.address);
    txBuilder.amount('10');
    txBuilder.memo(123456);
    await txBuilder.build();
    const txn = txBuilder.transaction;
    txn.addSignature(testData.signatures);
    txBuilder.sign({ key: testData.accounts.account1.secretKey });
    const signedTxn = txBuilder.transaction.signedTransaction;
    signedTxn.should.be.a.String();
    const broadcastTxn = txBuilder.transaction.toBroadcastFormat();
    broadcastTxn.should.be.a.String();
    const broadcastTxnObj = JSON.parse(broadcastTxn);
    should.equal(broadcastTxnObj.signed_transaction, signedTxn);
    should.equal(broadcastTxnObj.network_identifier.network, '00000000000000020101');
  });
});
