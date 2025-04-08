import should from 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Xdc, Txdc } from '../../src/index';
import nock from 'nock';
import { AbstractEthLikeNewCoins, UnsignedSweepTxMPCv2 } from '@bitgo/abstract-eth';
import assert from 'assert';
import * as mockData from '../../src/lib/resources';

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });

describe('xdc', function () {
  before(function () {
    bitgo.safeRegister('xdc', Xdc.createInstance);
    bitgo.safeRegister('txdc', Txdc.createInstance);
    bitgo.initializeTestVars();
  });

  describe('Basic Coin Info', function () {
    it('should return the right info for xdc', function () {
      const xdc = bitgo.coin('xdc');

      xdc.should.be.an.instanceof(Xdc);
      xdc.getChain().should.equal('xdc');
      xdc.getFamily().should.equal('xdc');
      xdc.getFullName().should.equal('XDC');
      xdc.getBaseFactor().should.equal(1e18);
      xdc.supportsTss().should.equal(true);
      xdc.allowsAccountConsolidations().should.equal(false);
    });

    it('should return the right info for txdc', function () {
      const txdc = bitgo.coin('txdc');

      txdc.should.be.an.instanceof(Txdc);
      txdc.getChain().should.equal('txdc');
      txdc.getFamily().should.equal('xdc');
      txdc.getFullName().should.equal('Testnet XDC');
      txdc.getBaseFactor().should.equal(1e18);
      txdc.supportsTss().should.equal(true);
      txdc.allowsAccountConsolidations().should.equal(false);
    });
  });
});

describe('Build Unsigned Sweep for Self-Custody Cold Wallets (MPCv2)', function () {
  const baseUrl = 'https://api-apothem.xdcscan.io';
  let bitgo: TestBitGoAPI;
  let basecoin: Txdc;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    basecoin = bitgo.coin('twemix') as Txdc;
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
      '029d2ded2d39ee7cd8d8bbba8b25e4c60bb09297936fa6b223de1f495b5ee20dcaf762367f9691f7719cb5e13e59d725669a18aad1e2522dd141fa4c7fd3d25c17';
    params.backupKey =
      '029d2ded2d39ee7cd8d8bbba8b25e4c60bb09297936fa6b223de1f495b5ee20dcaf762367f9691f7719cb5e13e59d725669a18aad1e2522dd141fa4c7fd3d25c17';

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
