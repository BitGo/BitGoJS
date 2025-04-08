import should from 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Wemix, Twemix } from '../../src/index';
import nock from 'nock';
import { AbstractEthLikeNewCoins, UnsignedSweepTxMPCv2 } from '@bitgo/abstract-eth';
import assert from 'assert';
import * as mockData from '../../src/lib/resources';

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });

describe('wemix', function () {
  before(function () {
    bitgo.safeRegister('wemix', Wemix.createInstance);
    bitgo.safeRegister('twemix', Twemix.createInstance);
    bitgo.initializeTestVars();
  });

  describe('Basic Coin Info', function () {
    it('should return the right info for wemix', function () {
      const wemix = bitgo.coin('wemix');

      wemix.should.be.an.instanceof(Wemix);
      wemix.getChain().should.equal('wemix');
      wemix.getFamily().should.equal('wemix');
      wemix.getFullName().should.equal('Wemix');
      wemix.getBaseFactor().should.equal(1e18);
      wemix.supportsTss().should.equal(true);
      wemix.allowsAccountConsolidations().should.equal(false);
    });

    it('should return the right info for twemix', function () {
      const twemix = bitgo.coin('twemix');

      twemix.should.be.an.instanceof(Twemix);
      twemix.getChain().should.equal('twemix');
      twemix.getFamily().should.equal('wemix');
      twemix.getFullName().should.equal('Testnet wemix');
      twemix.getBaseFactor().should.equal(1e18);
      twemix.supportsTss().should.equal(true);
      twemix.allowsAccountConsolidations().should.equal(false);
    });
  });
});

describe('Build Unsigned Sweep for Self-Custody Cold Wallets (MPCv2)', function () {
  const baseUrl = 'https://api-testnet.wemixscan.com';
  let bitgo: TestBitGoAPI;
  let basecoin: Twemix;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    basecoin = bitgo.coin('twemix') as Twemix;
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
      '03b652162cf853235b7f5fc356bbdc26c104366f87ac04bc1211c492fb7e585361c23d7f6f49cf9ead6aa5986b6ecc04b03ad65079e9eb1c25672922045970d2b1';
    params.backupKey =
      '03b652162cf853235b7f5fc356bbdc26c104366f87ac04bc1211c492fb7e585361c23d7f6f49cf9ead6aa5986b6ecc04b03ad65079e9eb1c25672922045970d2b1';

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
