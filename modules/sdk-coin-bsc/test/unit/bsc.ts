import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Bsc, Tbsc } from '../../src/index';
import * as mockData from '../fixtures/ecdsa';
import nock from 'nock';
import { AbstractEthLikeNewCoins, UnsignedSweepTxMPCv2 } from '@bitgo/abstract-eth';
import should from 'should';
import assert from 'assert';

describe('Binance Smart Chain', function () {
  let bitgo: TestBitGoAPI;
  let basecoin;

  before(function () {
    const env = 'test';
    bitgo = TestBitGo.decorate(BitGoAPI, { env });
    bitgo.safeRegister('bsc', Bsc.createInstance);
    bitgo.safeRegister('tbsc', Tbsc.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tbsc');
  });

  after(function () {
    nock.cleanAll();

    describe('Basic Coin Info', function () {
      it('should return the right info for bsc', function () {
        const bsc = bitgo.coin('bsc');

        bsc.should.be.an.instanceof(Bsc);
        bsc.getChain().should.equal('bsc');
        bsc.getFamily().should.equal('bsc');
        bsc.getFullName().should.equal('Binance Smart Chain');
        bsc.getBaseFactor().should.equal(1e18);
        bsc.supportsTss().should.equal(true);
        bsc.allowsAccountConsolidations().should.equal(true);
      });

      it('should return the right info for tbsc', function () {
        const tbsc = bitgo.coin('tbsc');

        tbsc.should.be.an.instanceof(Tbsc);
        tbsc.getChain().should.equal('tbsc');
        tbsc.getFamily().should.equal('bsc');
        tbsc.getFullName().should.equal('Testnet Binance Smart Chain');
        tbsc.getBaseFactor().should.equal(1e18);
        tbsc.supportsTss().should.equal(true);
        tbsc.allowsAccountConsolidations().should.equal(true);
      });
    });

    describe('Non-BitGo Recovery for Hot Wallets (MPCv2)', function () {
      const baseUrl = 'https://bscscan.com/';

      it('should build a recovery transaction for MPCv2 kind of hot wallets', async function () {
        nock(baseUrl)
          .get('/api')
          .query(mockData.getTxListRequest(mockData.getNonBitGoRecoveryForHotWalletsMPCv2().bitgoFeeAddress))
          .reply(200, mockData.getTxListResponse);

        nock(baseUrl)
          .get('/api')
          .query(mockData.getBalanceRequest(mockData.getNonBitGoRecoveryForHotWalletsMPCv2().bitgoFeeAddress))
          .reply(200, mockData.getBalanceResponse);

        nock(baseUrl)
          .get('/api')
          .query(mockData.getBalanceRequest(mockData.getNonBitGoRecoveryForHotWalletsMPCv2().walletContractAddress))
          .reply(200, mockData.getBalanceResponse);

        const params = mockData.getNonBitGoRecoveryForHotWalletsMPCv2();

        const transaction = await (basecoin as AbstractEthLikeNewCoins).recover({
          userKey: params.userKey,
          backupKey: params.backupKey,
          walletPassphrase: params.walletPassphrase,
          walletContractAddress: params.walletContractAddress,
          bitgoFeeAddress: params.bitgoFeeAddress,
          recoveryDestination: params.recoveryDestination,
          gasPrice: 20000000000, // Using legacy gasPrice for BSC
          gasLimit: 500000,
          isTss: true,
          bitgoDestinationAddress: params.bitgoDestinationAddress,
          replayProtectionOptions: { chain: 80002, hardfork: 'petersburg' }, // BSC uses petersburg hardfork
          intendedChain: params.intendedChain,
        });
        should.exist(transaction);
        transaction.should.have.property('tx');
      });

      it('should throw an error for invalid user key', async function () {
        const params = mockData.getInvalidNonBitGoRecoveryParams();

        await assert.rejects(
          async () => {
            await (basecoin as AbstractEthLikeNewCoins).recover({
              userKey: params.userKey,
              backupKey: params.backupKey,
              walletPassphrase: params.walletPassphrase,
              walletContractAddress: params.walletContractAddress,
              bitgoFeeAddress: params.bitgoFeeAddress,
              recoveryDestination: params.recoveryDestination,
              gasPrice: 20000000000, // Using legacy gasPrice for BSC
              gasLimit: 500000,
              bitgoDestinationAddress: params.bitgoDestinationAddress,
              intendedChain: params.intendedChain,
            });
          },
          Error,
          'user key is invalid'
        );
      });
    });

    describe('Build Unsigned Sweep for Self-Custody Cold Wallets (MPCv2)', function () {
      const baseUrl = 'https://bscscan.com/';

      it('should generate an unsigned sweep with legacy transaction format', async function () {
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

        const params = mockData.getBuildUnsignedSweepForSelfCustodyColdWalletsMPCv2();
        const sweepResult = await (basecoin as AbstractEthLikeNewCoins).recover({
          userKey: params.commonKeyChain,
          backupKey: params.commonKeyChain,
          recoveryDestination: params.recoveryDestination,
          gasLimit: 200000,
          gasPrice: 20000000000, // Using legacy gasPrice for BSC
          walletContractAddress: params.walletContractAddress,
          isTss: true,
          replayProtectionOptions: {
            chain: '97',
            hardfork: 'petersburg', // BSC uses petersburg hardfork
          },
        });

        should.exist(sweepResult);
        const output = sweepResult as UnsignedSweepTxMPCv2;
        output.should.have.property('txRequests');
        output.txRequests.should.have.length(1);
        output.txRequests[0].should.have.property('transactions');
        output.txRequests[0].transactions.should.have.length(1);
        output.txRequests[0].should.have.property('walletCoin');
        output.txRequests[0].transactions[0].should.have.property('unsignedTx');
        output.txRequests[0].transactions[0].unsignedTx.should.have.property('serializedTxHex');
        output.txRequests[0].transactions[0].unsignedTx.should.have.property('signableHex');
        output.txRequests[0].transactions[0].unsignedTx.should.have.property('derivationPath');
        output.txRequests[0].transactions[0].unsignedTx.should.have.property('feeInfo');
        output.txRequests[0].transactions[0].unsignedTx.should.have.property('parsedTx');
        const parsedTx = output.txRequests[0].transactions[0].unsignedTx.parsedTx as { spendAmount: string };
        parsedTx.should.have.property('spendAmount');
        (output.txRequests[0].transactions[0].unsignedTx.parsedTx as { outputs: any[] }).should.have.property(
          'outputs'
        );

        // Verify that eip1559 is not present in the unsigned transaction
        should.not.exist(output.txRequests[0].transactions[0].unsignedTx.eip1559);
      });

      it('should convert EIP-1559 parameters to legacy format for BSC', async function () {
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

        const params = mockData.getBuildUnsignedSweepForSelfCustodyColdWalletsMPCv2();
        const sweepResult = await (basecoin as AbstractEthLikeNewCoins).recover({
          userKey: params.commonKeyChain,
          backupKey: params.commonKeyChain,
          recoveryDestination: params.recoveryDestination,
          gasLimit: 200000,
          gasPrice: 20000000000, // Using legacy gasPrice for BSC
          walletContractAddress: params.walletContractAddress,
          isTss: true,
          replayProtectionOptions: {
            chain: '97',
            hardfork: 'petersburg', // BSC uses petersburg hardfork
          },
        });

        should.exist(sweepResult);
        const output = sweepResult as UnsignedSweepTxMPCv2;

        // Verify that eip1559 is not present in the unsigned transaction
        should.not.exist(output.txRequests[0].transactions[0].unsignedTx.eip1559);
      });

      it('should throw an error for invalid address', async function () {
        const params = mockData.getBuildUnsignedSweepForSelfCustodyColdWalletsMPCv2();
        params.recoveryDestination = 'invalidAddress';

        params.userKey =
          '0234eb39b22fed523ece7c78da29ba1f1de5b64a6e48013e0914de793bc1df0570e779de04758732734d97e54b782c8b336283811af6a2c57bd81438798e1c2446';
        params.backupKey =
          '0234eb39b22fed523ece7c78da29ba1f1de5b64a6e48013e0914de793bc1df0570e779de04758732734d97e54b782c8b336283811af6a2c57bd81438798e1c2446';

        await assert.rejects(
          async () => {
            await (basecoin as AbstractEthLikeNewCoins).recover({
              recoveryDestination: params.recoveryDestination,
              gasLimit: 2000,
              gasPrice: 200, // Using legacy gasPrice for BSC
              userKey: params.userKey,
              backupKey: params.backupKey,
              walletContractAddress: params.walletContractAddress,
              isTss: true,
              replayProtectionOptions: {
                chain: '97',
                hardfork: 'petersburg', // BSC uses petersburg hardfork
              },
            });
          },
          Error,
          'Error: invalid address'
        );
      });
    });
  });
});
