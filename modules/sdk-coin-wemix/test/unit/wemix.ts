import * as should from 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Wemix, Twemix } from '../../src/index';
import { UnsignedSweepTxMPCv2 } from '@bitgo/abstract-eth';
import { mockDataUnsignedSweep, mockDataNonBitGoRecovery } from '../resources';
import nock from 'nock';
import { common } from '@bitgo/sdk-core';
import { FeeMarketEIP1559Transaction } from '@ethereumjs/tx';
import { stripHexPrefix } from '@ethereumjs/util';

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
  const bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
  const explorerUrl = common.Environments[bitgo.getEnv()].wemixExplorerBaseUrl as string;

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

    const baseCoin: any = bitgo.coin('twemix');
    const transaction = (await baseCoin.recover({
      userKey: mockDataUnsignedSweep.userKey,
      backupKey: mockDataUnsignedSweep.backupKey,
      walletContractAddress: mockDataUnsignedSweep.walletBaseAddress,
      recoveryDestination: mockDataUnsignedSweep.recoveryDestination,
      isTss: true,
      eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
      gasLimit: 500000,
      replayProtectionOptions: {
        chain: 1112,
        hardfork: 'london',
      },
    })) as UnsignedSweepTxMPCv2;
    should.exist(transaction);
    transaction.should.have.property('txRequests');
    transaction.txRequests.length.should.equal(1);
    const txRequest = transaction.txRequests[0];
    txRequest.should.have.property('walletCoin');
    txRequest.walletCoin.should.equal('twemix');
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
  const explorerUrl = common.Environments[bitgo.getEnv()].wemixExplorerBaseUrl as string;
  const maxFeePerGasvalue = 20000000000;
  const maxPriorityFeePerGasValue = 10000000000;
  const chain_id = 1112;
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

    const baseCoin: any = bitgo.coin('twemix');
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
