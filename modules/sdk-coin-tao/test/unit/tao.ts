import should = require('should');
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Tao, Ttao } from '../../src';
import * as sinon from 'sinon';
import * as testData from './fixtures';
import { txVersion, genesisHash, specVersion } from '../resources';
import { afterEach } from 'mocha';

describe('Tao:', function () {
  let bitgo: TestBitGoAPI;
  let baseCoin;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('tao', Tao.createInstance);
    bitgo.safeRegister('ttao', Ttao.createInstance);
    bitgo.initializeTestVars();
    baseCoin = bitgo.coin('ttao') as Ttao;
  });

  describe('Recover Transactions:', function () {
    const sandBox = sinon.createSandbox();
    const recoveryDestination = '5FJ18ywfrWuRifNyc8aPwQ5ium19Fefwmx18H4XYkDc36F2A';
    const nonce = 2;
    let accountInfoCB;
    let headerInfoCB;
    let getFeeCB;

    before(function () {
      accountInfoCB = sandBox.stub(Tao.prototype, 'getAccountInfo' as keyof Tao);
      headerInfoCB = sandBox.stub(Tao.prototype, 'getHeaderInfo' as keyof Tao);
      getFeeCB = sandBox.stub(Tao.prototype, 'getFee' as keyof Tao);

      getFeeCB.withArgs(recoveryDestination, testData.wrwUser.walletAddress0, 1510000000000).resolves(15783812856); // TODD: use it later
    });

    afterEach(function () {
      sandBox.restore();
    });

    it('should generate unsigned sweep correctly', async function () {
      accountInfoCB.withArgs(testData.unsignedSweepUser.walletAddress0).resolves({ nonce: 1, freeBalance: 2989864739 });
      headerInfoCB.resolves({
        headerNumber: testData.westendBlock.blockNumber,
        headerHash: testData.westendBlock.hash,
      });

      const commonKeyChain =
        'd4a570c1831c7024cb72533e42690cec9d9150b9aac59001c4a5a3a285518263a9e89f1c709bcb1e832f2ff5169fecd496881ba8970f69d5adc977ba4799fedb'; // TODO: add common key chain

      const unsigned = await baseCoin.recover({ bitgoKey: commonKeyChain, recoveryDestination });

      unsigned.txRequests.should.not.be.undefined();
      unsigned.txRequests.length.should.equal(1);
      unsigned.txRequests[0].transactions.length.should.equal(1);
      unsigned.txRequests[0].walletCoin.should.equal('ttao');
      unsigned.txRequests[0].transactions[0].unsignedTx.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.serializedTx.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.scanIndex.should.equal(0);
      unsigned.txRequests[0].transactions[0].unsignedTx.coin.should.equal('ttao');
      unsigned.txRequests[0].transactions[0].unsignedTx.signableHex.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.derivationPath.should.equal('m/0');
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.inputs.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.inputs.length.should.equal(1);
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.inputs[0].address.should.equal(
        '5Ehp6rRKp4zZxW3zh4SUA79zEj5GDXuNhTy7y7g12DT2kh4C'
      );
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.inputs[0].valueString.should.equal('2989864739');
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.inputs[0].value.should.equal(2989864739);
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.outputs.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.outputs.length.should.equal(1);
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.outputs[0].address.should.equal(
        '5FJ18ywfrWuRifNyc8aPwQ5ium19Fefwmx18H4XYkDc36F2A'
      );
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.outputs[0].valueString.should.equal('2989864739');
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.outputs[0].coinName.should.equal('ttao');
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.type.should.equal('');
      unsigned.txRequests[0].transactions[0].unsignedTx.feeInfo.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.feeInfo.fee.should.equal(0);
      unsigned.txRequests[0].transactions[0].unsignedTx.feeInfo.feeString.should.equal('0');
      unsigned.txRequests[0].transactions[0].unsignedTx.coinSpecific.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.coinSpecific.firstValid.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.coinSpecific.maxDuration.should.equal(2400);
      unsigned.txRequests[0].transactions[0].unsignedTx.coinSpecific.commonKeychain.should.equal(
        'd4a570c1831c7024cb72533e42690cec9d9150b9aac59001c4a5a3a285518263a9e89f1c709bcb1e832f2ff5169fecd496881ba8970f69d5adc977ba4799fedb'
      );
    });

    it('should recover a tx for non-bitgo recoveries', async function () {
      accountInfoCB.withArgs(testData.wrwUser.walletAddress0).resolves({ nonce: 2, freeBalance: 100001853 });
      headerInfoCB.resolves({
        headerNumber: testData.westendBlock.blockNumber,
        headerHash: testData.westendBlock.hash,
      });

      const res = await baseCoin.recover({
        userKey: testData.wrwUser.userKey,
        backupKey: testData.wrwUser.backupKey,
        bitgoKey: testData.wrwUser.bitgoKey,
        walletPassphrase: testData.wrwUser.walletPassphrase,
        recoveryDestination: recoveryDestination,
      });

      res.should.not.be.empty();
      res.should.hasOwnProperty('serializedTx');
      res.should.hasOwnProperty('scanIndex');
      // sandBox.assert.calledOnce(baseCoin.getAccountInfo);
      // sandBox.assert.calledOnce(baseCoin.getHeaderInfo);

      const txBuilder = baseCoin.getBuilder().from(res.serializedTx);
      txBuilder
        .validity({
          firstValid: testData.westendBlock.blockNumber,
          maxDuration: baseCoin.SWEEP_TXN_DURATION,
        })
        .referenceBlock(testData.westendBlock.hash);

      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.sender, testData.wrwUser.walletAddress0);
      should.deepEqual(txJson.blockNumber, testData.westendBlock.blockNumber);
      should.deepEqual(txJson.referenceBlock, testData.westendBlock.hash);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, nonce);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      // should.deepEqual(txJson.chainName, chainName);
      should.deepEqual(txJson.eraPeriod, baseCoin.SWEEP_TXN_DURATION);
    });

    it('should recover a txn for unsigned-sweep recoveries', async function () {
      accountInfoCB.withArgs(testData.unsignedSweepUser.walletAddress0).resolves({ nonce: 1, freeBalance: 2989864739 });
      headerInfoCB.resolves({
        headerNumber: testData.westendBlock.blockNumber,
        headerHash: testData.westendBlock.hash,
      });

      const res = await baseCoin.recover({
        bitgoKey: testData.unsignedSweepUser.bitgoKey,
        recoveryDestination: recoveryDestination,
      });

      res.should.not.be.empty();
      res.txRequests[0].transactions[0].unsignedTx.should.hasOwnProperty('serializedTx');
      res.txRequests[0].transactions[0].unsignedTx.should.hasOwnProperty('scanIndex');
      // sandBox.assert.calledOnce(baseCoin.getAccountInfo);
      // sandBox.assert.calledOnce(baseCoin.getHeaderInfo);

      const txBuilder = baseCoin.getBuilder().from(res.txRequests[0].transactions[0].unsignedTx.serializedTx);
      txBuilder
        .validity({
          firstValid: testData.westendBlock.blockNumber,
          maxDuration: baseCoin.SWEEP_TXN_DURATION,
        })
        .referenceBlock(testData.westendBlock.hash)
        .sender({ address: testData.unsignedSweepUser.walletAddress0 });

      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.sender, testData.unsignedSweepUser.walletAddress0);
      should.deepEqual(txJson.blockNumber, testData.westendBlock.blockNumber);
      should.deepEqual(txJson.referenceBlock, testData.westendBlock.hash);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 1);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      // should.deepEqual(txJson.chainName, chainName);
      should.deepEqual(txJson.eraPeriod, baseCoin.SWEEP_TXN_DURATION);
    });
  });

  describe('Build Consolidation Recoveries', function () {
    const sandbox = sinon.createSandbox();
    const baseAddr = testData.consolidationWrwUser.walletAddress0;
    const nonce = 123;

    beforeEach(function () {
      const accountInfoCB = sandbox.stub(Tao.prototype, 'getAccountInfo' as keyof Tao);
      accountInfoCB.withArgs(testData.consolidationWrwUser.walletAddress1).resolves({
        nonce: nonce,
        freeBalance: 10000000000,
      });
      accountInfoCB.withArgs(testData.consolidationWrwUser.walletAddress2).resolves({
        nonce: nonce,
        freeBalance: 1510000000000,
      });
      accountInfoCB.withArgs(testData.consolidationWrwUser.walletAddress3).resolves({
        nonce: nonce,
        freeBalance: 1510000000000,
      });
      const headerInfoCB = sandbox.stub(Tao.prototype, 'getHeaderInfo' as keyof Tao);
      headerInfoCB.resolves({
        headerNumber: testData.westendBlock.blockNumber,
        headerHash: testData.westendBlock.hash,
      });
      const getFeeCB = sandbox.stub(Tao.prototype, 'getFee' as keyof Tao);
      getFeeCB.withArgs(baseAddr, testData.consolidationWrwUser.walletAddress1, 10000000000).resolves(15783812856);
      getFeeCB.withArgs(baseAddr, testData.consolidationWrwUser.walletAddress2, 1510000000000).resolves(15783812856);
      getFeeCB.withArgs(baseAddr, testData.consolidationWrwUser.walletAddress3, 1510000000000).resolves(15783812856);
    });

    afterEach(function () {
      sandbox.restore();
    });

    it('should build signed consolidation recovery', async function () {
      const res = await baseCoin.recoverConsolidations({
        userKey: testData.consolidationWrwUser.userKey,
        backupKey: testData.consolidationWrwUser.backupKey,
        bitgoKey: testData.consolidationWrwUser.bitgoKey,
        walletPassphrase: testData.consolidationWrwUser.walletPassphrase,
        startingScanIndex: 1,
        endingScanIndex: 4,
      });

      res.should.not.be.empty();
      res.transactions.length.should.equal(2);
      // sandbox.assert.calledThrice(baseCoin.getAccountInfo);
      // sandbox.assert.calledTwice(baseCoin.getHeaderInfo);

      const txn1 = res.transactions[0];
      txn1.should.hasOwnProperty('serializedTx');
      txn1.should.hasOwnProperty('scanIndex');
      txn1.scanIndex.should.equal(2);
      const txBuilder1 = baseCoin.getBuilder().from(txn1.serializedTx);
      txBuilder1
        .validity({
          firstValid: testData.westendBlock.blockNumber,
          maxDuration: baseCoin.MAX_VALIDITY_DURATION,
        })
        .referenceBlock(testData.westendBlock.hash);
      const tx1 = await txBuilder1.build();
      const txJson1 = tx1.toJson();
      should.deepEqual(txJson1.sender, testData.consolidationWrwUser.walletAddress2);
      should.deepEqual(txJson1.blockNumber, testData.westendBlock.blockNumber);
      should.deepEqual(txJson1.referenceBlock, testData.westendBlock.hash);
      should.deepEqual(txJson1.genesisHash, genesisHash);
      should.deepEqual(txJson1.specVersion, specVersion);
      should.deepEqual(txJson1.nonce, nonce);
      should.deepEqual(txJson1.tip, 0);
      should.deepEqual(txJson1.transactionVersion, txVersion);
      // should.deepEqual(txJson1.chainName, chainName);
      // eraPeriod will always round to the next upper power of 2 for any input value, in this case 2400.
      // 4096 is the "highest" value you can set, but the txn still may fail after 2400 blocks.
      const eraPeriod = 4096;
      should.deepEqual(txJson1.eraPeriod, eraPeriod);
      should.deepEqual(txJson1.to, baseAddr);

      res.lastScanIndex.should.equal(3);
      const txn2 = res.transactions[1];
      txn2.should.hasOwnProperty('serializedTx');
      txn2.should.hasOwnProperty('scanIndex');
      txn2.scanIndex.should.equal(3);
      const txBuilder2 = baseCoin.getBuilder().from(txn2.serializedTx);
      txBuilder2
        .validity({
          firstValid: testData.westendBlock.blockNumber,
          maxDuration: baseCoin.MAX_VALIDITY_DURATION,
        })
        .referenceBlock(testData.westendBlock.hash);
      const tx2 = await txBuilder2.build();
      const txJson2 = tx2.toJson();
      should.deepEqual(txJson2.sender, testData.consolidationWrwUser.walletAddress3);
      should.deepEqual(txJson2.blockNumber, testData.westendBlock.blockNumber);
      should.deepEqual(txJson2.referenceBlock, testData.westendBlock.hash);
      should.deepEqual(txJson2.genesisHash, genesisHash);
      should.deepEqual(txJson2.specVersion, specVersion);
      should.deepEqual(txJson2.nonce, nonce);
      should.deepEqual(txJson2.tip, 0);
      should.deepEqual(txJson2.transactionVersion, txVersion);
      // should.deepEqual(txJson2.chainName, chainName);
      should.deepEqual(txJson2.eraPeriod, eraPeriod);
      should.deepEqual(txJson2.to, baseAddr);
    });

    it('should build unsigned consolidation recoveries', async function () {
      const res = await baseCoin.recoverConsolidations({
        bitgoKey: testData.consolidationWrwUser.bitgoKey,
        startingScanIndex: 1,
        endingScanIndex: 4,
      });
      res.should.not.be.empty();
      res.txRequests.length.should.equal(2);
      sandbox.assert.calledThrice(baseCoin.getAccountInfo);
      sandbox.assert.calledTwice(baseCoin.getHeaderInfo);

      const txn1 = res.txRequests[0].transactions[0].unsignedTx;
      txn1.should.hasOwnProperty('serializedTx');
      txn1.should.hasOwnProperty('signableHex');
      txn1.should.hasOwnProperty('scanIndex');
      txn1.scanIndex.should.equal(2);
      txn1.should.hasOwnProperty('coin');
      txn1.coin.should.equal('ttao');
      txn1.should.hasOwnProperty('derivationPath');
      txn1.derivationPath.should.equal('m/2');

      txn1.should.hasOwnProperty('coinSpecific');
      const coinSpecific1 = txn1.coinSpecific;
      coinSpecific1.should.hasOwnProperty('commonKeychain');
      coinSpecific1.should.hasOwnProperty('firstValid');
      coinSpecific1.firstValid.should.equal(testData.westendBlock.blockNumber);
      coinSpecific1.should.hasOwnProperty('maxDuration');
      coinSpecific1.maxDuration.should.equal(baseCoin.MAX_VALIDITY_DURATION);

      // deserialize the txn and verify the fields are what we expect
      const txBuilder1 = baseCoin.getBuilder().from(txn1.serializedTx);
      // some information isn't deserialized by the from method, so we will
      // supply it again in order to re-build the txn
      txBuilder1
        .validity({
          firstValid: testData.westendBlock.blockNumber,
          maxDuration: baseCoin.MAX_VALIDITY_DURATION,
        })
        .referenceBlock(testData.westendBlock.hash)
        .sender({ address: testData.consolidationWrwUser.walletAddress2 });
      const tx1 = await txBuilder1.build();
      const txJson1 = tx1.toJson();
      should.deepEqual(txJson1.sender, testData.consolidationWrwUser.walletAddress2);
      should.deepEqual(txJson1.blockNumber, testData.westendBlock.blockNumber);
      should.deepEqual(txJson1.referenceBlock, testData.westendBlock.hash);
      should.deepEqual(txJson1.genesisHash, genesisHash);
      should.deepEqual(txJson1.specVersion, specVersion);
      should.deepEqual(txJson1.nonce, nonce);
      should.deepEqual(txJson1.tip, 0);
      should.deepEqual(txJson1.transactionVersion, txVersion);
      // should.deepEqual(txJson1.chainName, chainName);
      // eraPeriod will always round to the next upper power of 2 for any input value, in this case 2400.
      // 4096 is the "highest" value you can set, but the txn still may fail after 2400 blocks.
      const eraPeriod = 4096;
      should.deepEqual(txJson1.eraPeriod, eraPeriod);
      should.deepEqual(txJson1.to, baseAddr);

      const txn2 = res.txRequests[1].transactions[0].unsignedTx;
      txn2.should.hasOwnProperty('serializedTx');
      txn2.should.hasOwnProperty('signableHex');
      txn2.should.hasOwnProperty('scanIndex');
      txn2.scanIndex.should.equal(3);
      txn2.should.hasOwnProperty('coin');
      txn2.coin.should.equal('ttao');
      txn2.should.hasOwnProperty('derivationPath');
      txn2.derivationPath.should.equal('m/3');

      txn2.should.hasOwnProperty('coinSpecific');
      const coinSpecific2 = txn2.coinSpecific;
      coinSpecific2.should.hasOwnProperty('commonKeychain');
      coinSpecific2.should.hasOwnProperty('firstValid');
      coinSpecific2.firstValid.should.equal(testData.westendBlock.blockNumber);
      coinSpecific2.should.hasOwnProperty('maxDuration');
      coinSpecific2.maxDuration.should.equal(baseCoin.MAX_VALIDITY_DURATION);
      coinSpecific2.should.hasOwnProperty('commonKeychain');
      coinSpecific2.should.hasOwnProperty('lastScanIndex');
      coinSpecific2.lastScanIndex.should.equal(3);

      // deserialize the txn and verify the fields are what we expect
      const txBuilder2 = baseCoin.getBuilder().from(txn2.serializedTx);
      // some information isn't deserialized by the from method, so we will
      // supply it again in order to re-build the txn
      txBuilder2
        .validity({
          firstValid: testData.westendBlock.blockNumber,
          maxDuration: baseCoin.MAX_VALIDITY_DURATION,
        })
        .referenceBlock(testData.westendBlock.hash)
        .sender({ address: testData.consolidationWrwUser.walletAddress3 });
      const tx2 = await txBuilder2.build();
      const txJson2 = tx2.toJson();
      should.deepEqual(txJson2.sender, testData.consolidationWrwUser.walletAddress3);
      should.deepEqual(txJson2.blockNumber, testData.westendBlock.blockNumber);
      should.deepEqual(txJson2.referenceBlock, testData.westendBlock.hash);
      should.deepEqual(txJson2.genesisHash, genesisHash);
      should.deepEqual(txJson2.specVersion, specVersion);
      should.deepEqual(txJson2.nonce, nonce);
      should.deepEqual(txJson2.tip, 0);
      should.deepEqual(txJson2.transactionVersion, txVersion);
      // should.deepEqual(txJson2.chainName, chainName);
      should.deepEqual(txJson2.eraPeriod, eraPeriod);
      should.deepEqual(txJson2.to, baseAddr);
    });

    it('should skip building consolidate transaction if balance is equal to zero', async function () {
      await baseCoin
        .recoverConsolidations({
          userKey: testData.consolidationWrwUser.userKey,
          backupKey: testData.consolidationWrwUser.backupKey,
          bitgoKey: testData.consolidationWrwUser.bitgoKey,
          walletPassphrase: testData.consolidationWrwUser.walletPassphrase,
          startingScanIndex: 1,
          endingScanIndex: 2,
        })
        .should.rejectedWith('Did not find an address with funds to recover');
    });

    it('should throw if startingScanIndex is not ge to 1', async () => {
      await baseCoin
        .recoverConsolidations({
          userKey: testData.consolidationWrwUser.userKey,
          backupKey: testData.consolidationWrwUser.backupKey,
          bitgoKey: testData.consolidationWrwUser.bitgoKey,
          startingScanIndex: -1,
        })
        .should.be.rejectedWith(
          'Invalid starting or ending index to scan for addresses. startingScanIndex: -1, endingScanIndex: 19.'
        );
    });

    it('should throw if scan factor is too high', async () => {
      await baseCoin
        .recoverConsolidations({
          userKey: testData.consolidationWrwUser.userKey,
          backupKey: testData.consolidationWrwUser.backupKey,
          bitgoKey: testData.consolidationWrwUser.bitgoKey,
          startingScanIndex: 1,
          endingScanIndex: 300,
        })
        .should.be.rejectedWith(
          'Invalid starting or ending index to scan for addresses. startingScanIndex: 1, endingScanIndex: 300.'
        );
    });
  });
});
