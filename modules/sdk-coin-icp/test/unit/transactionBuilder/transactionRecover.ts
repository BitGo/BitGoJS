import should from 'should';
import * as testData from '../../resources/icp';
import { getBuilderFactory } from '../getBuilderFactory';
import sinon from 'sinon';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import nock from 'nock';
import { Icp } from '../../../src/index';
import { RecoveryOptions, LEDGER_CANISTER_ID } from '../../../src/lib/iface';
import { Principal } from '@dfinity/principal';

describe('ICP transaction recovery', async () => {
  let bitgo;
  let recoveryParams: RecoveryOptions;
  let icp;
  let broadcastEndpoint: string;
  let broadcastResponse: Buffer;
  let nodeUrl: string;
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
      recoveryDestination: testData.Accounts.account2.address,
    };

    icp = bitgo.coin('icp');
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
      recoveryDestination: testData.Accounts.account2.address,
    };
    nock.cleanAll();
    sinon.restore();
  });

  it('should recover a transaction with default memo successfully', async () => {
    txBuilder = factory.getTransferBuilder();

    // Stub the getTransferBuilder to return our txBuilder
    //TODO need to have a better way for test cases WithDefault mocking these functions. TIcket: https://bitgoinc.atlassian.net/browse/WIN-5158
    sinon.stub(icp, 'getBuilderFactory').returns(factory);
    sinon.stub(factory, 'getTransferBuilder').returns(txBuilder);
    sinon.stub(icp, 'signatures').returns(testData.RecoverTransactionSignatureWithDefaultMemo);

    sinon.stub(txBuilder._utils, 'getMetaData').returns({
      metaData: testData.MetaDataWithDefaultMemo,
      ingressEndTime: testData.MetaDataWithDefaultMemo.ingress_end,
    });

    const body = testData.RecoverySignedTransactionWithDefaultMemo;
    sinon.stub(icp, 'getBalanceFromPrincipal').returns('1000000000');
    nock(nodeUrl).post(broadcastEndpoint, body).reply(200, broadcastResponse);
    const recoverTxn = await icp.recover(recoveryParams);
    recoverTxn.id.should.be.a.String();
    should.equal(recoverTxn.id, testData.TxnIdWithDefaultMemo);
  });

  it('should recover a transaction with memo successfully', async () => {
    txBuilder = factory.getTransferBuilder();

    // Stub the getTransferBuilder to return our txBuilder
    sinon.stub(icp, 'getBuilderFactory').returns(factory);
    sinon.stub(factory, 'getTransferBuilder').returns(txBuilder);
    sinon.stub(icp, 'signatures').returns(testData.RecoverTransactionSignatureWithMemo);

    sinon.stub(txBuilder._utils, 'getMetaData').returns({
      metaData: testData.MetaDataWithMemo,
      ingressEndTime: testData.MetaDataWithMemo.ingress_end,
    });

    const body = testData.RecoverySignedTransactionWithMemo;
    sinon.stub(icp, 'getBalanceFromPrincipal').returns('1000000000');
    nock(nodeUrl).post(broadcastEndpoint, body).reply(200, broadcastResponse);
    recoveryParams.memo = testData.MetaDataWithMemo.memo;
    const recoverTxn = await icp.recover(recoveryParams);
    recoverTxn.id.should.be.a.String();
    should.equal(recoverTxn.id, testData.TxnIdWithMemo);
  });

  it('should recover a unsigned sweep transaction successfully', async () => {
    txBuilder = factory.getTransferBuilder();

    // Stub the getTransferBuilder to return our txBuilder
    sinon.stub(icp, 'getBuilderFactory').returns(factory);
    sinon.stub(factory, 'getTransferBuilder').returns(txBuilder);

    sinon.stub(txBuilder._utils, 'getMetaData').returns({
      metaData: testData.MetaDataWithMemo,
      ingressEndTime: testData.MetaDataWithMemo.ingress_end,
    });

    sinon.stub(icp, 'getBalanceFromPrincipal').returns('1000000000');

    const unsignedSweepRecoveryParams = {
      bitgoKey:
        '0310768736a005ea5364e1b5b5288cf553224dd28b2df8ced63b72a8020478967f05ec5bce1f26cd7eb009a4bea445bb55c2f54a30f2706c1a3747e8df2d288829',
      recoveryDestination: testData.Accounts.account2.address,
    };
    const recoverTxn = await icp.recover(unsignedSweepRecoveryParams);
    recoverTxn.txHex.should.be.a.String();
    should.equal(recoverTxn.txHex, testData.UnsignedSweepTransaction);
  });

  it('should failed to recover a unsigned sweep transaction with wrong bitgo key', async () => {
    txBuilder = factory.getTransferBuilder();

    // Stub the getTransferBuilder to return our txBuilder
    sinon.stub(icp, 'getBuilderFactory').returns(factory);
    sinon.stub(factory, 'getTransferBuilder').returns(txBuilder);

    sinon.stub(txBuilder._utils, 'getMetaData').returns({
      metaData: testData.MetaDataWithMemo,
      ingressEndTime: testData.MetaDataWithMemo.ingress_end,
    });

    sinon.stub(icp, 'getBalanceFromPrincipal').returns('1000000000');

    const unsignedSweepRecoveryParams = {
      bitgoKey: 'testKey',
      recoveryDestination: testData.Accounts.account2.address,
    };
    await icp
      .recover(unsignedSweepRecoveryParams)
      .should.rejectedWith('Error during ICP recovery: Cannot convert 0x to a BigInt');
  });

  it('should failed to recover recover a unsigned sweep transaction without bitgo key', async () => {
    txBuilder = factory.getTransferBuilder();

    // Stub the getTransferBuilder to return our txBuilder
    sinon.stub(icp, 'getBuilderFactory').returns(factory);
    sinon.stub(factory, 'getTransferBuilder').returns(txBuilder);

    sinon.stub(txBuilder._utils, 'getMetaData').returns({
      metaData: testData.MetaDataWithMemo,
      ingressEndTime: testData.MetaDataWithMemo.ingress_end,
    });

    sinon.stub(icp, 'getBalanceFromPrincipal').returns('1000000000');

    const unsignedSweepRecoveryParams = {
      recoveryDestination: testData.Accounts.account2.address,
    };
    await icp.recover(unsignedSweepRecoveryParams).should.rejectedWith('Error during ICP recovery: missing bitgoKey');
  });

  it('should fail to recover if broadcast API fails', async () => {
    sinon.stub(icp, 'getBalanceFromPrincipal').returns('1000000000');
    nock(nodeUrl).post(broadcastEndpoint).reply(500, 'Internal Server Error');
    recoveryParams.memo = 0;
    await icp
      .recover(recoveryParams)
      .should.rejectedWith(
        'Error during ICP recovery: Transaction broadcast error: Request failed with status code 500'
      );
  });

  it('should fail to recover txn if balance is low', async () => {
    sinon.stub(icp, 'getBalanceFromPrincipal').returns('10');
    nock(nodeUrl).post(broadcastEndpoint).reply(200, broadcastResponse);
    await icp
      .recover(recoveryParams)
      .should.rejectedWith('Error during ICP recovery: Did not have enough funds to recover');
  });

  it('should fail to recover txn if userKey is not provided', async () => {
    recoveryParams.userKey = '';
    await icp.recover(recoveryParams).should.rejectedWith('Error during ICP recovery: missing userKey');
  });

  it('should fail to recover txn if backupKey is not provided', async () => {
    recoveryParams.backupKey = '';
    await icp.recover(recoveryParams).should.rejectedWith('Error during ICP recovery: missing backupKey');
  });

  it('should fail to recover txn if wallet passphrase is not provided', async () => {
    recoveryParams.walletPassphrase = '';
    await icp.recover(recoveryParams).should.rejectedWith('Error during ICP recovery: missing wallet passphrase');
  });
});
