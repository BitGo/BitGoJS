import * as should from 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo-beta/sdk-test';
import { BitGoAPI } from '@bitgo-beta/sdk-api';

import { Sgb, Tsgb } from '../../src/index';
import { UnsignedSweepTxMPCv2 } from '@bitgo-beta/abstract-eth';
import { mockDataUnsignedSweep, mockDataNonBitGoRecovery } from '../resources';
import nock from 'nock';
import { common } from '@bitgo-beta/sdk-core';
import { FeeMarketEIP1559Transaction } from '@ethereumjs/tx';
import { stripHexPrefix } from '@ethereumjs/util';

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

describe('Build Unsigned Sweep for Self-Custody Cold Wallets - (MPCv2)', function () {
  const bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
  const explorerUrl = common.Environments[bitgo.getEnv()].sgbExplorerBaseUrl as string;

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

    const baseCoin: any = bitgo.coin('tsgb');
    const transaction = (await baseCoin.recover({
      userKey: mockDataUnsignedSweep.userKey,
      backupKey: mockDataUnsignedSweep.backupKey,
      walletContractAddress: mockDataUnsignedSweep.walletBaseAddress,
      recoveryDestination: mockDataUnsignedSweep.recoveryDestination,
      isTss: true,
      eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
      gasLimit: 500000,
      replayProtectionOptions: {
        chain: 16,
        hardfork: 'london',
      },
    })) as UnsignedSweepTxMPCv2;
    should.exist(transaction);
    transaction.should.have.property('txRequests');
    transaction.txRequests.length.should.equal(1);
    const txRequest = transaction.txRequests[0];
    txRequest.should.have.property('walletCoin');
    txRequest.walletCoin.should.equal('tsgb');
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

describe('Non Bitgo Recovery for Hot Wallets', function () {
  const bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
  const explorerUrl = common.Environments[bitgo.getEnv()].sgbExplorerBaseUrl as string;
  const maxFeePerGasvalue = 20000000000;
  const maxPriorityFeePerGasValue = 10000000000;
  const chain_id = 16;
  const gasLimitvalue = 500000;

  it('should generate a signed non-bitgo recovery tx', async () => {
    nock(explorerUrl)
      .get('/api')
      .twice()
      .query(mockDataNonBitGoRecovery.getTxListRequest)
      .reply(200, mockDataNonBitGoRecovery.getTxListResponse);
    nock(explorerUrl)
      .get('/api')
      .query(mockDataNonBitGoRecovery.getBalanceRequest)
      .reply(200, mockDataNonBitGoRecovery.getBalanceResponse);

    const baseCoin: any = bitgo.coin('tsgb');
    const transaction = await baseCoin.recover({
      userKey: mockDataNonBitGoRecovery.userKeyData,
      backupKey: mockDataNonBitGoRecovery.backupKeyData,
      walletContractAddress: mockDataNonBitGoRecovery.walletRootAddress,
      walletPassphrase: mockDataNonBitGoRecovery.walletPassphrase,
      recoveryDestination: mockDataNonBitGoRecovery.recoveryDestination,
      isTss: true,
      eip1559: { maxFeePerGas: maxFeePerGasvalue, maxPriorityFeePerGas: maxPriorityFeePerGasValue },
      gasLimit: gasLimitvalue,
      replayProtectionOptions: {
        chain: chain_id,
        hardfork: 'london',
      },
    });
    should.exist(transaction);
    transaction.should.have.property('id');
    transaction.should.have.property('tx');
    const tx = FeeMarketEIP1559Transaction.fromSerializedTx(Buffer.from(stripHexPrefix(transaction.tx), 'hex'));
    tx.getSenderAddress().toString().should.equal(mockDataNonBitGoRecovery.walletRootAddress);
    const jsonTx = tx.toJSON();
    jsonTx.to?.should.equal(mockDataNonBitGoRecovery.recoveryDestination);
  });
});
