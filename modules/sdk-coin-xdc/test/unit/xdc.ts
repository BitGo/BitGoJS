import * as should from 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Xdc, Txdc } from '../../src/index';
import { UnsignedSweepTxMPCv2 } from '@bitgo/abstract-eth';
import { mockDataUnsignedSweep } from '../resources';
import nock from 'nock';
import { common } from '@bitgo/sdk-core';

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

describe('Build Unsigned Sweep for Self-Custody Cold Wallets - (MPCv2)', function () {
  const bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
  const explorerUrl = common.Environments[bitgo.getEnv()].xdcExplorerBaseUrl as string;
  const maxFeePerGasvalue = 20000000000;
  const maxPriorityFeePerGasValue = 10000000000;
  const gasLimitValue = 500000;
  const chain_id = 51;

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

    const baseCoin: any = bitgo.coin('txdc');
    const transaction = (await baseCoin.recover({
      userKey: mockDataUnsignedSweep.userKey,
      backupKey: mockDataUnsignedSweep.backupKey,
      walletContractAddress: mockDataUnsignedSweep.walletBaseAddress,
      recoveryDestination: mockDataUnsignedSweep.recoveryDestination,
      isTss: true,
      eip1559: { maxFeePerGas: maxFeePerGasvalue, maxPriorityFeePerGas: maxPriorityFeePerGasValue },
      gasLimit: gasLimitValue,
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
    txRequest.walletCoin.should.equal('txdc');
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
