import should from 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Flr, Tflr } from '../../src/index';
import nock from 'nock';
import { AbstractEthLikeNewCoins, UnsignedSweepTxMPCv2 } from '@bitgo/abstract-eth';
import assert from 'assert';
import * as mockData from '../../src/lib/resources';

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });

describe('flr', function () {
  before(function () {
    bitgo.safeRegister('flr', Flr.createInstance);
    bitgo.safeRegister('tflr', Tflr.createInstance);
    bitgo.initializeTestVars();
  });

  describe('Basic Coin Info', function () {
    it('should return the right info for flr', function () {
      const flr = bitgo.coin('flr');

      flr.should.be.an.instanceof(Flr);
      flr.getChain().should.equal('flr');
      flr.getFamily().should.equal('flr');
      flr.getFullName().should.equal('Flare');
      flr.getBaseFactor().should.equal(1e18);
      flr.supportsTss().should.equal(true);
      flr.allowsAccountConsolidations().should.equal(false);
    });

    it('should return the right info for tflr', function () {
      const tflr = bitgo.coin('tflr');

      tflr.should.be.an.instanceof(Tflr);
      tflr.getChain().should.equal('tflr');
      tflr.getFamily().should.equal('flr');
      tflr.getFullName().should.equal('Testnet flare');
      tflr.getBaseFactor().should.equal(1e18);
      tflr.supportsTss().should.equal(true);
      tflr.allowsAccountConsolidations().should.equal(false);
    });
  });

  describe('Build Unsigned Sweep for Self-Custody Cold Wallets (MPCv2)', function () {
    const baseUrl = 'https://coston2-explorer.flare.network';
    let bitgo: TestBitGoAPI;
    let basecoin: Tflr;

    before(function () {
      bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
      basecoin = bitgo.coin('tflr') as Tflr;
    });

    it('should generate an unsigned sweep without derivation seed', async function () {
      nock(baseUrl)
        .get('/api')
        .query(mockData.getTxListRequest(mockData.getBuildUnsignedSweepForSelfCustodyColdWalletsMPCv2().address))
        .reply(200, mockData.getTxListResponse);

      nock(baseUrl)
        .get('/api')
        .query(mockData.getBalanceRequest(mockData.getBuildUnsignedSweepForSelfCustodyColdWalletsMPCv2().address))
        .reply(200, mockData.getBalanceResponse);
      nock(baseUrl)
        .get('/api')
        .query(
          mockData.getBalanceRequest(
            mockData.getBuildUnsignedSweepForSelfCustodyColdWalletsMPCv2().walletContractAddress
          )
        )
        .reply(200, mockData.getBalanceResponse);

      nock(baseUrl).get('/api').query(mockData.getContractCallRequest).reply(200, mockData.getContractCallResponse);

      const params = mockData.getBuildUnsignedSweepForSelfCustodyColdWalletsMPCv2();
      const sweepResult = await (basecoin as AbstractEthLikeNewCoins).recover({
        userKey: params.commonKeyChain,
        backupKey: params.commonKeyChain,
        derivationSeed: params.derivationSeed,
        recoveryDestination: params.recoveryDestination,
        gasLimit: 200000,
        eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
        walletContractAddress: params.walletContractAddress,
        isTss: true,
        replayProtectionOptions: {
          chain: '42',
          hardfork: 'london',
        },
      });
      should.exist(sweepResult);
      const output = sweepResult as UnsignedSweepTxMPCv2;
      output.should.have.property('txRequests');
      output.txRequests.should.have.length(1);
      output.txRequests[0].should.have.property('transactions');
      output.txRequests[0].transactions.should.have.length(1);
      output.txRequests[0].should.have.property('walletCoin');
      output.txRequests[0].transactions.should.have.length(1);
      output.txRequests[0].transactions[0].should.have.property('unsignedTx');
      output.txRequests[0].transactions[0].unsignedTx.should.have.property('serializedTxHex');
      output.txRequests[0].transactions[0].unsignedTx.should.have.property('signableHex');
      output.txRequests[0].transactions[0].unsignedTx.should.have.property('derivationPath');
      output.txRequests[0].transactions[0].unsignedTx.should.have.property('feeInfo');
      output.txRequests[0].transactions[0].unsignedTx.should.have.property('parsedTx');
      const parsedTx = output.txRequests[0].transactions[0].unsignedTx.parsedTx as { spendAmount: string };
      parsedTx.should.have.property('spendAmount');
      (output.txRequests[0].transactions[0].unsignedTx.parsedTx as { outputs: any[] }).should.have.property('outputs');
    });

    it('should throw an error for invalid address', async function () {
      const params = mockData.getBuildUnsignedSweepForSelfCustodyColdWalletsMPCv2();
      params.recoveryDestination = 'invalidAddress';

      params.userKey =
        '037ad32f53294c100cf15d18ab90718c6715adb8145f6c0ffa70499dc3f58e38d7890ec51e7fd971808b82110ad5920335facc7a358f42e70af1b8bf9da791a0ff';
      params.backupKey =
        '037ad32f53294c100cf15d18ab90718c6715adb8145f6c0ffa70499dc3f58e38d7890ec51e7fd971808b82110ad5920335facc7a358f42e70af1b8bf9da791a0ff';

      await assert.rejects(
        async () => {
          await (basecoin as AbstractEthLikeNewCoins).recover({
            recoveryDestination: params.recoveryDestination,
            gasLimit: 2000,
            eip1559: { maxFeePerGas: 200, maxPriorityFeePerGas: 10000 },
            userKey: params.userKey,
            backupKey: params.backupKey,
            walletContractAddress: params.walletContractAddress,
            isTss: true,
            replayProtectionOptions: {
              chain: '42',
              hardfork: 'london',
            },
          });
        },
        Error,
        'Error: invalid address'
      );
    });
  });
});
