import should from 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Sgb, Tsgb } from '../../src/index';
import nock from 'nock';
import { AbstractEthLikeNewCoins, UnsignedSweepTxMPCv2 } from '@bitgo/abstract-eth';
import assert from 'assert';
import * as mockData from '../../src/lib/resources';

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });

describe('sgb', function () {
  before(function () {
    bitgo.safeRegister('sgb', Sgb.createInstance);
    bitgo.safeRegister('tsgb', Tsgb.createInstance);
    bitgo.initializeTestVars();
  });

  describe('Basic Coin Info', function () {
    it('should return the right info for sgb', function () {
      const sgb = bitgo.coin('sgb');

      sgb.should.be.an.instanceof(Sgb);
      sgb.getChain().should.equal('sgb');
      sgb.getFamily().should.equal('sgb');
      sgb.getFullName().should.equal('Songbird');
      sgb.getBaseFactor().should.equal(1e18);
      sgb.supportsTss().should.equal(true);
      sgb.allowsAccountConsolidations().should.equal(false);
    });

    it('should return the right info for tsgb', function () {
      const tsgb = bitgo.coin('tsgb');

      tsgb.should.be.an.instanceof(Tsgb);
      tsgb.getChain().should.equal('tsgb');
      tsgb.getFamily().should.equal('sgb');
      tsgb.getFullName().should.equal('Testnet songbird');
      tsgb.getBaseFactor().should.equal(1e18);
      tsgb.supportsTss().should.equal(true);
      tsgb.allowsAccountConsolidations().should.equal(false);
    });
  });
});

describe('Build Unsigned Sweep for Self-Custody Cold Wallets (MPCv2)', function () {
  const baseUrl = 'https://coston-explorer.flare.network';
  let bitgo: TestBitGoAPI;
  let basecoin: Tsgb;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    basecoin = bitgo.coin('twemix') as Tsgb;
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
        mockData.getBalanceRequest(mockData.getBuildUnsignedSweepForSelfCustodyColdWalletsMPCv2().walletContractAddress)
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
      '038412b0e79372ca618978f2bc9fc944c504e828050a55a19fdfeca93cff5ec6562ae94f204a3f99e87334f812be8a54927ff24572bc666c5436887d2e42c0997d';
    params.backupKey =
      '038412b0e79372ca618978f2bc9fc944c504e828050a55a19fdfeca93cff5ec6562ae94f204a3f99e87334f812be8a54927ff24572bc666c5436887d2e42c0997d';

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
