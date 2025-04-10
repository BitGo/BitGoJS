import * as should from 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Flr, Tflr } from '../../src/index';
import { UnsignedSweepTxMPCv2 } from '@bitgo/abstract-eth';
import { mockDataUnsignedSweep } from './resources';
import nock from 'nock';
import { common } from '@bitgo/sdk-core';

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
});

describe('Build Unsigned Sweep for Self-Custody Cold Wallets - (MPCv2)', function () {
  const bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
  const explorerUrl = common.Environments[bitgo.getEnv()].flrExplorerBaseUrl as string;
  const maxFeePerGasvalue = 20000000000;
  const maxPriorityFeePerGasValue = 10000000000;
  const chain_id = 114;
  const gasLimitvalue = 500000;

  it('should generate an unsigned sweep without derivation path', async () => {
    nock(explorerUrl)
      .get('/api')
      .twice()
      .query(mockDataUnsignedSweep.getTxListRequest)
      .reply(200, mockDataUnsignedSweep.getTxListResponse);
    nock(explorerUrl)
      .get('/api')
      .query(mockDataUnsignedSweep.getBalanceRequest)
      .reply(200, mockDataUnsignedSweep.getBalanceResponse);

    const baseCoin: any = bitgo.coin('tflr');
    const transaction = (await baseCoin.recover({
      userKey: mockDataUnsignedSweep.userKey,
      backupKey: mockDataUnsignedSweep.backupKey,
      walletContractAddress: mockDataUnsignedSweep.walletBaseAddress,
      recoveryDestination: mockDataUnsignedSweep.recoveryDestination,
      isTss: true,
      eip1559: { maxFeePerGas: maxPriorityFeePerGasValue, maxPriorityFeePerGas: maxFeePerGasvalue },
      gasLimit: gasLimitvalue,
      replayProtectionOptions: {
        chain: chain_id,
        hardfork: 'london',
      },
    })) as UnsignedSweepTxMPCv2;
    should.exist(transaction);
    transaction.should.have.property('txRequests');
    transaction.txRequests.length.should.equal(1);
    const txRequest = transaction.txRequests[0];
    txRequest.should.have.property('walletCoin');
    txRequest.walletCoin.should.equal('tflr');
    txRequest.should.have.property('transactions');
    txRequest.transactions.length.should.equal(1);
    const tx = txRequest.transactions[0];
    tx.should.have.property('nonce');
    tx.should.have.property('unsignedTx');
    tx.unsignedTx.should.have.property('serializedTxHex');
    tx.unsignedTx.should.have.property('signableHex');
    tx.unsignedTx.should.have.property('derivationPath');
    tx.unsignedTx.should.have.property('feeInfo');
    tx.unsignedTx.feeInfo?.should.have.property('fee');
    tx.unsignedTx.feeInfo?.should.have.property('feeString');
    tx.unsignedTx.should.have.property('parsedTx');
    tx.unsignedTx.parsedTx?.should.have.property('spendAmount');
    tx.unsignedTx.parsedTx?.should.have.property('outputs');
  });
});
