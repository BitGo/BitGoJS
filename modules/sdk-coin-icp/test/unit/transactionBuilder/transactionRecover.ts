import should from 'should';
import assert from 'assert';
import * as testData from '../../resources/icp';
import sinon from 'sinon';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import nock from 'nock';
import { Icp } from '../../../src/index';
import { IcpAgent } from '../../../src/lib/icpAgent';
import { RecoveryOptions, LEDGER_CANISTER_ID, Signatures } from '../../../src/lib/iface';
import { Principal } from '@dfinity/principal';
import BigNumber from 'bignumber.js';
import { Environments, ErrorNoInputToRecover, RecoveryKeyMismatchError, RecoveryProviderError } from '@bitgo/sdk-core';
import utils from '../../../src/lib/utils';

describe('ICP transaction recovery', async () => {
  let bitgo;
  let recoveryParams: RecoveryOptions;
  let icp: Icp;
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
    sinon
      .stub(icp, 'signatures')
      .resolves(testData.RecoverTransactionSignatureWithDefaultMemo as unknown as Signatures[]);
  };

  const setupMemoStubs = () => {
    sinon.stub(IcpAgent.prototype, 'getBalance').resolves(BigNumber(1000000000));
    sinon.stub(IcpAgent.prototype, 'getFee').resolves(BigNumber(10000));
    sinon.stub(utils, 'getMetaData').returns({
      metaData: testData.MetaDataWithMemo,
      ingressEndTime: testData.MetaDataWithMemo.ingress_end ?? 0,
    });
    sinon.stub(icp, 'signatures').resolves(testData.RecoverTransactionSignatureWithMemo as unknown as Signatures[]);
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
    nodeUrl = Environments[bitgo.getEnv()].icpNodeUrl;
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
    assert('tx' in recoverTxn);
    recoverTxn.id.should.be.a.String();
    should.equal(recoverTxn.id, testData.TxnIdWithDefaultMemo);
  });

  it('should recover a transaction with memo successfully', async () => {
    sinon.restore();
    setupMemoStubs();
    recoveryParams.memo = testData.MetaDataWithMemo.memo;
    const recoverTxn = await icp.recover(recoveryParams);
    assert('tx' in recoverTxn);
    recoverTxn.id.should.be.a.String();
    should.equal(recoverTxn.id, testData.TxnIdWithMemo);
  });

  it('should return a signed transaction without broadcasting when broadcast is false', async () => {
    const broadcastStub = sinon.stub(icp, 'broadcastTransaction').rejects(new Error('must not broadcast'));
    const recoverTxn = await icp.recover({ ...recoveryParams, broadcast: false });
    assert('tx' in recoverTxn);
    should.equal(recoverTxn.id, testData.TxnIdWithDefaultMemo);
    should.equal(recoverTxn.tx, testData.RecoverySignedTransactionWithDefaultMemo);
    should.equal(recoverTxn.txHex, testData.RecoverySignedTransactionWithDefaultMemo);
    should.equal(recoverTxn.coin, 'icp');
    sinon.assert.notCalled(broadcastStub);
  });

  it('should produce the identical signed payload that legacy broadcasting would have submitted', async () => {
    const legacyTxn = await icp.recover(recoveryParams);
    const broadcastStub = sinon.stub(icp, 'broadcastTransaction').rejects(new Error('must not broadcast'));
    const offlineTxn = await icp.recover({ ...recoveryParams, broadcast: false });
    assert('tx' in legacyTxn);
    assert('tx' in offlineTxn);
    should.equal(offlineTxn.tx, legacyTxn.tx);
    should.equal(offlineTxn.id, legacyTxn.id);
    sinon.assert.notCalled(broadcastStub);
  });

  it('should fail closed on an invalid destination even in offline mode', async () => {
    nock.cleanAll();
    sinon.restore();
    const broadcastStub = sinon.stub(icp, 'broadcastTransaction').rejects(new Error('must not broadcast'));
    const getBalanceStub = sinon.stub(IcpAgent.prototype, 'getBalance');
    const getFeeStub = sinon.stub(IcpAgent.prototype, 'getFee');
    const signaturesStub = sinon.stub(icp, 'signatures');
    await icp
      .recover({ ...recoveryParams, recoveryDestination: 'invalid', broadcast: false })
      .should.rejectedWith('Error during ICP recovery: invalid recoveryDestination');
    sinon.assert.notCalled(broadcastStub);
    sinon.assert.notCalled(getBalanceStub);
    sinon.assert.notCalled(getFeeStub);
    sinon.assert.notCalled(signaturesStub);
  });

  it('should fail closed when bitgoKey does not match the recovery keys', async () => {
    await icp
      .recover({ ...recoveryParams, bitgoKey: 'deadbeef', broadcast: false })
      .should.rejectedWith(RecoveryKeyMismatchError);
  });

  it('should fail closed when rootAddress does not match the derived address', async () => {
    await icp
      .recover({ ...recoveryParams, rootAddress: '00'.repeat(32), broadcast: false })
      .should.rejectedWith(RecoveryKeyMismatchError);
  });

  it('should ignore broadcast: false for an unsigned sweep', async () => {
    sinon.restore();
    setupMemoStubs();
    const broadcastStub = sinon.stub(icp, 'broadcastTransaction').rejects(new Error('must not broadcast'));
    const signaturesStub = icp.signatures as unknown as sinon.SinonStub;

    const unsignedSweepRecoveryParams = {
      bitgoKey:
        '0310768736a005ea5364e1b5b5288cf553224dd28b2df8ced63b72a8020478967f05ec5bce1f26cd7eb009a4bea445bb55c2f54a30f2706c1a3747e8df2d288829',
      recoveryDestination: testData.Accounts.account2.address,
      broadcast: false,
    };
    const recoverTxn = await icp.recover(unsignedSweepRecoveryParams);
    assert('txHex' in recoverTxn);
    assert(!('id' in recoverTxn));
    should.equal(recoverTxn.txHex, testData.UnsignedSweepTransaction);
    should.equal(recoverTxn.coin, 'icp');
    sinon.assert.notCalled(broadcastStub);
    sinon.assert.notCalled(signaturesStub);
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
    assert(!('id' in recoverTxn));
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

  it('should fail to recover txn if balance is zero', async () => {
    sinon.restore();
    sinon.stub(IcpAgent.prototype, 'getBalance').resolves(BigNumber(0));
    sinon.stub(IcpAgent.prototype, 'getFee').resolves(BigNumber(10000));
    await icp.recover(recoveryParams).should.rejectedWith(ErrorNoInputToRecover);
  });

  it('should fail to recover txn if balance is low', async () => {
    sinon.restore();
    setupLowBalanceStubs();
    await icp
      .recover(recoveryParams)
      .should.rejectedWith('Error during ICP recovery: Did not have enough funds to recover');
  });

  it('should fail to recover txn if the balance provider fails', async () => {
    sinon.restore();
    sinon.stub(IcpAgent.prototype, 'getBalance').rejects(new RecoveryProviderError('Error fetching balance'));
    await icp.recover(recoveryParams).should.rejectedWith(RecoveryProviderError);
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
