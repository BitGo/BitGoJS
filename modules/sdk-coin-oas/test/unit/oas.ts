import * as should from 'should';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Oas, Toas } from '../../src/index';
import { UnsignedSweepTxMPCv2 } from '@bitgo/abstract-eth';
import { mockDataUnsignedSweep } from '../resources';
import nock from 'nock';
import { common } from '@bitgo/sdk-core';

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });

describe('OASYS chain', function () {
  before(function () {
    bitgo.safeRegister('oas', Oas.createInstance);
    bitgo.safeRegister('toas', Toas.createInstance);
    bitgo.initializeTestVars();
  });

  describe('Basic Coin Info', function () {
    it('should return the right info for oas', function () {
      const oas = bitgo.coin('oas');

      oas.should.be.an.instanceof(Oas);
      oas.getChain().should.equal('oas');
      oas.getFamily().should.equal('oas');
      oas.getFullName().should.equal('Oasys');
      oas.getBaseFactor().should.equal(1e18);
      oas.supportsTss().should.equal(true);
      oas.allowsAccountConsolidations().should.equal(false);
    });

    it('should return the right info for toas', function () {
      const toas = bitgo.coin('toas');

      toas.should.be.an.instanceof(Toas);
      toas.getChain().should.equal('toas');
      toas.getFamily().should.equal('oas');
      toas.getFullName().should.equal('Testnet Oasys');
      toas.getBaseFactor().should.equal(1e18);
      toas.supportsTss().should.equal(true);
      toas.allowsAccountConsolidations().should.equal(false);
    });
  });
});

describe('Build Unsigned Sweep for Self-Custody Cold Wallets - (MPCv2)', function () {
  const bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
  const explorerUrl = common.Environments[bitgo.getEnv()].oasExplorerBaseUrl as string;
  const maxFeePerGasvalue = 20000000000;
  const maxPriorityFeePerGasValue = 10000000000;
  const chain_id = 9372;
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

    const baseCoin: any = bitgo.coin('toas');
    const transaction = (await baseCoin.recover({
      userKey: mockDataUnsignedSweep.userKey,
      backupKey: mockDataUnsignedSweep.backupKey,
      walletContractAddress: mockDataUnsignedSweep.walletBaseAddress,
      recoveryDestination: mockDataUnsignedSweep.recoveryDestination,
      isTss: true,
      eip1559: { maxFeePerGas: maxFeePerGasvalue, maxPriorityFeePerGas: maxPriorityFeePerGasValue },
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
    txRequest.walletCoin.should.equal('toas');
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
