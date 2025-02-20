import * as should from 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Coredao, Tcoredao } from '../../src';
import nock from 'nock';

import { FeeMarketEIP1559Transaction } from '@ethereumjs/tx';
import { stripHexPrefix } from '@ethereumjs/util';
import { common } from '@bitgo/sdk-core';
import { mockDataNonBitGoRecovery } from '../resources';

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });

describe('Coredao', function () {
  before(function () {
    bitgo.safeRegister('coredao', Coredao.createInstance);
    bitgo.safeRegister('tcoredao', Tcoredao.createInstance);
    bitgo.initializeTestVars();
  });

  describe('Basic Coin Info', function () {
    it('should return the right info for coredao', function () {
      const coredao = bitgo.coin('coredao');

      coredao.should.be.an.instanceof(Coredao);
      coredao.getChain().should.equal('coredao');
      coredao.getFamily().should.equal('coredao');
      coredao.getFullName().should.equal('Core');
      coredao.getBaseFactor().should.equal(1e18);
      coredao.supportsTss().should.equal(true);
      coredao.allowsAccountConsolidations().should.equal(false);
    });

    it('should return the right info for tcoredao', function () {
      const tcoredao = bitgo.coin('tcoredao');

      tcoredao.should.be.an.instanceof(Tcoredao);
      tcoredao.getChain().should.equal('tcoredao');
      tcoredao.getFamily().should.equal('coredao');
      tcoredao.getFullName().should.equal('Testnet Core');
      tcoredao.getBaseFactor().should.equal(1e18);
      tcoredao.supportsTss().should.equal(true);
      tcoredao.allowsAccountConsolidations().should.equal(false);
    });
  });

  describe('Build Recover Transaction', function () {
    const bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    const explorerUrl = common.Environments[bitgo.getEnv()].coredaoExplorerBaseUrl as string;

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

      const baseCoin: any = bitgo.coin('tcoredao');
      const transaction = await baseCoin.recover({
        userKey: mockDataNonBitGoRecovery.userKeyData,
        backupKey: mockDataNonBitGoRecovery.backupKeyData,
        walletContractAddress: mockDataNonBitGoRecovery.walletRootAddress,
        walletPassphrase: mockDataNonBitGoRecovery.walletPassphrase,
        recoveryDestination: mockDataNonBitGoRecovery.recoveryDestination,
        isTss: true,
        eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
        gasLimit: 500000,
        replayProtectionOptions: {
          chain: 1114,
          hardfork: 'london',
        },
      });
      should.exist(transaction);
      transaction.should.have.property('id');
      transaction.should.have.property('tx');
      const tx = FeeMarketEIP1559Transaction.fromSerializedTx(Buffer.from(stripHexPrefix(transaction.tx), 'hex'));
      tx.getSenderAddress().toString().should.equal(mockDataNonBitGoRecovery.walletRootAddress);
      const jsonTx = tx.toJSON();
      jsonTx.chainId?.should.equal('0x45a');
      jsonTx.to?.should.equal(mockDataNonBitGoRecovery.recoveryDestination);
    });
  });
});
