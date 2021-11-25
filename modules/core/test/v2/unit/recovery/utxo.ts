/**
 * @prettier
 */
import 'should';
import * as nock from 'nock';
import * as sinon from 'sinon';

import { TestBitGo } from '../../../lib/test_bitgo';
import * as config from '../../../../src/config';
import { Btc } from '../../../../src/v2/coins';
import {
  addressInfos,
  addressUnspents,
  btcKrsRecoveryDecodedTx,
  btcNonKrsRecoveryDecodedTx,
  emptyAddressInfo,
} from '../../fixtures/coins/recovery';
import { FixtureDir } from '../../../lib/fixtures';
import { BlockchairApi } from '../../../../src/v2/coins/utxo/recovery/blockchairApi';
import { BlockstreamApi } from '../../../../src/v2/coins/utxo/recovery/blockstreamApi';
nock.disableNetConnect();

const recoveryNocks = require('../../lib/recovery-nocks');

const fixtures = new FixtureDir(`${__dirname}/fixtures`);

describe('UTXO Recovery', function () {
  let bitgo;

  before(function () {
    bitgo = new TestBitGo({ env: 'test' });
    bitgo.initializeTestVars();

    // pretend that Keyternal accepts recoveries for all coins
    config.krsProviders.keyternal.supportedCoins = ['btc', 'bch', 'bsv', 'bcha', 'ltc', 'zec', 'dash'];
    (config.krsProviders.keyternal.feeAddresses as any) = {
      tbtc: '2Mujz9eicmgpPcdScRJTywVK3EQNHDJG3yN',
      tbch: '2Mujz9eicmgpPcdScRJTywVK3EQNHDJG3yN',
      tbsv: '2Mujz9eicmgpPcdScRJTywVK3EQNHDJG3yN',
      tbcha: '2Mujz9eicmgpPcdScRJTywVK3EQNHDJG3yN',
      tltc: 'QffXMViM8DYgPRf1Hoczjw7BS5CVdSWaBL',
      tzec: 't2ATLAhBP1uTuyiWs5DY5CPH1VuYkGUindt',
      tdash: '8euHug4dbmPy3CLawwWdeTjGLqPYEGz3Kt',
    };
  });

  describe('Recover TBTC', function () {
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
      recoveryNocks.nockbitcoinFees(600, 600, 100);
      const callBack1 = sandbox.stub(BlockstreamApi.prototype, 'getAccountInfo');
      callBack1.resolves(emptyAddressInfo);
      callBack1
        .withArgs('2MzLAGkQVaDiW2Dbm22ETf4ePyLUcDroqdw')
        .resolves(addressInfos['2MzLAGkQVaDiW2Dbm22ETf4ePyLUcDroqdw']);
      const callBack2 = sandbox.stub(BlockstreamApi.prototype, 'getUnspents');
      callBack2
        .withArgs('2MzLAGkQVaDiW2Dbm22ETf4ePyLUcDroqdw')
        .resolves([addressUnspents['2MzLAGkQVaDiW2Dbm22ETf4ePyLUcDroqdw']]);
      callBack2.resolves([]);
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should generate TBTC recovery tx', async function () {
      sandbox.stub(Btc.prototype, 'verifyRecoveryTransaction').resolves(btcNonKrsRecoveryDecodedTx.transaction);
      const basecoin = bitgo.coin('tbtc');
      const recovery = await basecoin.recover({
        userKey:
          '{"iv":"fTcRIg7nlCf9fPSR4ID8XQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"pkIS5jVDi0Y=","ct":"SJQgP+ZzfOMf2fWxyQ2jpoWYioq6Tqfcw1xiKS1WpWAxLvXfH059sZvPrrYMdijJEbqA8EEaYXWmdgYSkMXdwckRMyvM3uWl9H8iKw1ZJmHyy2eDSy5r/pCtWICkcO3oi2I492I/3Op2YLfIX6XqKWs2mztu/OY="}',
        backupKey:
          '{"iv":"0WkLaOsnO3M7qnV2DbSvWw==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"lGxBnvlGAoM=","ct":"cBalT6MGZ3TYIYHt4jys0WDTZEKK9qIubltKEqfW4zXtxYd1dYLz9qLve/yXPl7NF5Cb1lBNGBBGsfqzvpr0Q5824xiy5i9IKzRBI/69HIt3fC2RjJKDfB1EZUjoozi2O5FH4K7L6Ejq7qZhvi8iOd1ULVpBgnE="}',
        bitgoKey:
          'xpub661MyMwAqRbcGsSbYgWmr9G1dFgPE8HEb1ASRShbw9S1Mmu1dTQ7QStNwpaYFESq3MeKivGidN8twMeJzqh1veuSP1t2XLENL3mwpatfTst',
        walletPassphrase: TestBitGo.V2.TEST_WALLET1_PASSCODE,
        recoveryDestination: '2NB5Ynem6iNvA6GBLZwRxwid3Kui33729Nw',
        scan: 5,
        ignoreAddressTypes: ['p2wsh', 'p2shP2wsh'],
      });
      await fixtures.shouldEqualJSONFixture(recovery, 'btc-recovery-tx.json');
    });

    it('should generate TBTC recovery tx with unencrypted keys', async function () {
      sandbox.stub(Btc.prototype, 'verifyRecoveryTransaction').resolves(btcNonKrsRecoveryDecodedTx.transaction);
      const basecoin = bitgo.coin('tbtc');
      const recovery = await basecoin.recover({
        userKey:
          'xprv9s21ZrQH143K44auQTYjyFpU8aGEpbsbcU5yGjbwfyKpbBpvHPhUHEu3QR6G74rLPyM9ucop7oyXtKYDrjNkU8YeSryQbKU476ijp2qWcBm',
        backupKey:
          'xprv9s21ZrQH143K2cvHDcdruLPTQBUJBDd1XAVbAzFMBFGjcMSH2DgR7T37Dy6YwcRwkh24UkXQKcFAhmkb6g9PXJNqPvfDBAe1eaUK2kJ9stv',
        bitgoKey:
          'xpub661MyMwAqRbcGsSbYgWmr9G1dFgPE8HEb1ASRShbw9S1Mmu1dTQ7QStNwpaYFESq3MeKivGidN8twMeJzqh1veuSP1t2XLENL3mwpatfTst',
        recoveryDestination: '2NB5Ynem6iNvA6GBLZwRxwid3Kui33729Nw',
        scan: 5,
        ignoreAddressTypes: ['p2wsh', 'p2shP2wsh'],
      });
      await fixtures.shouldEqualJSONFixture(recovery, 'btc-recovery-tx.json');
    });

    it('should generate TBTC recovery tx with KRS', async function () {
      recoveryNocks.nockCoingecko(10000, 'bitcoin');
      sandbox.stub(Btc.prototype, 'verifyRecoveryTransaction').resolves(btcKrsRecoveryDecodedTx.transaction);
      const basecoin = bitgo.coin('tbtc');
      const recovery = await basecoin.recover({
        userKey:
          '{"iv":"fTcRIg7nlCf9fPSR4ID8XQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"pkIS5jVDi0Y=","ct":"SJQgP+ZzfOMf2fWxyQ2jpoWYioq6Tqfcw1xiKS1WpWAxLvXfH059sZvPrrYMdijJEbqA8EEaYXWmdgYSkMXdwckRMyvM3uWl9H8iKw1ZJmHyy2eDSy5r/pCtWICkcO3oi2I492I/3Op2YLfIX6XqKWs2mztu/OY="}',
        backupKey:
          'xpub661MyMwAqRbcF6zkKeAsGULBxDJnagLrtPRByNexjaoiV9mRZkzffFMb5FR6CHez3UfZPPGvZoZnw5V5J1CNdFpuv7Dz6TBjABeB7c1QtfK',
        bitgoKey:
          'xpub661MyMwAqRbcGsSbYgWmr9G1dFgPE8HEb1ASRShbw9S1Mmu1dTQ7QStNwpaYFESq3MeKivGidN8twMeJzqh1veuSP1t2XLENL3mwpatfTst',
        walletPassphrase: TestBitGo.V2.TEST_WALLET1_PASSCODE,
        recoveryDestination: '2NB5Ynem6iNvA6GBLZwRxwid3Kui33729Nw',
        krsProvider: 'keyternal',
        scan: 5,
        ignoreAddressTypes: ['p2wsh', 'p2shP2wsh'],
      });
      await fixtures.shouldEqualJSONFixture(recovery, 'btc-recovery-tx-krs.json');
    });

    it('should fail to generate a recovery tx if the KRS provider does not support the coin', async function () {
      const oldSupportedCoins = config.krsProviders.keyternal.supportedCoins;
      config.krsProviders.keyternal.supportedCoins = [];

      const basecoin = bitgo.coin('tbtc');
      await basecoin
        .recover({
          userKey:
            '{"iv":"fTcRIg7nlCf9fPSR4ID8XQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"pkIS5jVDi0Y=","ct":"SJQgP+ZzfOMf2fWxyQ2jpoWYioq6Tqfcw1xiKS1WpWAxLvXfH059sZvPrrYMdijJEbqA8EEaYXWmdgYSkMXdwckRMyvM3uWl9H8iKw1ZJmHyy2eDSy5r/pCtWICkcO3oi2I492I/3Op2YLfIX6XqKWs2mztu/OY="}',
          backupKey:
            'xpub661MyMwAqRbcF6zkKeAsGULBxDJnagLrtPRByNexjaoiV9mRZkzffFMb5FR6CHez3UfZPPGvZoZnw5V5J1CNdFpuv7Dz6TBjABeB7c1QtfK',
          bitgoKey:
            'xpub661MyMwAqRbcGsSbYgWmr9G1dFgPE8HEb1ASRShbw9S1Mmu1dTQ7QStNwpaYFESq3MeKivGidN8twMeJzqh1veuSP1t2XLENL3mwpatfTst',
          walletPassphrase: TestBitGo.V2.TEST_WALLET1_PASSCODE,
          recoveryDestination: '2NB5Ynem6iNvA6GBLZwRxwid3Kui33729Nw',
          krsProvider: 'keyternal',
          scan: 5,
          ignoreAddressTypes: ['p2wsh', 'p2shP2wsh'],
        })
        .should.be.rejectedWith('specified key recovery service does not support recoveries for this coin');

      config.krsProviders.keyternal.supportedCoins = oldSupportedCoins;
    });

    it('should fail to generate a recovery tx if the fee address is not specified', async function () {
      recoveryNocks.nockCoingecko(10000, 'bitcoin');
      const oldAddress = (config.krsProviders.keyternal.feeAddresses as any).tbtc;
      delete (config.krsProviders.keyternal.feeAddresses as any).tbtc;

      const basecoin = bitgo.coin('tbtc');
      await basecoin
        .recover({
          userKey:
            '{"iv":"fTcRIg7nlCf9fPSR4ID8XQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"pkIS5jVDi0Y=","ct":"SJQgP+ZzfOMf2fWxyQ2jpoWYioq6Tqfcw1xiKS1WpWAxLvXfH059sZvPrrYMdijJEbqA8EEaYXWmdgYSkMXdwckRMyvM3uWl9H8iKw1ZJmHyy2eDSy5r/pCtWICkcO3oi2I492I/3Op2YLfIX6XqKWs2mztu/OY="}',
          backupKey:
            'xpub661MyMwAqRbcF6zkKeAsGULBxDJnagLrtPRByNexjaoiV9mRZkzffFMb5FR6CHez3UfZPPGvZoZnw5V5J1CNdFpuv7Dz6TBjABeB7c1QtfK',
          bitgoKey:
            'xpub661MyMwAqRbcGsSbYgWmr9G1dFgPE8HEb1ASRShbw9S1Mmu1dTQ7QStNwpaYFESq3MeKivGidN8twMeJzqh1veuSP1t2XLENL3mwpatfTst',
          walletPassphrase: TestBitGo.V2.TEST_WALLET1_PASSCODE,
          recoveryDestination: '2NB5Ynem6iNvA6GBLZwRxwid3Kui33729Nw',
          krsProvider: 'keyternal',
          scan: 5,
          ignoreAddressTypes: ['p2wsh', 'p2shP2wsh'],
        })
        .should.be.rejectedWith(
          'this KRS provider has not configured their fee structure yet - recovery cannot be completed'
        );

      (config.krsProviders.keyternal.feeAddresses as any).tbtc = oldAddress;
    });

    it('should not throw if smartbit fails to response to request to verifyreoverytransaction', async function () {
      const basecoin = bitgo.coin('tbtc');
      const recovery = await basecoin.recover({
        userKey:
          '{"iv":"fTcRIg7nlCf9fPSR4ID8XQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"pkIS5jVDi0Y=","ct":"SJQgP+ZzfOMf2fWxyQ2jpoWYioq6Tqfcw1xiKS1WpWAxLvXfH059sZvPrrYMdijJEbqA8EEaYXWmdgYSkMXdwckRMyvM3uWl9H8iKw1ZJmHyy2eDSy5r/pCtWICkcO3oi2I492I/3Op2YLfIX6XqKWs2mztu/OY="}',
        backupKey:
          '{"iv":"0WkLaOsnO3M7qnV2DbSvWw==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"lGxBnvlGAoM=","ct":"cBalT6MGZ3TYIYHt4jys0WDTZEKK9qIubltKEqfW4zXtxYd1dYLz9qLve/yXPl7NF5Cb1lBNGBBGsfqzvpr0Q5824xiy5i9IKzRBI/69HIt3fC2RjJKDfB1EZUjoozi2O5FH4K7L6Ejq7qZhvi8iOd1ULVpBgnE="}',
        bitgoKey:
          'xpub661MyMwAqRbcGsSbYgWmr9G1dFgPE8HEb1ASRShbw9S1Mmu1dTQ7QStNwpaYFESq3MeKivGidN8twMeJzqh1veuSP1t2XLENL3mwpatfTst',
        walletPassphrase: TestBitGo.V2.TEST_WALLET1_PASSCODE,
        recoveryDestination: '2NB5Ynem6iNvA6GBLZwRxwid3Kui33729Nw',
        scan: 5,
        ignoreAddressTypes: ['p2wsh', 'p2shP2wsh'],
      });
      await fixtures.shouldEqualJSONFixture(recovery, 'btc-recovery-smartbit.json');
    });

    it('should allow the provision of an API key while doing recovery', async function () {
      const basecoin = bitgo.coin('tbtc');
      const recovery = await basecoin.recover({
        userKey:
          '{"iv":"fTcRIg7nlCf9fPSR4ID8XQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"pkIS5jVDi0Y=","ct":"SJQgP+ZzfOMf2fWxyQ2jpoWYioq6Tqfcw1xiKS1WpWAxLvXfH059sZvPrrYMdijJEbqA8EEaYXWmdgYSkMXdwckRMyvM3uWl9H8iKw1ZJmHyy2eDSy5r/pCtWICkcO3oi2I492I/3Op2YLfIX6XqKWs2mztu/OY="}',
        backupKey:
          '{"iv":"0WkLaOsnO3M7qnV2DbSvWw==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"lGxBnvlGAoM=","ct":"cBalT6MGZ3TYIYHt4jys0WDTZEKK9qIubltKEqfW4zXtxYd1dYLz9qLve/yXPl7NF5Cb1lBNGBBGsfqzvpr0Q5824xiy5i9IKzRBI/69HIt3fC2RjJKDfB1EZUjoozi2O5FH4K7L6Ejq7qZhvi8iOd1ULVpBgnE="}',
        bitgoKey:
          'xpub661MyMwAqRbcGsSbYgWmr9G1dFgPE8HEb1ASRShbw9S1Mmu1dTQ7QStNwpaYFESq3MeKivGidN8twMeJzqh1veuSP1t2XLENL3mwpatfTst',
        walletPassphrase: TestBitGo.V2.TEST_WALLET1_PASSCODE,
        recoveryDestination: '2NB5Ynem6iNvA6GBLZwRxwid3Kui33729Nw',
        scan: 5,
        ignoreAddressTypes: ['p2wsh', 'p2shP2wsh'],
        apiKey: 'my_______SecretApiKey',
      });
      await fixtures.shouldEqualJSONFixture(recovery, 'btc-recovery-smartbit.json');
    });

    it('should not throw if earn.com (bitcoinfees) fails to response to request to verifyreoverytransaction', async function () {
      nock.removeInterceptor({
        hostname: 'bitcoinfees.earn.com',
        path: '/api/v1/fees/recommended',
        method: 'GET',
        proto: 'https',
      });
      recoveryNocks.nockbitcoinFeesOffline();
      const basecoin = bitgo.coin('tbtc');
      const recovery = await basecoin.recover({
        userKey:
          '{"iv":"fTcRIg7nlCf9fPSR4ID8XQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"pkIS5jVDi0Y=","ct":"SJQgP+ZzfOMf2fWxyQ2jpoWYioq6Tqfcw1xiKS1WpWAxLvXfH059sZvPrrYMdijJEbqA8EEaYXWmdgYSkMXdwckRMyvM3uWl9H8iKw1ZJmHyy2eDSy5r/pCtWICkcO3oi2I492I/3Op2YLfIX6XqKWs2mztu/OY="}',
        backupKey:
          '{"iv":"0WkLaOsnO3M7qnV2DbSvWw==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"lGxBnvlGAoM=","ct":"cBalT6MGZ3TYIYHt4jys0WDTZEKK9qIubltKEqfW4zXtxYd1dYLz9qLve/yXPl7NF5Cb1lBNGBBGsfqzvpr0Q5824xiy5i9IKzRBI/69HIt3fC2RjJKDfB1EZUjoozi2O5FH4K7L6Ejq7qZhvi8iOd1ULVpBgnE="}',
        bitgoKey:
          'xpub661MyMwAqRbcGsSbYgWmr9G1dFgPE8HEb1ASRShbw9S1Mmu1dTQ7QStNwpaYFESq3MeKivGidN8twMeJzqh1veuSP1t2XLENL3mwpatfTst',
        walletPassphrase: TestBitGo.V2.TEST_WALLET1_PASSCODE,
        recoveryDestination: '2NB5Ynem6iNvA6GBLZwRxwid3Kui33729Nw',
        scan: 5,
        ignoreAddressTypes: ['p2wsh', 'p2shP2wsh'],
      });
      await fixtures.shouldEqualJSONFixture(recovery, 'btc-recovery-smartbit.json');
    });
  });

  describe('Recover TBSV', function () {
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
      recoveryNocks.nockbitcoinFees(600, 600, 100);
      const callBack1 = sandbox.stub(BlockchairApi.prototype, 'getAccountInfo');
      callBack1.resolves(emptyAddressInfo);
      callBack1
        .withArgs('2NEXK4AjYnUCkdUDJQgbbEGGks5pjkfhcRN')
        .resolves(addressInfos['2NEXK4AjYnUCkdUDJQgbbEGGks5pjkfhcRN']);
      callBack1
        .withArgs('2N3XcQGSrdZPDwj6z3tu3iaA3msrdzVoPXT')
        .resolves(addressInfos['2N3XcQGSrdZPDwj6z3tu3iaA3msrdzVoPXT']);
      const callBack2 = sandbox.stub(BlockchairApi.prototype, 'getUnspents');
      callBack2
        .withArgs('2N3XcQGSrdZPDwj6z3tu3iaA3msrdzVoPXT')
        .resolves([addressUnspents['2N3XcQGSrdZPDwj6z3tu3iaA3msrdzVoPXT']]);
      callBack2.resolves([]);
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should generate TBSV recovery tx', async function () {
      const basecoin = bitgo.coin('tbsv');
      const recovery = await basecoin.recover({
        userKey:
          '{"iv":"A3HVSDow6/GjbU8ZUlq5GA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"D1V4aD1HVto=","ct":"C5c0uFBH6BuB11ikKnso9zaTpZbdk1I7c3GwVHdoOj2iEMl2jfKq30K0fL3pKueyQ5S412a+kbeDC0/IiZAE2sDIZt4HQQ91ivGE6bRS/PJ9Pv4E2y44plH05YTNPdz9bZhf2NCvSve5+TPS4iZuptOeO2lXE1w="}',
        backupKey:
          '{"iv":"JG0lyUpjHs7k2UVN9ox31w==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
          ':"ccm","adata":"","cipher":"aes","salt":"kEdza1Fy82E=","ct":"54fBDIs7EWVUp1\n' +
          '6slxuM6nQsLJCrwgxXB3lzS6GMbAptVtHSDPURUnZnbRYl0CN9LnNGZEqfl7w4GbCbDeCe2IvyZ\n' +
          'dgeFCVPRYiAL/0VZeC97/pAkP4tuybqho0XELLyrYOgwgGAtoqYs5gqmfexu8R/9wEp2iI="}\n',
        bitgoKey:
          'xpub661MyMwAqRbcFwmW1HYESGP4x6tKWhYCgSK3J9T3y1eaLXkGszcbBSd4h4tM6Nt17JkcZV768RWHYrqjeEpyYabj2gv9XtdNJyww4LnJZVK',
        walletPassphrase: TestBitGo.V2.TEST_RECOVERY_PASSCODE,
        recoveryDestination: '2MztSo6jqjLWcvH4g6QoMChbrWkJ3HHzQua',
        scan: 5,
        ignoreAddressTypes: ['p2wsh', 'p2shP2wsh'],
      });

      await fixtures.shouldEqualJSONFixture(recovery, 'bch-recovery-tx.json');
    });

    it('should generate TBSV recovery tx with KRS', async function () {
      recoveryNocks.nockCoingecko(1000, 'bitcoin-cash');
      const basecoin = bitgo.coin('tbsv');
      const recovery = await basecoin.recover({
        userKey:
          '{"iv":"A3HVSDow6/GjbU8ZUlq5GA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"D1V4aD1HVto=","ct":"C5c0uFBH6BuB11ikKnso9zaTpZbdk1I7c3GwVHdoOj2iEMl2jfKq30K0fL3pKueyQ5S412a+kbeDC0/IiZAE2sDIZt4HQQ91ivGE6bRS/PJ9Pv4E2y44plH05YTNPdz9bZhf2NCvSve5+TPS4iZuptOeO2lXE1w="}',
        backupKey:
          'xpub661MyMwAqRbcGMSGJsrhpqUhvCQqMUvwshCLfPDXrweN15ce8g96WbfdrDbhKKDx9pwKz9yenwexTFx7ofDchmT2zJZW8eshGKWKwrJrkNp',
        bitgoKey:
          'xpub661MyMwAqRbcFwmW1HYESGP4x6tKWhYCgSK3J9T3y1eaLXkGszcbBSd4h4tM6Nt17JkcZV768RWHYrqjeEpyYabj2gv9XtdNJyww4LnJZVK',
        walletPassphrase: TestBitGo.V2.TEST_RECOVERY_PASSCODE,
        krsProvider: 'keyternal',
        recoveryDestination: '2MztSo6jqjLWcvH4g6QoMChbrWkJ3HHzQua',
        scan: 5,
        ignoreAddressTypes: ['p2wsh', 'p2shP2wsh'],
      });

      await fixtures.shouldEqualJSONFixture(recovery, 'bsv-recovery-tx-2.json');
    });
  });

  for (const coinName of ['tbch', 'tbcha']) {
    describe('Recover ' + coinName, function () {
      // Todo (kevin): fix test for other recovery source
      const sandbox = sinon.createSandbox();
      beforeEach(() => {
        recoveryNocks.nockCoingecko(1000, 'bitcoin-cash');
        const callBack1 = sandbox.stub(BlockchairApi.prototype, 'getAccountInfo');
        callBack1.resolves(emptyAddressInfo);
        callBack1
          .withArgs('2NEXK4AjYnUCkdUDJQgbbEGGks5pjkfhcRN')
          .resolves(addressInfos['2NEXK4AjYnUCkdUDJQgbbEGGks5pjkfhcRN']);
        callBack1
          .withArgs('2N3XcQGSrdZPDwj6z3tu3iaA3msrdzVoPXT')
          .resolves(addressInfos['2N3XcQGSrdZPDwj6z3tu3iaA3msrdzVoPXT']);
        const callBack2 = sandbox.stub(BlockchairApi.prototype, 'getUnspents');
        callBack2
          .withArgs('2N3XcQGSrdZPDwj6z3tu3iaA3msrdzVoPXT')
          .resolves([addressUnspents['2N3XcQGSrdZPDwj6z3tu3iaA3msrdzVoPXT']]);
        callBack2.resolves([]);
      });

      afterEach(() => {
        sandbox.restore();
      });

      it(`should generate recovery tx for ${coinName}`, async function () {
        const basecoin = bitgo.coin(coinName);
        const recovery = await basecoin.recover({
          userKey:
            '{"iv":"A3HVSDow6/GjbU8ZUlq5GA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"D1V4aD1HVto=","ct":"C5c0uFBH6BuB11ikKnso9zaTpZbdk1I7c3GwVHdoOj2iEMl2jfKq30K0fL3pKueyQ5S412a+kbeDC0/IiZAE2sDIZt4HQQ91ivGE6bRS/PJ9Pv4E2y44plH05YTNPdz9bZhf2NCvSve5+TPS4iZuptOeO2lXE1w="}',
          backupKey:
            '{"iv":"JG0lyUpjHs7k2UVN9ox31w==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
            ':"ccm","adata":"","cipher":"aes","salt":"kEdza1Fy82E=","ct":"54fBDIs7EWVUp1\n' +
            '6slxuM6nQsLJCrwgxXB3lzS6GMbAptVtHSDPURUnZnbRYl0CN9LnNGZEqfl7w4GbCbDeCe2IvyZ\n' +
            'dgeFCVPRYiAL/0VZeC97/pAkP4tuybqho0XELLyrYOgwgGAtoqYs5gqmfexu8R/9wEp2iI="}\n',
          bitgoKey:
            'xpub661MyMwAqRbcFwmW1HYESGP4x6tKWhYCgSK3J9T3y1eaLXkGszcbBSd4h4tM6Nt17JkcZV768RWHYrqjeEpyYabj2gv9XtdNJyww4LnJZVK',
          walletPassphrase: TestBitGo.V2.TEST_RECOVERY_PASSCODE,
          recoveryDestination: '2MztSo6jqjLWcvH4g6QoMChbrWkJ3HHzQua',
          scan: 5,
          ignoreAddressTypes: ['p2wsh', 'p2shP2wsh'],
          apiKey: 'myKey',
        });

        await fixtures.shouldEqualJSONFixture(recovery, 'bch-recovery-tx.json');
      });

      it(`should generate ${coinName} recovery tx with KRS`, async function () {
        const basecoin = bitgo.coin(coinName);
        const recovery = await basecoin.recover({
          userKey:
            '{"iv":"A3HVSDow6/GjbU8ZUlq5GA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"D1V4aD1HVto=","ct":"C5c0uFBH6BuB11ikKnso9zaTpZbdk1I7c3GwVHdoOj2iEMl2jfKq30K0fL3pKueyQ5S412a+kbeDC0/IiZAE2sDIZt4HQQ91ivGE6bRS/PJ9Pv4E2y44plH05YTNPdz9bZhf2NCvSve5+TPS4iZuptOeO2lXE1w="}',
          backupKey:
            'xpub661MyMwAqRbcGMSGJsrhpqUhvCQqMUvwshCLfPDXrweN15ce8g96WbfdrDbhKKDx9pwKz9yenwexTFx7ofDchmT2zJZW8eshGKWKwrJrkNp',
          bitgoKey:
            'xpub661MyMwAqRbcFwmW1HYESGP4x6tKWhYCgSK3J9T3y1eaLXkGszcbBSd4h4tM6Nt17JkcZV768RWHYrqjeEpyYabj2gv9XtdNJyww4LnJZVK',
          walletPassphrase: TestBitGo.V2.TEST_RECOVERY_PASSCODE,
          krsProvider: 'keyternal',
          recoveryDestination: '2MztSo6jqjLWcvH4g6QoMChbrWkJ3HHzQua',
          scan: 5,
          ignoreAddressTypes: ['p2wsh', 'p2shP2wsh'],
          apiKey: 'myKey',
        });

        await fixtures.shouldEqualJSONFixture(recovery, coinName + '-recovery-tx-nokrs.json');
      });
    });
  }

  describe('Recover TLTC', function () {
    it('should generate TLTC recovery tx', async function () {
      recoveryNocks.nockTltcRecovery(false);

      const basecoin = bitgo.coin('tltc');
      const recovery = await basecoin.recover({
        userKey: `{"iv":"Vvthj0ZaCPywdNWM+s5GmA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"hxZMB31kp34=","ct":"xGpBHnS3k0G6lU/uv9pC1gsdFqksNV6nLBQ18qL9iuWV9sM5JLyZ67wqnMVVoZgNWaI1fq0kSTCPYwGq2FNAS2GmN/JWb/Pl0UPmfVvhraOnzav0vDv0KaJjOT3S1D/omjzx/W3pw5qSwxov+T65Yt6E19YGGjc="}`,
        backupKey: `{"iv":"/GM1AF21E0Ht6ZmgiWpd+g==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"rGsRxlm/pGE=","ct":"cUBV7ELfNEIs0UkDrBjHiRpXvRNCRHLE5dx4X7gprHoTSBKJOJ+5McxHnSLeBvM2vIexSQO9RBzjtC2G1m6hozTOEjWkR0BtTBoi0uw3cXDmmL69pjrABZhLjmCF8znmaF/DCQk/lKQcHEwbImcR/egpq8u9W1A="}`,
        bitgoKey:
          'xpub661MyMwAqRbcFwmymyqkCoY6uaZ8PxbjXKWK2pLS8NUutytumJabLvJyGpXzDJRqXJAf4LoACStGgf1bYv6dkbT6D1MKEyhjYE7VHiw5bFP',
        walletPassphrase: TestBitGo.V2.TEST_RECOVERY_PASSCODE,
        recoveryDestination: 'Qhe8AWhZr1wBNV3iry2uVxnthbawRLhNcF',
        scan: 5,
        ignoreAddressTypes: ['p2wsh', 'p2shP2wsh'],
      });

      await fixtures.shouldEqualJSONFixture(recovery, 'ltc-recovery-nokrs.json');
    });

    it('should generate TLTC recovery tx with KRS', async function () {
      recoveryNocks.nockTltcRecovery(true);

      const basecoin = bitgo.coin('tltc');
      const recovery = await basecoin.recover({
        userKey: `{"iv":"Vvthj0ZaCPywdNWM+s5GmA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"hxZMB31kp34=","ct":"xGpBHnS3k0G6lU/uv9pC1gsdFqksNV6nLBQ18qL9iuWV9sM5JLyZ67wqnMVVoZgNWaI1fq0kSTCPYwGq2FNAS2GmN/JWb/Pl0UPmfVvhraOnzav0vDv0KaJjOT3S1D/omjzx/W3pw5qSwxov+T65Yt6E19YGGjc="}`,
        backupKey: `xpub661MyMwAqRbcEht5QfprPgqQTbvUoRtthmoa57N5kPSqremKhdxBF6CJANnLuxm21oc9Dgf9romMra3J34WjWRKmmWewwvrYNYT53BGARKt`,
        bitgoKey:
          'xpub661MyMwAqRbcFwmymyqkCoY6uaZ8PxbjXKWK2pLS8NUutytumJabLvJyGpXzDJRqXJAf4LoACStGgf1bYv6dkbT6D1MKEyhjYE7VHiw5bFP',
        walletPassphrase: TestBitGo.V2.TEST_RECOVERY_PASSCODE,
        recoveryDestination: 'Qhe8AWhZr1wBNV3iry2uVxnthbawRLhNcF',
        krsProvider: 'keyternal',
        scan: 5,
        ignoreAddressTypes: ['p2wsh', 'p2shP2wsh'],
      });

      await fixtures.shouldEqualJSONFixture(recovery, 'ltc-recovery-krs.json');
    });
  });

  describe('Recover ZCash', function () {
    it('should generate TZEC recovery tx', async function () {
      recoveryNocks.nockTzecRecovery(false);

      const basecoin = bitgo.coin('tzec');

      // Decrypted private key values used to generate test vectors:
      // userKey:  xprv9s21ZrQH143K3bnASnsbxBztKgNJxG1PKpUpvxoNqjk9rjJrG1QAotxv7EekcRK98TrKeB8T47PgpyhJMvvhDvoQ3D6njPVsFpEBiaBW6nY
      // backupKey:  xprv9s21ZrQH143K2rE4L9Pptwk1ce4TxTTRBDfwp3zGyofUcbqKyfLyr1LRuFLKZGiUnZtHwzNSXVuYEEp4bKFCpbhufyRG27sBn4jpUX4yMsn
      // userKeyWIF:  cVi36xVqAzqvmoDoKS8N219beXvf1xBH9yFcQexchiZYvC2ivQ2v
      // backupKeyWIF:  cSKRtYTgwTL2hERx8H4KoiScFdeiYBPPf7TCfwsyryE2HLocy2h3

      // zcash testnet full node commands used with private keys above and UTXO from recovery-nocks.ts to generate test vectors:
      // $ zcash-cli createrawtransaction '[{"txid":"754975f7a113e8fa5ae395a350b93514c2096cae4c16be2dd827d8a451e6890f","vout":0}]' '{"t2GnC5sFN5Km2UuYaYjHNBQRJBDAXVQqSfJ":0.299649}' 0 0
      // $ zcash-cli signrawtransaction 0400008085202f89010f89e651a4d827d82dbe164cae6c09c21435b950a395e35afae813a1f77549750000000000ffffffff01643ac9010000000017a91470391ef30163f580806ee8a5f0aacc724e7f68558700000000000000000000000000000000000000 '[{"txid":"754975f7a113e8fa5ae395a350b93514c2096cae4c16be2dd827d8a451e6890f", "vout":0,"scriptPubKey":"a914b6dfccf23872e01a01d746dbf063730887d4457f87","redeemScript":"52210222dba86781026f53d30be3bd2d07678c61926cb52c0de52b6ecef3d5c96e32fa2102b8a369ca2ef0d202b342fe3742585468813bebf821856fa4c2e90337bcee1d5e2102dcb29b842c2bb5e1efcab6483db61ab06bc08cb8c2667399bb1b5fb826a841a153ae","amount":0.3}]' '["cVi36xVqAzqvmoDoKS8N219beXvf1xBH9yFcQexchiZYvC2ivQ2v","cSKRtYTgwTL2hERx8H4KoiScFdeiYBPPf7TCfwsyryE2HLocy2h3"]'
      const recovery = await basecoin.recover({
        userKey: `{"iv":"in/0+5mRgyBD/NQM+rsKOQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"2zBGPsw0Yc4=","ct":"IqS/KsWCc117zVIu4VID6BB1UBBAOW3zeWiMsL4rm+HXMffHetaOCVwFVeoO1JG/dbcV/ApcqvbHXxNMY7L8FXeeBr3SMnZdpqIkGzfrvcADa9EcjTg+iLDGLRT1FwdavQ7X06DXro0Mx3O+CDnCFaf2vkxIfZ0="}`,
        backupKey: `{"iv":"ZGWK9woJAu020cXwvdfmuQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"6iCPz4FhZ6g=","ct":"8IwFVj2l7L6o6emjMF/G7WIDXeOmjGFoyNgofQwrvnk+ZsckQrKUSVxDzDUeZdJZsZE6fj+ZCVNh1Zfgxxg0rk5rh0bYJJ+WVsizK7jUE4DNJnS5RwBZNNFi9qilHI2bPbzXp+VAyOieSF5nJs9AQSc+rTxda30="}`,
        bitgoKey:
          'xpub661MyMwAqRbcFN1MHGSUPL5v1xREhgtbvoCY5Qkbt3dLXZTdV8Au2SsoQ4Kv5SCSSb6sN9Y3eZZBgvZjf7qGj9zaXmFtEcedfiFKLiBXUBq',
        walletPassphrase: TestBitGo.V2.TEST_RECOVERY_PASSCODE,
        recoveryDestination: 't2GnC5sFN5Km2UuYaYjHNBQRJBDAXVQqSfJ',
        scan: 5,
        ignoreAddressTypes: ['p2wsh', 'p2shP2wsh'],
      });

      await fixtures.shouldEqualJSONFixture(recovery, 'zec-recovery-nokrs.json');
    });

    it('should generate TZEC recovery tx with KRS', async function () {
      recoveryNocks.nockTzecRecovery(true);

      const basecoin = bitgo.coin('tzec');
      const recovery = await basecoin.recover({
        userKey: `{"iv":"in/0+5mRgyBD/NQM+rsKOQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"2zBGPsw0Yc4=","ct":"IqS/KsWCc117zVIu4VID6BB1UBBAOW3zeWiMsL4rm+HXMffHetaOCVwFVeoO1JG/dbcV/ApcqvbHXxNMY7L8FXeeBr3SMnZdpqIkGzfrvcADa9EcjTg+iLDGLRT1FwdavQ7X06DXro0Mx3O+CDnCFaf2vkxIfZ0="}`,
        backupKey: `xpub661MyMwAqRbcFLJXSAvqG5gkAftxMvBGYSbYcSPtY9CTVQAUXCfEPoeukWAPKYz24iNmy4iazs73A2PsHLqahK37f5pfdR2b3FBLAz3ATBM`,
        bitgoKey:
          'xpub661MyMwAqRbcFN1MHGSUPL5v1xREhgtbvoCY5Qkbt3dLXZTdV8Au2SsoQ4Kv5SCSSb6sN9Y3eZZBgvZjf7qGj9zaXmFtEcedfiFKLiBXUBq',
        walletPassphrase: TestBitGo.V2.TEST_RECOVERY_PASSCODE,
        recoveryDestination: 't2GnC5sFN5Km2UuYaYjHNBQRJBDAXVQqSfJ',
        krsProvider: 'keyternal',
        scan: 5,
        ignoreAddressTypes: ['p2wsh', 'p2shP2wsh'],
      });

      // zcash testnet full node commands used with private keys above and UTXO from recovery-nocks.ts to generate test vectors:
      // $ zcash-cli createrawtransaction '[{"txid":"754975f7a113e8fa5ae395a350b93514c2096cae4c16be2dd827d8a451e6890f","vout":0}]' '{"t2GnC5sFN5Km2UuYaYjHNBQRJBDAXVQqSfJ":0.200606, "t2ATLAhBP1uTuyiWs5DY5CPH1VuYkGUindt":0.099}' 0 0
      // $ zcash-cli signrawtransaction 0400008085202f89010f89e651a4d827d82dbe164cae6c09c21435b950a395e35afae813a1f77549750000000000ffffffff02b81932010000000017a91470391ef30163f580806ee8a5f0aacc724e7f685587e00f97000000000017a9142ad735dfc86e2835100b9dc6476facddad6c87ec8700000000000000000000000000000000000000 '[{"txid":"754975f7a113e8fa5ae395a350b93514c2096cae4c16be2dd827d8a451e6890f", "vout":0,"scriptPubKey":"a914b6dfccf23872e01a01d746dbf063730887d4457f87","redeemScript":"52210222dba86781026f53d30be3bd2d07678c61926cb52c0de52b6ecef3d5c96e32fa2102b8a369ca2ef0d202b342fe3742585468813bebf821856fa4c2e90337bcee1d5e2102dcb29b842c2bb5e1efcab6483db61ab06bc08cb8c2667399bb1b5fb826a841a153ae","amount":0.3}]' '["cVi36xVqAzqvmoDoKS8N219beXvf1xBH9yFcQexchiZYvC2ivQ2v"]'

      await fixtures.shouldEqualJSONFixture(recovery, 'recovery-zcash-krs.json');
    });
  });

  describe('Recover TDASH', function () {
    it('should generate TDASH recovery tx', async function () {
      recoveryNocks.nockTdashRecovery(false);

      const basecoin = bitgo.coin('tdash');
      const recovery = await basecoin.recover({
        userKey: `{"iv":"tZz3ZGLkffG0/eCX0xAHLg==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"KU3deEQZIzU=","ct":"AOs7uOnCTDwmQI72zmA0CI8c3VjcBUXheSAPPnxOHbz5QQbh/WDUGdX/IoyXcjO4EUreDERjGWIz21lu41ENk0h6pe7eELu1p777qZ/g4o9EAl0XsmjAH+b3fW3YQhdBmhYFboriv2wHSjwly9I4NGtdbEKabZY="}`,
        backupKey: `{"iv":"/Vz19EjCHc93h+53cPp+yA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"Mm0Y+nv31Jo=","ct":"3AdTtdM92iVgRICDkNSfE45UbF2BjBncmRy6ytnc3TnEDb25ZjeqZ1yP8VxXsHNszj86GccueUe0VbUwLxrGYC+wWoznGJggFBwVJJzeN00njTVKEaYk2KJCzkVaaMwXADktgxiymfjBaYBKVj0qwUZg2996vZI="}`,
        bitgoKey:
          'xpub661MyMwAqRbcGb1Jkx9U8iJfengAni3Ks3udjpiURVgxbQBcYGJjqBDVcrPPU7a96RFut6tsX4AKkQa2DJv3Ti3LtukGcjjYbFVTXVDT8QC',
        walletPassphrase: TestBitGo.V2.TEST_RECOVERY_PASSCODE,
        recoveryDestination: '8hh6nS2vpKCnebjoWcKJF7ebyEt4yNnEzW',
        scan: 3,
        ignoreAddressTypes: ['p2wsh', 'p2shP2wsh'],
      });

      await fixtures.shouldEqualJSONFixture(recovery, 'recovery-tdash-nokrs.json');
    });

    it('should generate TDASH recovery tx with KRS', async function () {
      recoveryNocks.nockTdashRecovery(true);

      const basecoin = bitgo.coin('tdash');
      const recovery = await basecoin.recover({
        userKey: `{"iv":"tZz3ZGLkffG0/eCX0xAHLg==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"KU3deEQZIzU=","ct":"AOs7uOnCTDwmQI72zmA0CI8c3VjcBUXheSAPPnxOHbz5QQbh/WDUGdX/IoyXcjO4EUreDERjGWIz21lu41ENk0h6pe7eELu1p777qZ/g4o9EAl0XsmjAH+b3fW3YQhdBmhYFboriv2wHSjwly9I4NGtdbEKabZY="}`,
        backupKey: `xpub661MyMwAqRbcFvZZLVBGTPBZf6CN2imxDEZcQHMSjUPatWi5RhkmGNBiHUrLuLYDnt16aThj9ZQQ9oBTjvAaJB4BSGm9F3rHBaRbWJ75iay`,
        bitgoKey:
          'xpub661MyMwAqRbcGb1Jkx9U8iJfengAni3Ks3udjpiURVgxbQBcYGJjqBDVcrPPU7a96RFut6tsX4AKkQa2DJv3Ti3LtukGcjjYbFVTXVDT8QC',
        walletPassphrase: TestBitGo.V2.TEST_RECOVERY_PASSCODE,
        krsProvider: 'keyternal',
        recoveryDestination: '8hh6nS2vpKCnebjoWcKJF7ebyEt4yNnEzW',
        scan: 3,
        ignoreAddressTypes: ['p2wsh', 'p2shP2wsh'],
      });

      await fixtures.shouldEqualJSONFixture(recovery, 'recovery-tdash.json');
    });
  });
});
