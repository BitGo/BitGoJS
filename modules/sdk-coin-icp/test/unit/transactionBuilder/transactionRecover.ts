import should from 'should';
import * as testData from '../../resources/icp';
import sinon from 'sinon';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import nock from 'nock';
import { Icp } from '../../../src/index';
import { IcpAgent } from '../../../src/lib/icpAgent';
import { RecoveryOptions, LEDGER_CANISTER_ID } from '../../../src/lib/iface';
import { Principal } from '@dfinity/principal';
import BigNumber from 'bignumber.js';
import utils from '../../../src/lib/utils';

describe('ICP transaction recovery', async () => {
  let bitgo;
  let recoveryParams: RecoveryOptions;
  let icp;
  let broadcastEndpoint: string;
  let broadcastResponse: Buffer;
  let nodeUrl: string;

  // Helper functions for setting up stubs
  const setupDefaultStubs = () => {
    sinon.stub(IcpAgent.prototype, 'getBalance').resolves(BigNumber(1000000000));
    sinon.stub(IcpAgent.prototype, 'getFee').resolves(BigNumber(10000));
    sinon.stub(utils, 'getMetaData').returns({
      metaData: testData.MetaDataWithDefaultMemo,
      ingressEndTime: testData.MetaDataWithDefaultMemo.ingress_end ?? 0,
    });
    sinon.stub(icp, 'signatures').returns(testData.RecoverTransactionSignatureWithDefaultMemo);
  };

  const setupMemoStubs = () => {
    sinon.stub(IcpAgent.prototype, 'getBalance').resolves(BigNumber(1000000000));
    sinon.stub(IcpAgent.prototype, 'getFee').resolves(BigNumber(10000));
    sinon.stub(utils, 'getMetaData').returns({
      metaData: testData.MetaDataWithMemo,
      ingressEndTime: testData.MetaDataWithMemo.ingress_end ?? 0,
    });
    sinon.stub(icp, 'signatures').returns(testData.RecoverTransactionSignatureWithMemo);
  };

  const setupLowBalanceStubs = () => {
    sinon.stub(IcpAgent.prototype, 'getBalance').resolves(BigNumber(10));
    sinon.stub(IcpAgent.prototype, 'getFee').resolves(BigNumber(10000));
    sinon.stub(utils, 'getMetaData').returns({
      metaData: testData.MetaDataWithDefaultMemo,
      ingressEndTime: testData.MetaDataWithDefaultMemo.ingress_end ?? 0,
    });
  };

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

  beforeEach(function () {
    setupDefaultStubs();
    // Set up default successful nock response
    nock(nodeUrl).post(broadcastEndpoint).reply(200, broadcastResponse);
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
    const recoverTxn = await icp.recover(recoveryParams);
    recoverTxn.id.should.be.a.String();
    should.equal(recoverTxn.id, testData.TxnIdWithDefaultMemo);
  });

  it('should recover a transaction with memo successfully', async () => {
    sinon.restore();
    setupMemoStubs();
    recoveryParams.memo = testData.MetaDataWithMemo.memo;
    const recoverTxn = await icp.recover(recoveryParams);
    recoverTxn.id.should.be.a.String();
    should.equal(recoverTxn.id, testData.TxnIdWithMemo);
  });

  it('should recover a unsigned sweep transaction successfully', async () => {
    sinon.restore();
    setupMemoStubs();

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
    sinon.restore();
    setupMemoStubs();

    const unsignedSweepRecoveryParams = {
      bitgoKey: 'testKey',
      recoveryDestination: testData.Accounts.account2.address,
    };
    await icp
      .recover(unsignedSweepRecoveryParams)
      .should.rejectedWith('Error during ICP recovery: Cannot convert 0x to a BigInt');
  });

  it('should failed to recover recover a unsigned sweep transaction without bitgo key', async () => {
    sinon.restore();
    setupMemoStubs();

    const unsignedSweepRecoveryParams = {
      recoveryDestination: testData.Accounts.account2.address,
    };
    await icp.recover(unsignedSweepRecoveryParams).should.rejectedWith('Error during ICP recovery: missing bitgoKey');
  });

  it('should fail to recover if broadcast API fails', async () => {
    nock.cleanAll();
    nock(nodeUrl).post(broadcastEndpoint).reply(500, 'Internal Server Error');
    recoveryParams.memo = 0;
    await icp
      .recover(recoveryParams)
      .should.rejectedWith(
        'Error during ICP recovery: Transaction broadcast error: Request failed with status code 500'
      );
  });

  it('should fail to recover txn if balance is low', async () => {
    sinon.restore();
    setupLowBalanceStubs();
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
