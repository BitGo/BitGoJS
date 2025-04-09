import should from 'should';
import * as testData from '../../resources/icp';
import { getBuilderFactory } from '../getBuilderFactory';
import sinon from 'sinon';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import nock from 'nock';
import { Icp } from '../../../src/index';
import { RecoveryOptions, ACCOUNT_BALANCE_ENDPOINT, LEDGER_CANISTER_ID } from '../../../src/lib/iface';
import { Principal } from '@dfinity/principal';

describe('ICP transaction recovery', async () => {
  let bitgo;
  let recoveryParams: RecoveryOptions;
  let icp;
  let broadcastEndpoint: string;
  let broadcastResponse: Buffer;
  let nodeUrl: string;
  let rosettaNodeUrl: string;
  let txBuilder: any;
  const factory = getBuilderFactory('ticp');

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.safeRegister('icp', Icp.createInstance);
    bitgo.initializeTestVars();
    recoveryParams = {
      userKey: testData.WRWRecovery.userKey,
      backupKey: testData.WRWRecovery.backupKey,
      walletPassphrase: testData.WRWRecovery.walletPassphrase,
      recoveryDestination: testData.accounts.account2.address,
    };

    icp = bitgo.coin('icp');
    rosettaNodeUrl = icp.getIcpRosettaNodeUrl();
    nodeUrl = icp.getPublicNodeUrl();
    const principal = Principal.fromUint8Array(LEDGER_CANISTER_ID);
    const canisterIdHex = principal.toText();
    broadcastEndpoint = `/api/v3/canister/${canisterIdHex}/call`;
    broadcastResponse = Buffer.from(testData.PublicNodeApiBroadcastResponse, 'hex');
  });

  afterEach(function () {
    recoveryParams = {
      userKey: testData.WRWRecovery.userKey,
      backupKey: testData.WRWRecovery.backupKey,
      walletPassphrase: testData.WRWRecovery.walletPassphrase,
      recoveryDestination: testData.accounts.account2.address,
    };
    nock.cleanAll();
    sinon.restore();
  });

  it('should recover a transaction without memo successfully', async () => {
    txBuilder = factory.getTransferBuilder();

    // Stub the getTransferBuilder to return our txBuilder
    sinon.stub(icp, 'getBuilderFactory').returns(factory);
    sinon.stub(factory, 'getTransferBuilder').returns(txBuilder);
    sinon.stub(icp, 'signatures').returns(testData.RecoverTransactionSignatureWithoutMemo);

    sinon.stub(txBuilder._utils, 'getMetaData').returns({
      metaData: testData.transactionMetaData,
      ingressEndTime: testData.transactionMetaData.ingress_end,
    });

    const body = testData.RecoverySignedTransactionWithoutMemo;
    nock(rosettaNodeUrl).post(`${ACCOUNT_BALANCE_ENDPOINT}`).reply(200, testData.GetAccountBalanceResponse);
    nock(nodeUrl).post(broadcastEndpoint, body).reply(200, broadcastResponse);
    const txnId = await icp.recover(recoveryParams);
    txnId.should.be.a.String();
    should.equal(txnId, testData.TxnId);
  });

  it('should recover a transaction with memo successfully', async () => {
    txBuilder = factory.getTransferBuilder();

    // Stub the getTransferBuilder to return our txBuilder
    sinon.stub(icp, 'getBuilderFactory').returns(factory);
    sinon.stub(factory, 'getTransferBuilder').returns(txBuilder);
    sinon.stub(icp, 'signatures').returns(testData.RecoverTransactionSignatureWithMemo);

    sinon.stub(txBuilder._utils, 'getMetaData').returns({
      metaData: testData.metaData,
      ingressEndTime: testData.metaData.ingress_end,
    });

    const body = testData.RecoverySignedTransactionWithMemo;
    nock(rosettaNodeUrl).post(`${ACCOUNT_BALANCE_ENDPOINT}`).reply(200, testData.GetAccountBalanceResponse);
    nock(nodeUrl).post(broadcastEndpoint, body).reply(200, broadcastResponse);
    recoveryParams.memo = testData.metaData.memo;
    const txnId = await icp.recover(recoveryParams);
    txnId.should.be.a.String();
    should.equal(txnId, testData.TxnId);
  });

  it('should fail to recover if broadcast API fails', async () => {
    nock(rosettaNodeUrl).post(`${ACCOUNT_BALANCE_ENDPOINT}`).reply(200, testData.GetAccountBalanceResponse);
    nock(nodeUrl).post(broadcastEndpoint).reply(500, 'Internal Server Error');
    recoveryParams.memo = 0;
    await icp
      .recover(recoveryParams)
      .should.rejectedWith('Transaction broadcast error: Request failed with status code 500');
  });

  it('should fail to recover txn if balance is low', async () => {
    testData.GetAccountBalanceResponse.balances[0].value = '0';
    nock(rosettaNodeUrl).post(`${ACCOUNT_BALANCE_ENDPOINT}`).reply(200, testData.GetAccountBalanceResponse);
    nock(nodeUrl).post(`${ACCOUNT_BALANCE_ENDPOINT}`).reply(200, testData.GetAccountBalanceResponse);
    nock(nodeUrl).post(broadcastEndpoint).reply(200, broadcastResponse);
    await icp.recover(recoveryParams).should.rejectedWith('Did not have enough funds to recover');
  });

  it('should fail to recover txn if userKey is not provided', async () => {
    nock(rosettaNodeUrl).post(`${ACCOUNT_BALANCE_ENDPOINT}`).reply(200, testData.GetAccountBalanceResponse);
    nock(nodeUrl).post(`${ACCOUNT_BALANCE_ENDPOINT}`).reply(200, testData.GetAccountBalanceResponse);

    recoveryParams.userKey = '';
    await icp.recover(recoveryParams).should.rejectedWith('missing userKey');
  });

  it('should fail to recover txn if backupKey is not provided', async () => {
    nock(rosettaNodeUrl).post(`${ACCOUNT_BALANCE_ENDPOINT}`).reply(200, testData.GetAccountBalanceResponse);
    nock(nodeUrl).post(`${ACCOUNT_BALANCE_ENDPOINT}`).reply(200, testData.GetAccountBalanceResponse);

    recoveryParams.backupKey = '';
    await icp.recover(recoveryParams).should.rejectedWith('missing backupKey');
  });

  it('should fail to recover txn if wallet passphrase is not provided', async () => {
    nock(rosettaNodeUrl).post(`${ACCOUNT_BALANCE_ENDPOINT}`).reply(200, testData.GetAccountBalanceResponse);
    nock(nodeUrl).post(`${ACCOUNT_BALANCE_ENDPOINT}`).reply(200, testData.GetAccountBalanceResponse);

    recoveryParams.walletPassphrase = '';
    await icp.recover(recoveryParams).should.rejectedWith('missing wallet passphrase');
  });
});
