import should from 'should';
import { TestBitGo, TestBitGoAPI } from '@bitgo-beta/sdk-test';
import { BitGoAPI } from '@bitgo-beta/sdk-api';
import { Polyx, Tpolyx } from '../../src';
import { POLYX_ADDRESS_FORMAT, TPOLYX_ADDRESS_FORMAT } from '../../src/lib/constants';
import * as sinon from 'sinon';
import * as testData from '../resources/wrwUsers';
import { afterEach } from 'mocha';
import { genesisHash, specVersion, txVersion } from '../resources';

describe('Polyx:', function () {
  let bitgo: TestBitGoAPI;
  let baseCoin;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('polyx', Polyx.createInstance);
    bitgo.safeRegister('tpolyx', Tpolyx.createInstance);
    bitgo.initializeTestVars();
    baseCoin = bitgo.coin('tpolyx') as Tpolyx;
  });

  describe('Address Format Constants', function () {
    it('should have the correct address format constants', function () {
      // Verify the constants are defined correctly
      POLYX_ADDRESS_FORMAT.should.equal(12);
      TPOLYX_ADDRESS_FORMAT.should.equal(42);
    });
  });

  describe('Recover Transactions:', function () {
    const sandBox = sinon.createSandbox();
    const recoveryDestination = '5H56f31hSYGCRV3URjQHv2Cc4ZSkJNHTM8MKGtkkV6hzCqN7';
    const nonce = 0;
    let accountInfoCB;
    let headerInfoCB;
    let getFeeCB;

    beforeEach(function () {
      accountInfoCB = sandBox.stub(Polyx.prototype, 'getAccountInfo' as keyof Polyx);
      headerInfoCB = sandBox.stub(Polyx.prototype, 'getHeaderInfo' as keyof Polyx);
      getFeeCB = sandBox.stub(Polyx.prototype, 'getFee' as keyof Polyx);
    });

    afterEach(function () {
      sandBox.restore();
    });

    it('should generate unsigned sweep correctly', async function () {
      accountInfoCB
        .withArgs(testData.unsignedSweepUser.walletAddress)
        .resolves({ nonce: 0, freeBalance: 100007000000 });
      headerInfoCB.resolves({
        headerNumber: testData.testnetBlock.blockNumber,
        headerHash: testData.testnetBlock.hash,
      });
      getFeeCB.withArgs(recoveryDestination, testData.unsignedSweepUser.walletAddress, 100007000000).resolves(74401);

      const commonKeyChain = testData.unsignedSweepUser.bitgoKey;

      const unsigned = await baseCoin.recover({ bitgoKey: commonKeyChain, recoveryDestination });

      unsigned.txRequests.should.not.be.undefined();
      unsigned.txRequests.length.should.equal(1);
      unsigned.txRequests[0].transactions.length.should.equal(1);
      unsigned.txRequests[0].walletCoin.should.equal('tpolyx');
      unsigned.txRequests[0].transactions[0].unsignedTx.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.serializedTx.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.scanIndex.should.equal(0);
      unsigned.txRequests[0].transactions[0].unsignedTx.coin.should.equal('tpolyx');
      unsigned.txRequests[0].transactions[0].unsignedTx.signableHex.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.derivationPath.should.equal('m/0');
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.inputs.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.inputs.length.should.equal(1);
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.inputs[0].address.should.equal(
        '5DnZQqbxtB3CWkLgfA6wpqdkCd9Bq7AX49RpLPJwW9mzoT7s'
      );
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.inputs[0].valueString.should.equal('100006255990');
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.inputs[0].value.should.equal(100006255990);
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.outputs.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.outputs.length.should.equal(1);
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.outputs[0].address.should.equal(
        '5H56f31hSYGCRV3URjQHv2Cc4ZSkJNHTM8MKGtkkV6hzCqN7'
      );
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.outputs[0].valueString.should.equal('100006255990');
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.outputs[0].coinName.should.equal('tpolyx');
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.type.should.equal('');
      unsigned.txRequests[0].transactions[0].unsignedTx.feeInfo.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.feeInfo.fee.should.equal(0);
      unsigned.txRequests[0].transactions[0].unsignedTx.feeInfo.feeString.should.equal('0');
      unsigned.txRequests[0].transactions[0].unsignedTx.coinSpecific.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.coinSpecific.firstValid.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.coinSpecific.maxDuration.should.equal(2400);
      unsigned.txRequests[0].transactions[0].unsignedTx.coinSpecific.commonKeychain.should.equal(
        '97d9da8bf544d07f3c7ae8ee06bb12a63f74478d0c461201ab94421a9c81d5b379553f0332daaa85cb8c65e1fe7e6907c62268c00812b08a4e1361178e304ddb'
      );
    });

    it('should recover a tx for non-bitgo recoveries', async function () {
      accountInfoCB.withArgs(testData.wrwUser.walletAddress).resolves({ nonce: 0, freeBalance: 100007000000 });
      headerInfoCB.resolves({
        headerNumber: testData.testnetBlock.blockNumber,
        headerHash: testData.testnetBlock.hash,
      });
      getFeeCB.withArgs(recoveryDestination, testData.wrwUser.walletAddress, 100007000000).resolves(74401);

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

      const txBuilder = baseCoin.getBuilder().from(res.serializedTx);
      txBuilder
        .validity({
          firstValid: testData.testnetBlock.blockNumber,
          maxDuration: baseCoin.SWEEP_TXN_DURATION,
        })
        .referenceBlock(testData.testnetBlock.hash);

      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.sender, testData.wrwUser.walletAddress);
      should.deepEqual(txJson.blockNumber, testData.testnetBlock.blockNumber);
      should.deepEqual(txJson.referenceBlock, testData.testnetBlock.hash);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, nonce);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.eraPeriod, baseCoin.SWEEP_TXN_DURATION);
    });

    it('should recover a txn for unsigned-sweep recoveries', async function () {
      accountInfoCB
        .withArgs(testData.unsignedSweepUser.walletAddress)
        .resolves({ nonce: 0, freeBalance: 100007000000 });
      headerInfoCB.resolves({
        headerNumber: testData.testnetBlock.blockNumber,
        headerHash: testData.testnetBlock.hash,
      });
      getFeeCB.withArgs(recoveryDestination, testData.unsignedSweepUser.walletAddress, 100007000000).resolves(74401);

      const res = await baseCoin.recover({
        bitgoKey: testData.unsignedSweepUser.bitgoKey,
        recoveryDestination: recoveryDestination,
      });

      res.should.not.be.empty();
      res.txRequests[0].transactions[0].unsignedTx.should.hasOwnProperty('serializedTx');
      res.txRequests[0].transactions[0].unsignedTx.should.hasOwnProperty('scanIndex');

      const txBuilder = baseCoin.getBuilder().from(res.txRequests[0].transactions[0].unsignedTx.serializedTx);
      txBuilder
        .validity({
          firstValid: testData.testnetBlock.blockNumber,
          maxDuration: baseCoin.SWEEP_TXN_DURATION,
        })
        .referenceBlock(testData.testnetBlock.hash)
        .sender({ address: testData.unsignedSweepUser.walletAddress });

      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.sender, testData.unsignedSweepUser.walletAddress);
      should.deepEqual(txJson.blockNumber, testData.testnetBlock.blockNumber);
      should.deepEqual(txJson.referenceBlock, testData.testnetBlock.hash);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 0);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.eraPeriod, baseCoin.SWEEP_TXN_DURATION);
    });
  });

  describe('Token Enablement:', function () {
    it('should have correct token enablement config', function () {
      const config = baseCoin.getTokenEnablementConfig();
      should.exist(config);
      config.requiresTokenEnablement.should.equal(true);
      config.supportsMultipleTokenEnablements.should.equal(false);
    });

    it('should validate wallet type for token enablement', function () {
      const config = baseCoin.getTokenEnablementConfig();
      (() => config.validateWallet('custodial')).should.not.throw();
      (() => config.validateWallet('hot')).should.throw(
        /Token enablement for Polymesh \(polyx\) is only supported for custodial wallets/
      );
      (() => config.validateWallet('cold')).should.throw(
        /Token enablement for Polymesh \(polyx\) is only supported for custodial wallets/
      );
    });
  });
});
