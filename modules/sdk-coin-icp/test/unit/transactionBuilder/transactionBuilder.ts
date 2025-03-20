import should from 'should';
import { getBuilderFactory } from '../getBuilderFactory';
import { BaseKey } from '@bitgo/sdk-core';
import * as testData from '../../resources/icp';
import sinon from 'sinon';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import nock from 'nock';
import { Icp, Ticp } from '../../../src/index';
import { RecoveryOptions, ACCOUNT_BALANCE_ENDPOINT, SUBMIT_TRANSACTION_ENDPOINT } from '../../../src/lib/iface';

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });
bitgo.safeRegister('ticp', Ticp.createInstance);

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
    const parsedSignedTxn = await factory.parseTransaction(testData.signedTransaction, true);
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
    payloadsData.unsigned_transaction.should.be.a.String();
    payloadsData.payloads.should.be.an.Array();
    payloadsData.payloads.length.should.equal(2);
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
    txBuilder.combine();
    const signedTxn = txBuilder.transaction.signedTransaction;
    signedTxn.should.be.a.String();
    should.equal(signedTxn, testData.signedTransaction);
    const broadcastTxn = txBuilder.transaction.toBroadcastFormat();
    broadcastTxn.should.be.a.String();
    const broadcastTxnObj = JSON.parse(broadcastTxn);
    should.equal(broadcastTxnObj.signed_transaction, signedTxn);
    should.equal(broadcastTxnObj.network_identifier.network, '00000000000000020101');
  });

  it('should sign a txn and then give txn in broadcast format', async () => {
    const baseKey: BaseKey = { key: testData.accounts.account1.secretKey };
    txBuilder.sign(baseKey);
    should.deepEqual(txn.signaturePayload, testData.signatures);
    txBuilder.combine();
    const signedTxn = txBuilder.transaction.signedTransaction;
    signedTxn.should.be.a.String();
    should.equal(signedTxn, testData.signedTransaction);
    const broadcastTxn = txBuilder.transaction.toBroadcastFormat();
    broadcastTxn.should.be.a.String();
    const broadcastTxnObj = JSON.parse(broadcastTxn);
    should.equal(broadcastTxnObj.signed_transaction, signedTxn);
    should.equal(broadcastTxnObj.network_identifier.network, '00000000000000020101');
  });

  describe('ICP transaction recovery', async () => {
    let bitgo;
    let recoveryParams: RecoveryOptions;

    before(function () {
      bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
      bitgo.safeRegister('icp', Icp.createInstance);
      bitgo.safeRegister('ticp', Ticp.createInstance);
      bitgo.initializeTestVars();
      recoveryParams = {
        userKey: testData.WRWRecovery.userKey,
        backupKey: testData.WRWRecovery.backupKey,
        walletPassphrase: testData.WRWRecovery.walletPassphrase,
        rootAddress: testData.accounts.account1.address,
        recoveryDestination: testData.accounts.account2.address,
      };
    });
    it('should recover a transaction without memo successfully', async () => {
      const icp = bitgo.coin('icp');
      const nodeUrl = icp.getPublicNodeUrl();
      nock(nodeUrl).post(`${ACCOUNT_BALANCE_ENDPOINT}`).reply(200, testData.FetchBalanceResponse);
      nock(nodeUrl).post(`${SUBMIT_TRANSACTION_ENDPOINT}`).reply(200, testData.SubmitApiResponse);

      const txnId = await icp.recover(recoveryParams);
      txnId.should.be.a.String();
      should.equal(txnId, testData.SubmitApiResponse.transaction_identifier.hash);
    });

    it('should recover a transaction with memo successfully', async () => {
      recoveryParams.memo = 0;
      const icp = bitgo.coin('icp');
      const nodeUrl = icp.getPublicNodeUrl();
      nock(nodeUrl).post(`${ACCOUNT_BALANCE_ENDPOINT}`).reply(200, testData.FetchBalanceResponse);
      nock(nodeUrl).post(`${SUBMIT_TRANSACTION_ENDPOINT}`).reply(200, testData.SubmitApiResponse);

      const txnId = await icp.recover(recoveryParams);
      txnId.should.be.a.String();
      should.equal(txnId, testData.SubmitApiResponse.transaction_identifier.hash);
    });

    it('should fail to recover txn if balance is low', async () => {
      const icp = bitgo.coin('icp');
      const nodeUrl = icp.getPublicNodeUrl();
      testData.FetchBalanceResponse.balances[0].value = '0';
      nock(nodeUrl).post(`${ACCOUNT_BALANCE_ENDPOINT}`).reply(200, testData.FetchBalanceResponse);
      nock(nodeUrl).post(`${SUBMIT_TRANSACTION_ENDPOINT}`).reply(200, testData.SubmitApiResponse);

      const recoveryParams: RecoveryOptions = {
        userKey: testData.WRWRecovery.userKey,
        backupKey: testData.WRWRecovery.backupKey,
        walletPassphrase: testData.WRWRecovery.walletPassphrase,
        rootAddress: testData.accounts.account1.address,
        recoveryDestination: testData.accounts.account2.address,
        memo: 0,
      };
      await await icp.recover(recoveryParams).should.rejectedWith('Did not have enough funds to recover');
    });
  });
});
