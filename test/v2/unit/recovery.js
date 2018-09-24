//
// Tests for Wallets
//

const should = require('should');
const Promise = require('bluebird');
const co = Promise.coroutine;
const nock = require('nock');

const TestV2BitGo = require('../../lib/test_bitgo');
const recoveryNocks = require('../lib/recovery-nocks');
const config = require('../../../src/config');

nock.disableNetConnect();

describe('Recovery:', function() {
  let bitgo;

  before(function() {
    bitgo = new TestV2BitGo({ env: 'test' });
    bitgo.initializeTestVars();

    // pretend that Keyternal accepts recoveries for all coins
    config.krsProviders.keyternal.supportedCoins = ['btc', 'eth', 'xrp', 'bch', 'ltc', 'zec', 'dash', 'xlm'];
    config.krsProviders.keyternal.feeAddresses = {
      tbtc: '2Mujz9eicmgpPcdScRJTywVK3EQNHDJG3yN',
      tbch: '2Mujz9eicmgpPcdScRJTywVK3EQNHDJG3yN',
      tltc: 'QffXMViM8DYgPRf1Hoczjw7BS5CVdSWaBL',
      tzec: 't2ATLAhBP1uTuyiWs5DY5CPH1VuYkGUindt',
      tdash: '8euHug4dbmPy3CLawwWdeTjGLqPYEGz3Kt'
    };
  });

  after(function() {
    nock.cleanAll();
  });

  describe('Recover Bitcoin', function() {
    it('should generate BTC recovery tx', co(function *() {
      recoveryNocks.nockBtcRecovery(false);

      const basecoin = bitgo.coin('tbtc');
      const recovery = yield basecoin.recover({
        userKey: '{"iv":"fTcRIg7nlCf9fPSR4ID8XQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"pkIS5jVDi0Y=","ct":"SJQgP+ZzfOMf2fWxyQ2jpoWYioq6Tqfcw1xiKS1WpWAxLvXfH059sZvPrrYMdijJEbqA8EEaYXWmdgYSkMXdwckRMyvM3uWl9H8iKw1ZJmHyy2eDSy5r/pCtWICkcO3oi2I492I/3Op2YLfIX6XqKWs2mztu/OY="}',
        backupKey: '{"iv":"0WkLaOsnO3M7qnV2DbSvWw==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"lGxBnvlGAoM=","ct":"cBalT6MGZ3TYIYHt4jys0WDTZEKK9qIubltKEqfW4zXtxYd1dYLz9qLve/yXPl7NF5Cb1lBNGBBGsfqzvpr0Q5824xiy5i9IKzRBI/69HIt3fC2RjJKDfB1EZUjoozi2O5FH4K7L6Ejq7qZhvi8iOd1ULVpBgnE="}',
        bitgoKey: 'xpub661MyMwAqRbcGsSbYgWmr9G1dFgPE8HEb1ASRShbw9S1Mmu1dTQ7QStNwpaYFESq3MeKivGidN8twMeJzqh1veuSP1t2XLENL3mwpatfTst',
        walletPassphrase: TestV2BitGo.V2.TEST_WALLET1_PASSCODE,
        recoveryDestination: '2NB5Ynem6iNvA6GBLZwRxwid3Kui33729Nw',
        scan: 5
      });

      recovery.transactionHex.should.equal('010000000174eda73749d65473a8197bac5c26660c66d60cc77a751298ef74931a478382e100000000fb0046304302202f51d7ad8d2feea3194ab0238297fae860e87fe02b789858ce92fb374629faf0021f48011d587171984e95524c3ecdfe9bae8ebe4c8a282881b416da8f713751e9014730440220673b1a059e2d851059dd7f1b0501af4bf6d205c81249f49828e7ae987f4a90c5022047f73ff3d4e17ce6ebfe9565351796851d2a4472223acecd7ee00e2729824f38014c69522102f5ca5d074093abf996278d1e82b64497333254c786e9a69d34909a785aa9af32210239125d1a21ba8ae375cd37a92e48700cbb3bc1b1268d3c3f7e1d95f42155e1a821031ab00568ea1522a55f277699110649f3b8d08022494af2cc475c09e8a43b3a3a53aeffffffff0178757b000000000017a914c39dcc27823a8bd42cd3318a1dac8c25789b7ac78700000000');
      recovery.tx.TxId.should.equal('a37acbc58d367b717909e69b25a95e06a4daf4e164825e555dd29797a92d7495');
      recovery.tx.Vin.length.should.equal(1);
      recovery.tx.Vout.length.should.equal(1);
      recovery.tx.Vin[0].TxId.should.equal('e18283471a9374ef9812757ac70cd6660c66265cac7b19a87354d64937a7ed74');
      recovery.tx.Vin[0].Sequence.should.equal('4294967295');
      recovery.tx.Vin[0].ScriptSig.Asm.should.equal('0 304302202f51d7ad8d2feea3194ab0238297fae860e87fe02b789858ce92fb374629faf0021f48011d587171984e95524c3ecdfe9bae8ebe4c8a282881b416da8f713751e9[ALL] 30440220673b1a059e2d851059dd7f1b0501af4bf6d205c81249f49828e7ae987f4a90c5022047f73ff3d4e17ce6ebfe9565351796851d2a4472223acecd7ee00e2729824f38[ALL] 522102f5ca5d074093abf996278d1e82b64497333254c786e9a69d34909a785aa9af32210239125d1a21ba8ae375cd37a92e48700cbb3bc1b1268d3c3f7e1d95f42155e1a821031ab00568ea1522a55f277699110649f3b8d08022494af2cc475c09e8a43b3a3a53ae');
      recovery.tx.Vin[0].ScriptSig.Hex.should.equal('0046304302202f51d7ad8d2feea3194ab0238297fae860e87fe02b789858ce92fb374629faf0021f48011d587171984e95524c3ecdfe9bae8ebe4c8a282881b416da8f713751e9014730440220673b1a059e2d851059dd7f1b0501af4bf6d205c81249f49828e7ae987f4a90c5022047f73ff3d4e17ce6ebfe9565351796851d2a4472223acecd7ee00e2729824f38014c69522102f5ca5d074093abf996278d1e82b64497333254c786e9a69d34909a785aa9af32210239125d1a21ba8ae375cd37a92e48700cbb3bc1b1268d3c3f7e1d95f42155e1a821031ab00568ea1522a55f277699110649f3b8d08022494af2cc475c09e8a43b3a3a53ae');
      recovery.tx.Vout[0].N.should.equal(0);
      recovery.tx.Vout[0].Value.should.equal(0.08091);
      recovery.tx.Vout[0].ScriptPubKey.Asm.should.equal('OP_HASH160 c39dcc27823a8bd42cd3318a1dac8c25789b7ac7 OP_EQUAL');
      recovery.tx.Vout[0].ScriptPubKey.Hex.should.equal('a914c39dcc27823a8bd42cd3318a1dac8c25789b7ac787');
      recovery.tx.Vout[0].ScriptPubKey.Type.should.equal('scripthash');
      recovery.tx.Vout[0].ScriptPubKey.ReqSigs.should.equal(1);
      recovery.tx.Vout[0].ScriptPubKey.Addresses.length.should.equal(1);
      recovery.tx.Vout[0].ScriptPubKey.Addresses[0].should.equal('2NB5Ynem6iNvA6GBLZwRxwid3Kui33729Nw');
    }));

    it('should generate BTC recovery tx with unencrypted keys', co(function *() {
      recoveryNocks.nockBtcRecovery(false);

      const basecoin = bitgo.coin('tbtc');
      const recovery = yield basecoin.recover({
        userKey: 'xprv9s21ZrQH143K44auQTYjyFpU8aGEpbsbcU5yGjbwfyKpbBpvHPhUHEu3QR6G74rLPyM9ucop7oyXtKYDrjNkU8YeSryQbKU476ijp2qWcBm',
        backupKey: 'xprv9s21ZrQH143K2cvHDcdruLPTQBUJBDd1XAVbAzFMBFGjcMSH2DgR7T37Dy6YwcRwkh24UkXQKcFAhmkb6g9PXJNqPvfDBAe1eaUK2kJ9stv',
        bitgoKey: 'xpub661MyMwAqRbcGsSbYgWmr9G1dFgPE8HEb1ASRShbw9S1Mmu1dTQ7QStNwpaYFESq3MeKivGidN8twMeJzqh1veuSP1t2XLENL3mwpatfTst',
        recoveryDestination: '2NB5Ynem6iNvA6GBLZwRxwid3Kui33729Nw',
        scan: 5
      });

      recovery.transactionHex.should.equal('010000000174eda73749d65473a8197bac5c26660c66d60cc77a751298ef74931a478382e100000000fb0046304302202f51d7ad8d2feea3194ab0238297fae860e87fe02b789858ce92fb374629faf0021f48011d587171984e95524c3ecdfe9bae8ebe4c8a282881b416da8f713751e9014730440220673b1a059e2d851059dd7f1b0501af4bf6d205c81249f49828e7ae987f4a90c5022047f73ff3d4e17ce6ebfe9565351796851d2a4472223acecd7ee00e2729824f38014c69522102f5ca5d074093abf996278d1e82b64497333254c786e9a69d34909a785aa9af32210239125d1a21ba8ae375cd37a92e48700cbb3bc1b1268d3c3f7e1d95f42155e1a821031ab00568ea1522a55f277699110649f3b8d08022494af2cc475c09e8a43b3a3a53aeffffffff0178757b000000000017a914c39dcc27823a8bd42cd3318a1dac8c25789b7ac78700000000');
      recovery.tx.TxId.should.equal('a37acbc58d367b717909e69b25a95e06a4daf4e164825e555dd29797a92d7495');
      recovery.tx.Vin.length.should.equal(1);
      recovery.tx.Vout.length.should.equal(1);
      recovery.tx.Vin[0].TxId.should.equal('e18283471a9374ef9812757ac70cd6660c66265cac7b19a87354d64937a7ed74');
      recovery.tx.Vin[0].Sequence.should.equal('4294967295');
      recovery.tx.Vin[0].ScriptSig.Asm.should.equal('0 304302202f51d7ad8d2feea3194ab0238297fae860e87fe02b789858ce92fb374629faf0021f48011d587171984e95524c3ecdfe9bae8ebe4c8a282881b416da8f713751e9[ALL] 30440220673b1a059e2d851059dd7f1b0501af4bf6d205c81249f49828e7ae987f4a90c5022047f73ff3d4e17ce6ebfe9565351796851d2a4472223acecd7ee00e2729824f38[ALL] 522102f5ca5d074093abf996278d1e82b64497333254c786e9a69d34909a785aa9af32210239125d1a21ba8ae375cd37a92e48700cbb3bc1b1268d3c3f7e1d95f42155e1a821031ab00568ea1522a55f277699110649f3b8d08022494af2cc475c09e8a43b3a3a53ae');
      recovery.tx.Vin[0].ScriptSig.Hex.should.equal('0046304302202f51d7ad8d2feea3194ab0238297fae860e87fe02b789858ce92fb374629faf0021f48011d587171984e95524c3ecdfe9bae8ebe4c8a282881b416da8f713751e9014730440220673b1a059e2d851059dd7f1b0501af4bf6d205c81249f49828e7ae987f4a90c5022047f73ff3d4e17ce6ebfe9565351796851d2a4472223acecd7ee00e2729824f38014c69522102f5ca5d074093abf996278d1e82b64497333254c786e9a69d34909a785aa9af32210239125d1a21ba8ae375cd37a92e48700cbb3bc1b1268d3c3f7e1d95f42155e1a821031ab00568ea1522a55f277699110649f3b8d08022494af2cc475c09e8a43b3a3a53ae');
      recovery.tx.Vout[0].N.should.equal(0);
      recovery.tx.Vout[0].Value.should.equal(0.08091);
      recovery.tx.Vout[0].ScriptPubKey.Asm.should.equal('OP_HASH160 c39dcc27823a8bd42cd3318a1dac8c25789b7ac7 OP_EQUAL');
      recovery.tx.Vout[0].ScriptPubKey.Hex.should.equal('a914c39dcc27823a8bd42cd3318a1dac8c25789b7ac787');
      recovery.tx.Vout[0].ScriptPubKey.Type.should.equal('scripthash');
      recovery.tx.Vout[0].ScriptPubKey.ReqSigs.should.equal(1);
      recovery.tx.Vout[0].ScriptPubKey.Addresses.length.should.equal(1);
      recovery.tx.Vout[0].ScriptPubKey.Addresses[0].should.equal('2NB5Ynem6iNvA6GBLZwRxwid3Kui33729Nw');
    }));

    it('should generate BTC recovery tx with KRS', co(function *() {
      recoveryNocks.nockBtcRecovery(true);

      const basecoin = bitgo.coin('tbtc');
      const recovery = yield basecoin.recover({
        userKey: '{"iv":"fTcRIg7nlCf9fPSR4ID8XQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"pkIS5jVDi0Y=","ct":"SJQgP+ZzfOMf2fWxyQ2jpoWYioq6Tqfcw1xiKS1WpWAxLvXfH059sZvPrrYMdijJEbqA8EEaYXWmdgYSkMXdwckRMyvM3uWl9H8iKw1ZJmHyy2eDSy5r/pCtWICkcO3oi2I492I/3Op2YLfIX6XqKWs2mztu/OY="}',
        backupKey: 'xpub661MyMwAqRbcF6zkKeAsGULBxDJnagLrtPRByNexjaoiV9mRZkzffFMb5FR6CHez3UfZPPGvZoZnw5V5J1CNdFpuv7Dz6TBjABeB7c1QtfK',
        bitgoKey: 'xpub661MyMwAqRbcGsSbYgWmr9G1dFgPE8HEb1ASRShbw9S1Mmu1dTQ7QStNwpaYFESq3MeKivGidN8twMeJzqh1veuSP1t2XLENL3mwpatfTst',
        walletPassphrase: TestV2BitGo.V2.TEST_WALLET1_PASSCODE,
        recoveryDestination: '2NB5Ynem6iNvA6GBLZwRxwid3Kui33729Nw',
        krsProvider: 'keyternal',
        scan: 5
      });

      recovery.transactionHex.should.equal('010000000174eda73749d65473a8197bac5c26660c66d60cc77a751298ef74931a478382e100000000b40047304402201e998e77860b1dc62fac80f60b1db62d14abd7bdbff29767718c024413b908380220200cdf49e76a8d41e60d8ef646e88c26352717fe759083322de5516865d50b65014c69522102f5ca5d074093abf996278d1e82b64497333254c786e9a69d34909a785aa9af32210239125d1a21ba8ae375cd37a92e48700cbb3bc1b1268d3c3f7e1d95f42155e1a821031ab00568ea1522a55f277699110649f3b8d08022494af2cc475c09e8a43b3a3a53aeffffffff02004d6c000000000017a914c39dcc27823a8bd42cd3318a1dac8c25789b7ac787301b0f000000000017a9141b60c33def13c3eda4cf4835e11a633e4b3302ec8700000000');
      recovery.tx.TxId.should.equal('c2ec2e0f50fea4b231e0b66a4716d64f5792a3834c3b13065f5fd43c62651afb');
      recovery.tx.Vin.length.should.equal(1);
      recovery.tx.Vout.length.should.equal(2);
      recovery.tx.Vin[0].TxId.should.equal('e18283471a9374ef9812757ac70cd6660c66265cac7b19a87354d64937a7ed74');
      recovery.tx.Vin[0].Sequence.should.equal('4294967295');
      recovery.tx.Vin[0].ScriptSig.Asm.should.equal('0 304402201e998e77860b1dc62fac80f60b1db62d14abd7bdbff29767718c024413b908380220200cdf49e76a8d41e60d8ef646e88c26352717fe759083322de5516865d50b65[ALL] 522102f5ca5d074093abf996278d1e82b64497333254c786e9a69d34909a785aa9af32210239125d1a21ba8ae375cd37a92e48700cbb3bc1b1268d3c3f7e1d95f42155e1a821031ab00568ea1522a55f277699110649f3b8d08022494af2cc475c09e8a43b3a3a53ae');
      recovery.tx.Vin[0].ScriptSig.Hex.should.equal('0047304402201e998e77860b1dc62fac80f60b1db62d14abd7bdbff29767718c024413b908380220200cdf49e76a8d41e60d8ef646e88c26352717fe759083322de5516865d50b65014c69522102f5ca5d074093abf996278d1e82b64497333254c786e9a69d34909a785aa9af32210239125d1a21ba8ae375cd37a92e48700cbb3bc1b1268d3c3f7e1d95f42155e1a821031ab00568ea1522a55f277699110649f3b8d08022494af2cc475c09e8a43b3a3a53ae');
      recovery.tx.Vout[0].N.should.equal(0);
      recovery.tx.Vout[0].Value.should.equal(0.070976);
      recovery.tx.Vout[0].ScriptPubKey.Asm.should.equal('OP_HASH160 c39dcc27823a8bd42cd3318a1dac8c25789b7ac7 OP_EQUAL');
      recovery.tx.Vout[0].ScriptPubKey.Hex.should.equal('a914c39dcc27823a8bd42cd3318a1dac8c25789b7ac787');
      recovery.tx.Vout[0].ScriptPubKey.Type.should.equal('scripthash');
      recovery.tx.Vout[0].ScriptPubKey.ReqSigs.should.equal(1);
      recovery.tx.Vout[0].ScriptPubKey.Addresses.length.should.equal(1);
      recovery.tx.Vout[0].ScriptPubKey.Addresses[0].should.equal('2NB5Ynem6iNvA6GBLZwRxwid3Kui33729Nw');
      recovery.tx.Vout[1].N.should.equal(1);
      recovery.tx.Vout[1].Value.should.equal(0.0099);
      recovery.tx.Vout[1].ScriptPubKey.Asm.should.equal('OP_HASH160 1b60c33def13c3eda4cf4835e11a633e4b3302ec OP_EQUAL');
      recovery.tx.Vout[1].ScriptPubKey.Hex.should.equal('a9141b60c33def13c3eda4cf4835e11a633e4b3302ec87');
      recovery.tx.Vout[1].ScriptPubKey.Type.should.equal('scripthash');
      recovery.tx.Vout[1].ScriptPubKey.ReqSigs.should.equal(1);
      recovery.tx.Vout[1].ScriptPubKey.Addresses.length.should.equal(1);
      recovery.tx.Vout[1].ScriptPubKey.Addresses[0].should.equal('2Mujz9eicmgpPcdScRJTywVK3EQNHDJG3yN');
    }));

    it('should fail to generate a recovery tx if the KRS provider does not support the coin', co(function *() {
      recoveryNocks.nockBtcRecovery(true);

      const oldSupportedCoins = config.krsProviders.keyternal.supportedCoins;
      config.krsProviders.keyternal.supportedCoins = [];

      const basecoin = bitgo.coin('tbtc');
      const error = yield bitgo.getAsyncError(basecoin.recover({
        userKey: '{"iv":"fTcRIg7nlCf9fPSR4ID8XQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"pkIS5jVDi0Y=","ct":"SJQgP+ZzfOMf2fWxyQ2jpoWYioq6Tqfcw1xiKS1WpWAxLvXfH059sZvPrrYMdijJEbqA8EEaYXWmdgYSkMXdwckRMyvM3uWl9H8iKw1ZJmHyy2eDSy5r/pCtWICkcO3oi2I492I/3Op2YLfIX6XqKWs2mztu/OY="}',
        backupKey: 'xpub661MyMwAqRbcF6zkKeAsGULBxDJnagLrtPRByNexjaoiV9mRZkzffFMb5FR6CHez3UfZPPGvZoZnw5V5J1CNdFpuv7Dz6TBjABeB7c1QtfK',
        bitgoKey: 'xpub661MyMwAqRbcGsSbYgWmr9G1dFgPE8HEb1ASRShbw9S1Mmu1dTQ7QStNwpaYFESq3MeKivGidN8twMeJzqh1veuSP1t2XLENL3mwpatfTst',
        walletPassphrase: TestV2BitGo.V2.TEST_WALLET1_PASSCODE,
        recoveryDestination: '2NB5Ynem6iNvA6GBLZwRxwid3Kui33729Nw',
        krsProvider: 'keyternal',
        scan: 5
      }));

      should.exist(error);
      error.message.should.equal('specified key recovery service does not support recoveries for this coin');

      config.krsProviders.keyternal.supportedCoins = oldSupportedCoins;
    }));

    it('should fail to generate a recovery tx if the fee address is not specified', co(function *() {
      recoveryNocks.nockBtcRecovery(true);

      const oldAddress = config.krsProviders.keyternal.feeAddresses.tbtc;
      delete config.krsProviders.keyternal.feeAddresses.tbtc;

      const basecoin = bitgo.coin('tbtc');
      const error = yield bitgo.getAsyncError(basecoin.recover({
        userKey: '{"iv":"fTcRIg7nlCf9fPSR4ID8XQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"pkIS5jVDi0Y=","ct":"SJQgP+ZzfOMf2fWxyQ2jpoWYioq6Tqfcw1xiKS1WpWAxLvXfH059sZvPrrYMdijJEbqA8EEaYXWmdgYSkMXdwckRMyvM3uWl9H8iKw1ZJmHyy2eDSy5r/pCtWICkcO3oi2I492I/3Op2YLfIX6XqKWs2mztu/OY="}',
        backupKey: 'xpub661MyMwAqRbcF6zkKeAsGULBxDJnagLrtPRByNexjaoiV9mRZkzffFMb5FR6CHez3UfZPPGvZoZnw5V5J1CNdFpuv7Dz6TBjABeB7c1QtfK',
        bitgoKey: 'xpub661MyMwAqRbcGsSbYgWmr9G1dFgPE8HEb1ASRShbw9S1Mmu1dTQ7QStNwpaYFESq3MeKivGidN8twMeJzqh1veuSP1t2XLENL3mwpatfTst',
        walletPassphrase: TestV2BitGo.V2.TEST_WALLET1_PASSCODE,
        recoveryDestination: '2NB5Ynem6iNvA6GBLZwRxwid3Kui33729Nw',
        krsProvider: 'keyternal',
        scan: 5
      }));

      should.exist(error);
      error.message.should.equal('this KRS provider has not configured their fee structure yet - recovery cannot be completed');

      config.krsProviders.keyternal.feeAddresses.tbtc = oldAddress;
    }));
  });

  describe('Recover Bitcoin Cash', function() {
    // Todo (kevin): fix test for other recovery source
    it('should generate BCH recovery tx', co(function *() {
      recoveryNocks.nockBchRecovery(false);

      const basecoin = bitgo.coin('tbch');
      const recovery = yield basecoin.recover({
        userKey: '{"iv":"A3HVSDow6/GjbU8ZUlq5GA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"D1V4aD1HVto=","ct":"C5c0uFBH6BuB11ikKnso9zaTpZbdk1I7c3GwVHdoOj2iEMl2jfKq30K0fL3pKueyQ5S412a+kbeDC0/IiZAE2sDIZt4HQQ91ivGE6bRS/PJ9Pv4E2y44plH05YTNPdz9bZhf2NCvSve5+TPS4iZuptOeO2lXE1w="}',
        backupKey: '{"iv":"JG0lyUpjHs7k2UVN9ox31w==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
        ':"ccm","adata":"","cipher":"aes","salt":"kEdza1Fy82E=","ct":"54fBDIs7EWVUp1\n' +
        '6slxuM6nQsLJCrwgxXB3lzS6GMbAptVtHSDPURUnZnbRYl0CN9LnNGZEqfl7w4GbCbDeCe2IvyZ\n' +
        'dgeFCVPRYiAL/0VZeC97/pAkP4tuybqho0XELLyrYOgwgGAtoqYs5gqmfexu8R/9wEp2iI="}\n',
        bitgoKey: 'xpub661MyMwAqRbcFwmW1HYESGP4x6tKWhYCgSK3J9T3y1eaLXkGszcbBSd4h4tM6Nt17JkcZV768RWHYrqjeEpyYabj2gv9XtdNJyww4LnJZVK',
        walletPassphrase: TestV2BitGo.V2.TEST_RECOVERY_PASSCODE,
        recoveryDestination: '2MztSo6jqjLWcvH4g6QoMChbrWkJ3HHzQua',
        scan: 5
      });

      should.exist(recovery);
      recovery.transactionHex.should.equal('02000000015a3319949e2a3741bbb062f63543f4327db3ce47d26eb3adb4bcdc31fbe8a6df00000000fc00473044022017489d9aca2e99b84815ccea2ee036c6265b7621d23887e9603d507295cf26f402207b9d33926af1e960ca585773af5d2b14ba523e348737442f2bd203304203f8cc414730440220468a892964d8a892702b156b1f986d9a837e96eadb0f8f43657c9758c300093b02207ac672794471b7eb99be421e7023bd8a0150ff52549cea0e58f44fc8e6d61811414c69522103b11db31fb294b8757cf6849631dc6b23e56db0ed4e55d14edf3a8cb8c0eebff42103129bdad9e9a954d2b8c4a375b020b012b634a3641c5f3a0404af4ce99fd23c9521023015ea25115d67e49424248552491cf6b5e47eddb387fad1d652811e02cd53f453aeffffffff0146f185470000000017a91453d2f642f1e40f888ba0ef57c359983ccfd40f908700000000');
      recovery.should.have.property('inputs');
      recovery.inputs.length.should.equal(1);
      recovery.inputs[0].should.have.property('chainPath');
      recovery.inputs[0].chainPath.should.equal('/0/0/1/1');
      recovery.inputs[0].should.have.property('redeemScript');
      recovery.inputs[0].redeemScript.should.equal('522103b11db31fb294b8757cf6849631dc6b23e56db0ed4e55d14edf3a8cb8c0eebff42103129bdad9e9a954d2b8c4a375b020b012b634a3641c5f3a0404af4ce99fd23c9521023015ea25115d67e49424248552491cf6b5e47eddb387fad1d652811e02cd53f453ae');
    }));

    it('should generate BCH recovery tx with KRS', co(function *() {
      recoveryNocks.nockBchRecovery(true);

      const basecoin = bitgo.coin('tbch');
      const recovery = yield basecoin.recover({
        userKey: '{"iv":"A3HVSDow6/GjbU8ZUlq5GA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"D1V4aD1HVto=","ct":"C5c0uFBH6BuB11ikKnso9zaTpZbdk1I7c3GwVHdoOj2iEMl2jfKq30K0fL3pKueyQ5S412a+kbeDC0/IiZAE2sDIZt4HQQ91ivGE6bRS/PJ9Pv4E2y44plH05YTNPdz9bZhf2NCvSve5+TPS4iZuptOeO2lXE1w="}',
        backupKey: 'xpub661MyMwAqRbcGMSGJsrhpqUhvCQqMUvwshCLfPDXrweN15ce8g96WbfdrDbhKKDx9pwKz9yenwexTFx7ofDchmT2zJZW8eshGKWKwrJrkNp',
        bitgoKey: 'xpub661MyMwAqRbcFwmW1HYESGP4x6tKWhYCgSK3J9T3y1eaLXkGszcbBSd4h4tM6Nt17JkcZV768RWHYrqjeEpyYabj2gv9XtdNJyww4LnJZVK',
        walletPassphrase: TestV2BitGo.V2.TEST_RECOVERY_PASSCODE,
        krsProvider: 'keyternal',
        recoveryDestination: '2MztSo6jqjLWcvH4g6QoMChbrWkJ3HHzQua',
        scan: 5
      });

      should.exist(recovery);
      recovery.transactionHex.should.equal('02000000015a3319949e2a3741bbb062f63543f4327db3ce47d26eb3adb4bcdc31fbe8a6df00000000b40047304402201e5097a4adb20ed8c880c159786db085876e4b1098af7e96bc9eb26108eabc850220315b11b4185bf6891d985d0179f30034ae1417ef4c3f4c955143a1b1d5992466414c69522103b11db31fb294b8757cf6849631dc6b23e56db0ed4e55d14edf3a8cb8c0eebff42103129bdad9e9a954d2b8c4a375b020b012b634a3641c5f3a0404af4ce99fd23c9521023015ea25115d67e49424248552491cf6b5e47eddb387fad1d652811e02cd53f453aeffffffff021ed4ee460000000017a91453d2f642f1e40f888ba0ef57c359983ccfd40f9087e00f97000000000017a9141b60c33def13c3eda4cf4835e11a633e4b3302ec8700000000');
      recovery.should.have.property('inputs');
      recovery.inputs.length.should.equal(1);
      recovery.inputs[0].should.have.property('chainPath');
      recovery.inputs[0].chainPath.should.equal('/0/0/1/1');
      recovery.inputs[0].should.have.property('redeemScript');
      recovery.inputs[0].redeemScript.should.equal('522103b11db31fb294b8757cf6849631dc6b23e56db0ed4e55d14edf3a8cb8c0eebff42103129bdad9e9a954d2b8c4a375b020b012b634a3641c5f3a0404af4ce99fd23c9521023015ea25115d67e49424248552491cf6b5e47eddb387fad1d652811e02cd53f453ae');
    }));
  });

  describe('Recover Ripple', function() {
    it('should generate XRP recovery tx', function() {
      recoveryNocks.nockXrpRecovery();

      const basecoin = bitgo.coin('txrp');
      return basecoin.recover({
        userKey: '{"iv":"rU++mEtIHtbp3d4jg5EulA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"ip1rb59uYnM=","ct":"ssmP9abPoVyXkW4Io0SUy+AAS8lr+wgIerTMw+lDYnkUh0sjlI4A6Fpve0q1riQ3Dy/J0bNu7dgoZkO4xs/X6dzwEwlmPhk3pEQ7Yd4CXa1zA01y0Geu900FLe4LdaS8jt6fixui2tTd4Vi3JYglF1/HmCjG1Ug="}',
        backupKey: '{"iv":"uB/BTcn1rXmgYGfncXOowg==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"I3WrumxkuMQ=","ct":"sgyDNAzNsBruTRm0d04oBTBf8lheHNKS+dRgl8FeMEhodKsiyjtRVHG0CHPf5rV3g5ixVnZ+iwsSCv3PKyyeoy7RGnT0AG9YYpi0me+OvP8331iO+n5quzstrGbV1j8uEh5IMW78S+YUZKSx6zbbdZ0xNu8D5WM="}',
        rootAddress: 'raGZWRkRBUWdQJsKYEzwXJNbCZMTqX56aA',
        walletPassphrase: TestV2BitGo.V2.TEST_WALLET1_PASSCODE,
        recoveryDestination: 'rsv2kremJSSFbbaLqrf8fWxxN5QnsynNm2?dt=12345'
      })
      .then(function(recovery) {
        recovery.txHex.should.equal('120000228000000024000000042E00003039201B0015519161400000024E06C0C068400000000000001E7300811439CA010E0E0198150F8DDD5768CCD2B095701D8C8314201276ADC469C4F10D1369E0F5C5A7DEF37B2267F3E0107321026C91974146427889C801BD26CE31CE0E10307A69DFE4139DE45E5E35933A6B037446304402204AA3D2F344729B0BB9075C4AEA07EBB2EAF6D3F36309BCAEF10B2C9734AC943E022032D55EC19E27B2E90E3D9444FD26CC06FD47BB3E3D85B0FCC0CC4DE7038563FD8114ABB5B7C843F3AA8D8EFACC3C5A7D9B0484C17442E1E010732102F4E376133012F5404990C7E1DF83A9F943B30D55F0D856632C8E8378FCEB70D2744630440220568F1D49F5810458E7204A1D2D23B86B694505327E8410A215AB9C9324EA8A3102207A93211ACFB5E9C1441B701A7954B72A3054265BA3FD61965D709E4C4E9080F38114ACEF9F0A2FCEC44A9A213444A9E6C57E2D02856AE1F1');
        recovery.id.should.equal('F2005B392E9454FF1E8217B816C87866A56770382B8FCAC0AAE2FA8D12A53B98');
        recovery.outputAmount.should.equal('9899000000');
        recovery.outputs.length.should.equal(1);
        recovery.outputs[0].address.should.equal('rsv2kremJSSFbbaLqrf8fWxxN5QnsynNm2?dt=12345');
        recovery.outputs[0].amount.should.equal('9899000000');
        recovery.fee.fee.should.equal('30');
      });

    });

    it('should generate XRP recovery tx with KRS', function() {
      recoveryNocks.nockXrpRecovery();

      const basecoin = bitgo.coin('txrp');
      return basecoin.recover({
        userKey: '{"iv":"rU++mEtIHtbp3d4jg5EulA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"ip1rb59uYnM=","ct":"ssmP9abPoVyXkW4Io0SUy+AAS8lr+wgIerTMw+lDYnkUh0sjlI4A6Fpve0q1riQ3Dy/J0bNu7dgoZkO4xs/X6dzwEwlmPhk3pEQ7Yd4CXa1zA01y0Geu900FLe4LdaS8jt6fixui2tTd4Vi3JYglF1/HmCjG1Ug="}',
        backupKey: 'xpub661MyMwAqRbcFtWdmWHKZEh9pYiJrAGTu1NNSwxY2S63tU9nGcfCAbNUKQuFqXRTRk8KkuBabxo6YjeBri8Q7dkMsmths6MVxSd6MTaeCmd',
        rootAddress: 'raGZWRkRBUWdQJsKYEzwXJNbCZMTqX56aA',
        walletPassphrase: TestV2BitGo.V2.TEST_WALLET1_PASSCODE,
        krsProvider: 'keyternal',
        recoveryDestination: 'rsv2kremJSSFbbaLqrf8fWxxN5QnsynNm2?dt=12345'
      })
      .then(function(recovery) {
        recovery.txHex.should.equal('120000228000000024000000042E00003039201B0015519161400000024E06C0C068400000000000001E7300811439CA010E0E0198150F8DDD5768CCD2B095701D8C8314201276ADC469C4F10D1369E0F5C5A7DEF37B2267F3E010732102F4E376133012F5404990C7E1DF83A9F943B30D55F0D856632C8E8378FCEB70D2744630440220568F1D49F5810458E7204A1D2D23B86B694505327E8410A215AB9C9324EA8A3102207A93211ACFB5E9C1441B701A7954B72A3054265BA3FD61965D709E4C4E9080F38114ACEF9F0A2FCEC44A9A213444A9E6C57E2D02856AE1F1');
        recovery.id.should.equal('6EA1728B0CC0C047E54AAF578D81822EDE1107908B979868299657E74A8E18C0');
        recovery.outputAmount.should.equal('9899000000');
        recovery.outputs.length.should.equal(1);
        recovery.outputs[0].address.should.equal('rsv2kremJSSFbbaLqrf8fWxxN5QnsynNm2?dt=12345');
        recovery.outputs[0].amount.should.equal('9899000000');
        recovery.fee.fee.should.equal('30');
      });
    });
  });

  describe('Recover Litecoin', function() {
    // Todo (kevin): fix test for other recovery source
    it('should generate LTC recovery tx', co(function *() {
      recoveryNocks.nockLtcRecovery(false);

      const basecoin = bitgo.coin('tltc');
      const recovery = yield basecoin.recover({
        userKey: `{"iv":"Vvthj0ZaCPywdNWM+s5GmA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"hxZMB31kp34=","ct":"xGpBHnS3k0G6lU/uv9pC1gsdFqksNV6nLBQ18qL9iuWV9sM5JLyZ67wqnMVVoZgNWaI1fq0kSTCPYwGq2FNAS2GmN/JWb/Pl0UPmfVvhraOnzav0vDv0KaJjOT3S1D/omjzx/W3pw5qSwxov+T65Yt6E19YGGjc="}`,
        backupKey: `{"iv":"/GM1AF21E0Ht6ZmgiWpd+g==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"rGsRxlm/pGE=","ct":"cUBV7ELfNEIs0UkDrBjHiRpXvRNCRHLE5dx4X7gprHoTSBKJOJ+5McxHnSLeBvM2vIexSQO9RBzjtC2G1m6hozTOEjWkR0BtTBoi0uw3cXDmmL69pjrABZhLjmCF8znmaF/DCQk/lKQcHEwbImcR/egpq8u9W1A="}`,
        bitgoKey: 'xpub661MyMwAqRbcFwmymyqkCoY6uaZ8PxbjXKWK2pLS8NUutytumJabLvJyGpXzDJRqXJAf4LoACStGgf1bYv6dkbT6D1MKEyhjYE7VHiw5bFP',
        walletPassphrase: TestV2BitGo.V2.TEST_RECOVERY_PASSCODE,
        recoveryDestination: 'Qhe8AWhZr1wBNV3iry2uVxnthbawRLhNcF',
        scan: 5
      });

      recovery.transactionHex.should.equal('0100000001ffe4ac6dd97fbe9d4526a122c039d9c93ac5d595b1b8d1e0cf23df1b3caecfbc00000000fc0047304402207c87fa565629d0d5bdf1cd4a34c54c90b3ff3a5c50c481ce41cad7709cc9d8d20220774791a635c79d344ccae60b448463ab10e88704405bae47f8c6ffe0eba6ffe80147304402205ebfc4377598dea11a3b50fe7b9e2b3bdb54869407cf651f8f119115738e4e7902201bf86eae5eb417d8355bdc5a5e3f3f306e569475660707e1380395366751600c014c6952210353bcad5447cbed8af7a7e4b010412b1fcc748e7efd225047729bfc452735c10c2103e6f65db8d3718b8a851f0ea64c9bf776cbc9e089f03b12210c7360cadb980031210246cdc4f2c735ccbf5952eded3734a2179104f136a5ed9ec8a1bea50fcaa45d4e53aeffffffff01b03ec9010000000017a914e6c2329cb2f901f30b9606cf839ee09cfce8414e8700000000');
      recovery.should.have.property('inputs');
      recovery.inputs.length.should.equal(1);
      recovery.inputs[0].should.have.property('chainPath');
      recovery.inputs[0].chainPath.should.equal('/0/0/0/0');
      recovery.inputs[0].should.have.property('redeemScript');
      recovery.inputs[0].redeemScript.should.equal('52210353bcad5447cbed8af7a7e4b010412b1fcc748e7efd225047729bfc452735c10c2103e6f65db8d3718b8a851f0ea64c9bf776cbc9e089f03b12210c7360cadb980031210246cdc4f2c735ccbf5952eded3734a2179104f136a5ed9ec8a1bea50fcaa45d4e53ae');
    }));

    it('should generate LTC recovery tx with KRS', co(function *() {
      recoveryNocks.nockLtcRecovery(true);

      const basecoin = bitgo.coin('tltc');
      const recovery = yield basecoin.recover({
        userKey: `{"iv":"Vvthj0ZaCPywdNWM+s5GmA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"hxZMB31kp34=","ct":"xGpBHnS3k0G6lU/uv9pC1gsdFqksNV6nLBQ18qL9iuWV9sM5JLyZ67wqnMVVoZgNWaI1fq0kSTCPYwGq2FNAS2GmN/JWb/Pl0UPmfVvhraOnzav0vDv0KaJjOT3S1D/omjzx/W3pw5qSwxov+T65Yt6E19YGGjc="}`,
        backupKey: `xpub661MyMwAqRbcEht5QfprPgqQTbvUoRtthmoa57N5kPSqremKhdxBF6CJANnLuxm21oc9Dgf9romMra3J34WjWRKmmWewwvrYNYT53BGARKt`,
        bitgoKey: 'xpub661MyMwAqRbcFwmymyqkCoY6uaZ8PxbjXKWK2pLS8NUutytumJabLvJyGpXzDJRqXJAf4LoACStGgf1bYv6dkbT6D1MKEyhjYE7VHiw5bFP',
        walletPassphrase: TestV2BitGo.V2.TEST_RECOVERY_PASSCODE,
        recoveryDestination: 'Qhe8AWhZr1wBNV3iry2uVxnthbawRLhNcF',
        krsProvider: 'keyternal',
        scan: 5
      });

      recovery.transactionHex.should.equal('0100000001ffe4ac6dd97fbe9d4526a122c039d9c93ac5d595b1b8d1e0cf23df1b3caecfbc00000000b4004730440220735cb8b3597cdfecf0292007f4861986a86ee5baf8ab6682f563425b1011f4d302205c8544f9c60ed9d7872dc45f9a94afa3b3e567280284cae73a1338ee4e7bd8db014c6952210353bcad5447cbed8af7a7e4b010412b1fcc748e7efd225047729bfc452735c10c2103e6f65db8d3718b8a851f0ea64c9bf776cbc9e089f03b12210c7360cadb980031210246cdc4f2c735ccbf5952eded3734a2179104f136a5ed9ec8a1bea50fcaa45d4e53aeffffffff02882132010000000017a914e6c2329cb2f901f30b9606cf839ee09cfce8414e87e00f97000000000017a914d115b837da7f1563069a3925daf4b243bdd3cb238700000000');
      recovery.should.have.property('inputs');
      recovery.inputs.length.should.equal(1);
      recovery.inputs[0].should.have.property('chainPath');
      recovery.inputs[0].chainPath.should.equal('/0/0/0/0');
      recovery.inputs[0].should.have.property('redeemScript');
      recovery.inputs[0].redeemScript.should.equal('52210353bcad5447cbed8af7a7e4b010412b1fcc748e7efd225047729bfc452735c10c2103e6f65db8d3718b8a851f0ea64c9bf776cbc9e089f03b12210c7360cadb980031210246cdc4f2c735ccbf5952eded3734a2179104f136a5ed9ec8a1bea50fcaa45d4e53ae');
    }));
  });

  describe('Recover ZCash', function() {
    it('should generate ZEC recovery tx', co(function *() {
      recoveryNocks.nockZecRecovery();

      const basecoin = bitgo.coin('tzec');
      const recovery = yield basecoin.recover({
        userKey: `{"iv":"in/0+5mRgyBD/NQM+rsKOQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"2zBGPsw0Yc4=","ct":"IqS/KsWCc117zVIu4VID6BB1UBBAOW3zeWiMsL4rm+HXMffHetaOCVwFVeoO1JG/dbcV/ApcqvbHXxNMY7L8FXeeBr3SMnZdpqIkGzfrvcADa9EcjTg+iLDGLRT1FwdavQ7X06DXro0Mx3O+CDnCFaf2vkxIfZ0="}`,
        backupKey: `{"iv":"ZGWK9woJAu020cXwvdfmuQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"6iCPz4FhZ6g=","ct":"8IwFVj2l7L6o6emjMF/G7WIDXeOmjGFoyNgofQwrvnk+ZsckQrKUSVxDzDUeZdJZsZE6fj+ZCVNh1Zfgxxg0rk5rh0bYJJ+WVsizK7jUE4DNJnS5RwBZNNFi9qilHI2bPbzXp+VAyOieSF5nJs9AQSc+rTxda30="}`,
        bitgoKey: 'xpub661MyMwAqRbcFN1MHGSUPL5v1xREhgtbvoCY5Qkbt3dLXZTdV8Au2SsoQ4Kv5SCSSb6sN9Y3eZZBgvZjf7qGj9zaXmFtEcedfiFKLiBXUBq',
        walletPassphrase: TestV2BitGo.V2.TEST_RECOVERY_PASSCODE,
        recoveryDestination: 't2GnC5sFN5Km2UuYaYjHNBQRJBDAXVQqSfJ',
        scan: 5
      });

      recovery.transactionHex.should.equal('0400008085202f89010f89e651a4d827d82dbe164cae6c09c21435b950a395e35afae813a1f775497500000000fc00473044022051814041484343dc52fa435be57a892a9084be2672801ae319328149ad96618e022029d36c49865b9df3b4c5820aec7ed44ba5ad787bca997d42313197c62b43473e01473044022027c7c2f527c2f5e3794e2e51611611e5f4b341e1736b0fde660cb4425ba9220702202f4e5ae7047bb2615680fa92ff29397d51a3da8acc3dc2f930899c613c8d33fe014c6952210222dba86781026f53d30be3bd2d07678c61926cb52c0de52b6ecef3d5c96e32fa2102b8a369ca2ef0d202b342fe3742585468813bebf821856fa4c2e90337bcee1d5e2102dcb29b842c2bb5e1efcab6483db61ab06bc08cb8c2667399bb1b5fb826a841a153aeffffffff01b03ec9010000000017a91470391ef30163f580806ee8a5f0aacc724e7f68558700000000000000000000000000000000000000');
      recovery.should.have.property('inputs');
      recovery.inputs.length.should.equal(1);
      recovery.inputs[0].should.have.property('chainPath');
      recovery.inputs[0].chainPath.should.equal('/0/0/0/0');
      recovery.inputs[0].should.have.property('redeemScript');
      recovery.inputs[0].redeemScript.should.equal('52210222dba86781026f53d30be3bd2d07678c61926cb52c0de52b6ecef3d5c96e32fa2102b8a369ca2ef0d202b342fe3742585468813bebf821856fa4c2e90337bcee1d5e2102dcb29b842c2bb5e1efcab6483db61ab06bc08cb8c2667399bb1b5fb826a841a153ae');
    }));

    it('should generate ZEC recovery tx with KRS', co(function *() {
      recoveryNocks.nockZecRecovery(true);

      const basecoin = bitgo.coin('tzec');
      const recovery = yield basecoin.recover({
        userKey: `{"iv":"in/0+5mRgyBD/NQM+rsKOQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"2zBGPsw0Yc4=","ct":"IqS/KsWCc117zVIu4VID6BB1UBBAOW3zeWiMsL4rm+HXMffHetaOCVwFVeoO1JG/dbcV/ApcqvbHXxNMY7L8FXeeBr3SMnZdpqIkGzfrvcADa9EcjTg+iLDGLRT1FwdavQ7X06DXro0Mx3O+CDnCFaf2vkxIfZ0="}`,
        backupKey: `xpub661MyMwAqRbcFLJXSAvqG5gkAftxMvBGYSbYcSPtY9CTVQAUXCfEPoeukWAPKYz24iNmy4iazs73A2PsHLqahK37f5pfdR2b3FBLAz3ATBM`,
        bitgoKey: 'xpub661MyMwAqRbcFN1MHGSUPL5v1xREhgtbvoCY5Qkbt3dLXZTdV8Au2SsoQ4Kv5SCSSb6sN9Y3eZZBgvZjf7qGj9zaXmFtEcedfiFKLiBXUBq',
        walletPassphrase: TestV2BitGo.V2.TEST_RECOVERY_PASSCODE,
        recoveryDestination: 't2GnC5sFN5Km2UuYaYjHNBQRJBDAXVQqSfJ',
        krsProvider: 'keyternal',
        scan: 5
      });

      recovery.transactionHex.should.equal('0400008085202f89010f89e651a4d827d82dbe164cae6c09c21435b950a395e35afae813a1f775497500000000b500483045022100e4d64617ed56e178384ca219d7839882cff305803fc934845e832345777bda3802205983abea1d0da7ead06e178010fce086ea77f1fbb81d7a0842fc7ef2163d009b014c6952210222dba86781026f53d30be3bd2d07678c61926cb52c0de52b6ecef3d5c96e32fa2102b8a369ca2ef0d202b342fe3742585468813bebf821856fa4c2e90337bcee1d5e2102dcb29b842c2bb5e1efcab6483db61ab06bc08cb8c2667399bb1b5fb826a841a153aeffffffff02882132010000000017a91470391ef30163f580806ee8a5f0aacc724e7f685587e00f97000000000017a9142ad735dfc86e2835100b9dc6476facddad6c87ec8700000000000000000000000000000000000000');
      recovery.should.have.property('inputs');
      recovery.inputs.length.should.equal(1);
      recovery.inputs[0].should.have.property('chainPath');
      recovery.inputs[0].chainPath.should.equal('/0/0/0/0');
      recovery.inputs[0].should.have.property('redeemScript');
      recovery.inputs[0].redeemScript.should.equal('52210222dba86781026f53d30be3bd2d07678c61926cb52c0de52b6ecef3d5c96e32fa2102b8a369ca2ef0d202b342fe3742585468813bebf821856fa4c2e90337bcee1d5e2102dcb29b842c2bb5e1efcab6483db61ab06bc08cb8c2667399bb1b5fb826a841a153ae');
    }));
  });

  describe('Recover Dash', function() {
    it('should generate DASH recovery tx', co(function *() {
      recoveryNocks.nockDashRecovery(false);

      const basecoin = bitgo.coin('tdash');
      const recovery = yield basecoin.recover({
        userKey: `{"iv":"tZz3ZGLkffG0/eCX0xAHLg==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"KU3deEQZIzU=","ct":"AOs7uOnCTDwmQI72zmA0CI8c3VjcBUXheSAPPnxOHbz5QQbh/WDUGdX/IoyXcjO4EUreDERjGWIz21lu41ENk0h6pe7eELu1p777qZ/g4o9EAl0XsmjAH+b3fW3YQhdBmhYFboriv2wHSjwly9I4NGtdbEKabZY="}`,
        backupKey: `{"iv":"/Vz19EjCHc93h+53cPp+yA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"Mm0Y+nv31Jo=","ct":"3AdTtdM92iVgRICDkNSfE45UbF2BjBncmRy6ytnc3TnEDb25ZjeqZ1yP8VxXsHNszj86GccueUe0VbUwLxrGYC+wWoznGJggFBwVJJzeN00njTVKEaYk2KJCzkVaaMwXADktgxiymfjBaYBKVj0qwUZg2996vZI="}`,
        bitgoKey: 'xpub661MyMwAqRbcGb1Jkx9U8iJfengAni3Ks3udjpiURVgxbQBcYGJjqBDVcrPPU7a96RFut6tsX4AKkQa2DJv3Ti3LtukGcjjYbFVTXVDT8QC',
        walletPassphrase: TestV2BitGo.V2.TEST_RECOVERY_PASSCODE,
        recoveryDestination: '8hh6nS2vpKCnebjoWcKJF7ebyEt4yNnEzW',
        scan: 3
      });

      recovery.transactionHex.should.equal('0100000001edda677a92037140f01cacc1ac0e22391adb9bf4dbce1c4c218822128ac6fd5301000000fc0047304402204a6e7373fa43494d78f3013ea4a0ea0f73a002d48cc29bfe8816b696280c2b08022056a5ad97886b5add39bca9135d445f36c99928b3c83bb0fc613c2a4a00feb93401473044022048de910b7a969ed2729fd9b628377cfdd1d2aa93036694a21bc39271b2f5e30a0220460b9a53ad4166738403bf60628ee4336f7ac984ac2ae1dce1398b30e30226a3014c69522103944ef399da9b45f26407dc3d7abd3544ef6fe6c32236bd6fe39f0db339f267a1210281941b32001f6fd10140e7a8f9a8df881f28d96f172528143e275d96c951a0422103a8ad848ac08c1fc598a91cb0786d6b663084ed3e399072de7c15c397629f2c6f53aeffffffff01b01198000000000017a91423dd90d164d5dfd07ba41814142a5bff0ad5446f8700000000');
      recovery.should.have.property('inputs');
      recovery.inputs.length.should.equal(1);
      recovery.inputs[0].should.have.property('chainPath');
      recovery.inputs[0].chainPath.should.equal('/0/0/0/0');
      recovery.inputs[0].should.have.property('redeemScript');
      recovery.inputs[0].redeemScript.should.equal('522103944ef399da9b45f26407dc3d7abd3544ef6fe6c32236bd6fe39f0db339f267a1210281941b32001f6fd10140e7a8f9a8df881f28d96f172528143e275d96c951a0422103a8ad848ac08c1fc598a91cb0786d6b663084ed3e399072de7c15c397629f2c6f53ae');
    }));

    it('should generate DASH recovery tx with KRS', co(function *() {
      recoveryNocks.nockDashRecovery(true);

      const basecoin = bitgo.coin('tdash');
      const recovery = yield basecoin.recover({
        userKey: `{"iv":"tZz3ZGLkffG0/eCX0xAHLg==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"KU3deEQZIzU=","ct":"AOs7uOnCTDwmQI72zmA0CI8c3VjcBUXheSAPPnxOHbz5QQbh/WDUGdX/IoyXcjO4EUreDERjGWIz21lu41ENk0h6pe7eELu1p777qZ/g4o9EAl0XsmjAH+b3fW3YQhdBmhYFboriv2wHSjwly9I4NGtdbEKabZY="}`,
        backupKey: `xpub661MyMwAqRbcFvZZLVBGTPBZf6CN2imxDEZcQHMSjUPatWi5RhkmGNBiHUrLuLYDnt16aThj9ZQQ9oBTjvAaJB4BSGm9F3rHBaRbWJ75iay`,
        bitgoKey: 'xpub661MyMwAqRbcGb1Jkx9U8iJfengAni3Ks3udjpiURVgxbQBcYGJjqBDVcrPPU7a96RFut6tsX4AKkQa2DJv3Ti3LtukGcjjYbFVTXVDT8QC',
        walletPassphrase: TestV2BitGo.V2.TEST_RECOVERY_PASSCODE,
        krsProvider: 'keyternal',
        recoveryDestination: '8hh6nS2vpKCnebjoWcKJF7ebyEt4yNnEzW',
        scan: 3
      });

      recovery.transactionHex.should.equal('0100000001edda677a92037140f01cacc1ac0e22391adb9bf4dbce1c4c218822128ac6fd5301000000b500483045022100c70ade07a526cdfdf29e0c16bd02ef38005695e2b140b937dbe2578253bee90402206611a571593272630a05406d653d5dc6950152665f24a0ac19fb006c2db33f8c014c69522103944ef399da9b45f26407dc3d7abd3544ef6fe6c32236bd6fe39f0db339f267a1210281941b32001f6fd10140e7a8f9a8df881f28d96f172528143e275d96c951a0422103a8ad848ac08c1fc598a91cb0786d6b663084ed3e399072de7c15c397629f2c6f53aeffffffff0288f400000000000017a91423dd90d164d5dfd07ba41814142a5bff0ad5446f87e00f97000000000017a91405437769516c39063ef0c4ed50cd323495cc913d8700000000');
      recovery.should.have.property('inputs');
      recovery.inputs.length.should.equal(1);
      recovery.inputs[0].should.have.property('chainPath');
      recovery.inputs[0].chainPath.should.equal('/0/0/0/0');
      recovery.inputs[0].should.have.property('redeemScript');
      recovery.inputs[0].redeemScript.should.equal('522103944ef399da9b45f26407dc3d7abd3544ef6fe6c32236bd6fe39f0db339f267a1210281941b32001f6fd10140e7a8f9a8df881f28d96f172528143e275d96c951a0422103a8ad848ac08c1fc598a91cb0786d6b663084ed3e399072de7c15c397629f2c6f53ae');
      recovery.coin.should.equal('tdash');
      recovery.backupKey.should.equal('xpub661MyMwAqRbcFvZZLVBGTPBZf6CN2imxDEZcQHMSjUPatWi5RhkmGNBiHUrLuLYDnt16aThj9ZQQ9oBTjvAaJB4BSGm9F3rHBaRbWJ75iay');
      recovery.recoveryAmount.should.equal(62600);
    }));
  });

  describe('Recover Stellar', function() {
    it('should generate XLM recovery tx', co(function *() {
      recoveryNocks.nockXlmRecovery();

      const basecoin = bitgo.coin('txlm');
      const recovery = yield basecoin.recover({
        userKey: `{"iv":"PiLveA+5AFPURwaU7iijBQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"KlJc8NSKHpw=","ct":"YcdNOFpzXgDnRqjlR3W9R+5eztysyhpCTuRBHsnPyPDst9nvL+GeSORbLY9xVThTdyV6llRgfUr5O7y4l9s9Fg=="}`,
        backupKey: `{"iv":"TmiAIHr0vCX6g2BKkc6/7g==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"wOkMJEm5B6U=","ct":"HJPS56/FuMieiH6K2s5k5jFp8RPHQqZa9qi8hDkjOqNUFjD4XKq8Sy3BDhpwzozTBW6EmQGSF0kpc7eZ9CucKw=="}`,
        rootAddress: 'GAUAGTL3NBZ7NP3UIMZCVJYM6O2NKUP6XRTK4E5VZDVIQX3CBYIVMDIB',
        walletPassphrase: TestV2BitGo.V2.TEST_RECOVERY_PASSCODE,
        recoveryDestination: 'GASW277S2ZOE7H7A5EQ5H5AKLP6UA6Z5AKOSWV6ARBEGTSIGMZMC7AIZ'
      });

      recovery.should.have.property('tx');
      recovery.tx.should.equal('AAAAACgDTXtoc/a/dEMyKqcM87TVUf68Zq4TtcjqiF9iDhFWAAAAZACoLvwAAAACAAAAAAAAAAAAAAABAAAAAAAAAAEAAAAAJW1/8tZcT5/g6SHT9Apb/UB7PQKdK1fAiEhpyQZmWC8AAAAAAAAAAAR4ZswAAAAAAAAAAutRLrcAAABAa1RDEZI9aRYXLd5N7Pvf2Sk0szE9GeZEbQFarXwGpDU++o60M6NrG3ZPrAWrvqvG4C5CUoqh1vvfwiQRvIQ4DX+tfcMAAABATa4B08rJdylJF1YneVUVNj7Mz7BEJCj7h7SvE/F5PptRF1zxAQ97Acj0NypTCLXL8ibZPgRelPvHnMpbf07bDg==');
      recovery.should.have.property('recoveryAmount');
      recovery.recoveryAmount.should.equal(74999500);
    }));

    it('should generate XLM recovery tx with unencrypted keys', co(function *() {
      recoveryNocks.nockXlmRecovery();

      const basecoin = bitgo.coin('txlm');
      const recovery = yield basecoin.recover({
        userKey: `SAMF5XS7O5BL4OOTB625DELCVNW5JMHF2DDM7NSIVPNQQEKPKLBQFNJ3`,
        backupKey: `SCXZ7UFVSIFIYJVPLWEAY22TZJOR4L2Z4HE6BMZGZHBBJ4UAABTFMK3V`,
        rootAddress: 'GAUAGTL3NBZ7NP3UIMZCVJYM6O2NKUP6XRTK4E5VZDVIQX3CBYIVMDIB',
        recoveryDestination: 'GASW277S2ZOE7H7A5EQ5H5AKLP6UA6Z5AKOSWV6ARBEGTSIGMZMC7AIZ'
      });

      recovery.should.have.property('tx');
      recovery.tx.should.equal('AAAAACgDTXtoc/a/dEMyKqcM87TVUf68Zq4TtcjqiF9iDhFWAAAAZACoLvwAAAACAAAAAAAAAAAAAAABAAAAAAAAAAEAAAAAJW1/8tZcT5/g6SHT9Apb/UB7PQKdK1fAiEhpyQZmWC8AAAAAAAAAAAR4ZswAAAAAAAAAAutRLrcAAABAa1RDEZI9aRYXLd5N7Pvf2Sk0szE9GeZEbQFarXwGpDU++o60M6NrG3ZPrAWrvqvG4C5CUoqh1vvfwiQRvIQ4DX+tfcMAAABATa4B08rJdylJF1YneVUVNj7Mz7BEJCj7h7SvE/F5PptRF1zxAQ97Acj0NypTCLXL8ibZPgRelPvHnMpbf07bDg==');
      recovery.should.have.property('recoveryAmount');
      recovery.recoveryAmount.should.equal(74999500);
    }));

    it('should generate XLM recovery tx with KRS', co(function *() {
      recoveryNocks.nockXlmRecovery();

      const basecoin = bitgo.coin('txlm');
      const recovery = yield basecoin.recover({
        userKey: `{"iv":"PiLveA+5AFPURwaU7iijBQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"KlJc8NSKHpw=","ct":"YcdNOFpzXgDnRqjlR3W9R+5eztysyhpCTuRBHsnPyPDst9nvL+GeSORbLY9xVThTdyV6llRgfUr5O7y4l9s9Fg=="}`,
        backupKey: 'GCBABJPE3UTZ3JPUEIZEXAQQ5CMNX5UPYKOB7HHXSHBCIGD7VV64H6KU',
        rootAddress: 'GAUAGTL3NBZ7NP3UIMZCVJYM6O2NKUP6XRTK4E5VZDVIQX3CBYIVMDIB',
        walletPassphrase: TestV2BitGo.V2.TEST_RECOVERY_PASSCODE,
        recoveryDestination: 'GASW277S2ZOE7H7A5EQ5H5AKLP6UA6Z5AKOSWV6ARBEGTSIGMZMC7AIZ',
        krsProvider: 'keyternal'
      });

      recovery.should.have.property('tx');
      recovery.tx.should.equal('AAAAACgDTXtoc/a/dEMyKqcM87TVUf68Zq4TtcjqiF9iDhFWAAAAZACoLvwAAAACAAAAAAAAAAAAAAABAAAAAAAAAAEAAAAAJW1/8tZcT5/g6SHT9Apb/UB7PQKdK1fAiEhpyQZmWC8AAAAAAAAAAAR4ZswAAAAAAAAAAetRLrcAAABAa1RDEZI9aRYXLd5N7Pvf2Sk0szE9GeZEbQFarXwGpDU++o60M6NrG3ZPrAWrvqvG4C5CUoqh1vvfwiQRvIQ4DQ==');
      recovery.should.have.property('recoveryAmount');
      recovery.recoveryAmount.should.equal(74999500);
    }));
  });

  describe('Recover ERC20', function() {
    it('should successfully construct a recovery transaction for tokens stuck in a wallet', co(function *() {
      const wallet = bitgo.nockEthWallet();

      // There should be 24 Potatokens stuck in our test wallet (based on nock)
      const tx = yield wallet.recoverToken({
        tokenContractAddress: TestV2BitGo.V2.TEST_ERC20_TOKEN_ADDRESS,
        recipient: TestV2BitGo.V2.TEST_ERC20_TOKEN_RECIPIENT,
        walletPassphrase: TestV2BitGo.V2.TEST_ETH_WALLET_PASSPHRASE
      });

      should.exist(tx);
      tx.should.have.property('halfSigned');

      const txInfo = tx.halfSigned;
      txInfo.should.have.property('contractSequenceId');
      txInfo.contractSequenceId.should.equal(1101);
      txInfo.should.have.property('expireTime');
      txInfo.should.have.property('gasLimit');
      txInfo.gasLimit.should.equal(500000);
      txInfo.should.have.property('gasPrice');
      txInfo.gasPrice.should.equal(20000000000);
      txInfo.should.have.property('operationHash');
      txInfo.should.have.property('signature');
      txInfo.should.have.property('tokenContractAddress');
      txInfo.tokenContractAddress.should.equal(TestV2BitGo.V2.TEST_ERC20_TOKEN_ADDRESS);
      txInfo.should.have.property('walletId');
      txInfo.walletId.should.equal(TestV2BitGo.V2.TEST_ETH_WALLET_ID);
      txInfo.should.have.property('recipient');
      txInfo.recipient.should.have.property('address');
      txInfo.recipient.address.should.equal(TestV2BitGo.V2.TEST_ERC20_TOKEN_RECIPIENT);
      txInfo.recipient.should.have.property('amount');
      txInfo.recipient.amount.should.equal('2400');
    }));
  });

  describe('Wrong Chain Recoveries', function() {
    before(function() {
      recoveryNocks.nockWrongChainRecoveries();
    });

    it('should recover BTC sent to the wrong chain', co(function *() {
      const recovery = yield bitgo.coin('tbtc').recoverFromWrongChain({
        coin: bitgo.coin('tltc'),
        txid: '41f5974544068fe91ffa99275a5325ca503b87f11cc04ac74d2ec3390df51bc6',
        recoveryAddress: '2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm',
        wallet: '5abacebe28d72fbd07e0b8cbba0ff39e',
        walletPassphrase: TestV2BitGo.V2.TEST_RECOVERY_PASSCODE
      });

      should.exist(recovery);
      recovery.recoveryAddress.should.equal('2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm');
      recovery.recoveryAmount.should.equal(20972800);
      recovery.recoveryCoin.should.equal('tltc');
      recovery.sourceCoin.should.equal('tbtc');
      recovery.txHex.should.equal('0100000001c61bf50d39c32e4dc74ac01cf1873b50ca25535a2799fa1fe98f06444597f54100000000b600473044022072218955d9c218200b0ae502a94128118c5d30d20d5d5ec0b5fad8bc44543e8c02201352b553ca6163f1e99087bebe54425b15371d8f281da769bf5a0c7a2531aaf10100004c69522103b31347f19510acbc7f50822ac4093ca80554946c471b43eb937d0c9118d1122d2102cd3787d12af6eb87e7b9af00118a225e2ce663a5c94f555460ae131139a2afee2103bd558669de622fc57a8157f449c52254218dbc40dedf047891192bdd013cad8953aeffffffff01000540010000000017a914ef856a40c6dc109591b7d4fad170986d0bb404af8700000000');
      recovery.walletId.should.equal('5abacebe28d72fbd07e0b8cbba0ff39e');
      recovery.should.have.property('txInfo');
      recovery.txInfo.should.have.property('unspents');
      recovery.txInfo.should.have.property('inputs');
    }));

    it('should recover LTC sent to the wrong chain', co(function *() {
      const recovery = yield bitgo.coin('tltc').recoverFromWrongChain({
        coin: bitgo.coin('tbtc'),
        txid: 'fe22e43e7894e91ec4b371bfbce02f49b2903cc535e4a2345eeda5271c81db39',
        recoveryAddress: 'Qb3mLF6zy2frAAJmBcuVneJHUsmtk2Jo6V',
        wallet: '5abace103cddfbb607d8239d806671bf',
        walletPassphrase: TestV2BitGo.V2.TEST_RECOVERY_PASSCODE
      });

      should.exist(recovery);
      recovery.recoveryAddress.should.equal('Qb3mLF6zy2frAAJmBcuVneJHUsmtk2Jo6V');
      recovery.recoveryAmount.should.equal(39966000);
      recovery.recoveryCoin.should.equal('tbtc');
      recovery.sourceCoin.should.equal('tltc');
      recovery.txHex.should.equal('010000000139db811c27a5ed5e34a2e435c53c90b2492fe0bcbf71b3c41ee994783ee422fe01000000b700483045022100a26301277e837c9558dc7d7bdeb20531b86aded988e32ef44fdcd1eca8ff1d0002200bfe14f01cb9267e91c4116e2466669175b516d7187f476672c8a66fdb665a580100004c695221032afb7613787f1ab168ae5aea260891a93740a7bd41e66381d73aa07c02e053d321022d342407c7cbe25718d1983db4df95b0000762d9203a35877412d589beebae422103b366f06f3b9f25440d281c78e61aab3375ee8ea4ae72750ac7522c1bdc4e95b153aeffffffff0130d561020000000017a9149e71e9125ef730c576b027d2c10cbdbe1ee1a5528700000000');
      recovery.walletId.should.equal('5abace103cddfbb607d8239d806671bf');
      recovery.should.have.property('txInfo');
      recovery.txInfo.should.have.property('unspents');
      recovery.txInfo.should.have.property('inputs');
    }));

    it('should recover BCH sent to the wrong chain', co(function *() {
      const recovery = yield bitgo.coin('tbch').recoverFromWrongChain({
        coin: bitgo.coin('tbtc'),
        txid: '94143c674bd194ea215143457808440aefa4780a2a81396a1f642d6edaa1ea26',
        recoveryAddress: '2NGZbWp6bZto9pFKV1Y5EEGWTNHwgNfpVD2',
        wallet: '5abace103cddfbb607d8239d806671bf',
        walletPassphrase: TestV2BitGo.V2.TEST_RECOVERY_PASSCODE
      });

      should.exist(recovery);
      recovery.recoveryAddress.should.equal('2NGZbWp6bZto9pFKV1Y5EEGWTNHwgNfpVD2');
      recovery.recoveryAmount.should.equal(59993200);
      recovery.recoveryCoin.should.equal('tbtc');
      recovery.sourceCoin.should.equal('tbch');
      recovery.txHex.should.equal('020000000126eaa1da6e2d641f6a39812a0a78a4ef0a44087845435121ea94d14b673c149400000000b7004830450221009784391e9fab5bd8e3c3902477521ed1e8e8c1f6d584c3ca918cf40053450cdc022016597cf28a6b38fbe0f1eef5608af049912cadc6390b49277602d842c89704a24100004c695221032afb7613787f1ab168ae5aea260891a93740a7bd41e66381d73aa07c02e053d321022d342407c7cbe25718d1983db4df95b0000762d9203a35877412d589beebae422103b366f06f3b9f25440d281c78e61aab3375ee8ea4ae72750ac7522c1bdc4e95b153aeffffffff01706c93030000000017a914ffc45981f784d9bd9feb2d305061404f50bc1e058700000000');
      recovery.walletId.should.equal('5abace103cddfbb607d8239d806671bf');
      recovery.should.have.property('txInfo');
      recovery.txInfo.should.have.property('unspents');
      recovery.txInfo.should.have.property('inputs');
    }));

    it('should generate an unsigned recovery transaction', co(function *() {
      const recovery = yield bitgo.coin('tbtc').recoverFromWrongChain({
        coin: bitgo.coin('tltc'),
        txid: '41f5974544068fe91ffa99275a5325ca503b87f11cc04ac74d2ec3390df51bc6',
        recoveryAddress: '2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm',
        wallet: '5abacebe28d72fbd07e0b8cbba0ff39e',
        signed: false
      });

      should.exist(recovery);
      recovery.txHex.should.equal('0100000001c61bf50d39c32e4dc74ac01cf1873b50ca25535a2799fa1fe98f06444597f5410000000000ffffffff01000540010000000017a914ef856a40c6dc109591b7d4fad170986d0bb404af8700000000');
      recovery.walletId.should.equal('5abacebe28d72fbd07e0b8cbba0ff39e');
      recovery.address.should.equal('2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm');
      recovery.amount.should.equal(20972800);
      recovery.coin.should.equal('tbtc');
      recovery.should.have.property('txInfo');
      recovery.txInfo.should.have.property('unspents');
    }));
  });

  describe('Recover Ethereum', function() {
    it('should construct a recovery transaction without BitGo', co(function *() {
      recoveryNocks.nockEthRecovery();

      const basecoin = bitgo.coin('teth');
      const recovery = yield basecoin.recover({
        userKey: '{"iv":"+TkmT3GJ5msVWQjBrt3lsw==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
        ':"ccm","adata":"","cipher":"aes","salt":"cCE20fGIobs=","ct":"NVIdYIh91J3aRI\n' +
        '8GG0JE3DhXW3AUmz2G5RqMejdz1+t4/vovIP7lleegI7VYyWiiLvlM0OCFf3EVvV/RyXr8+2vsn\n' +
        'Q0Vn8c2CV5FRZ80OjGYrW3A/6T/zpOz6E8CMvnD++iIpeO4r2eZJavejZxdzlxF0BRz7VI="}',
        backupKey: '{"iv":"asB356ofC7nZtg4NBvQkiQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
        ':"ccm","adata":"","cipher":"aes","salt":"1hr2HhBbBIk=","ct":"8CZc6upt+XNOto\n' +
        'KDD38TUg3ZUjzW+DraZlkcku2bNp0JS2s1g/iC6YTGUGtPoxDxumDlXwlWQx+5WPjZu79M8DCrI\n' +
        't9aZaOvHkGH9aFtMbavFX419TcrwDmpUeQFN0hRkfrIHXyHNbTpGSVAjHvHMtzDMaw+ACg="}',
        walletContractAddress: '0x5df5a96b478bb1808140d87072143e60262e8670',
        walletPassphrase: TestV2BitGo.V2.TEST_RECOVERY_PASSCODE,
        recoveryDestination: '0xac05da78464520aa7c9d4c19bd7a440b111b3054'
      });

      // id and tx will always be different because of expireTime
      should.exist(recovery);
      recovery.should.have.property('id');
      recovery.should.have.property('tx');
    }));

    it('should construct a recovery transaction without BitGo and with KRS', co(function *() {
      recoveryNocks.nockEthRecovery();

      const basecoin = bitgo.coin('teth');
      const recovery = yield basecoin.recover({
        userKey: '{"iv":"+TkmT3GJ5msVWQjBrt3lsw==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
          ':"ccm","adata":"","cipher":"aes","salt":"cCE20fGIobs=","ct":"NVIdYIh91J3aRI\n' +
          '8GG0JE3DhXW3AUmz2G5RqMejdz1+t4/vovIP7lleegI7VYyWiiLvlM0OCFf3EVvV/RyXr8+2vsn\n' +
          'Q0Vn8c2CV5FRZ80OjGYrW3A/6T/zpOz6E8CMvnD++iIpeO4r2eZJavejZxdzlxF0BRz7VI="}',
        backupKey: 'xpub661MyMwAqRbcGsCNiG4BzbxLmXnJFo4K5gVSE2b9AxufAtpuTun1SYwg9Uykqqf4DrKrDZ6KqPm9ehthWbCma7pnaMrtXY11nY7MeFbEDPm',
        walletContractAddress: '0x5df5a96b478bb1808140d87072143e60262e8670',
        walletPassphrase: TestV2BitGo.V2.TEST_RECOVERY_PASSCODE,
        krsProvider: 'keyternal',
        recoveryDestination: '0xac05da78464520aa7c9d4c19bd7a440b111b3054'
      });

      // id and tx will always be different because of expireTime
      should.exist(recovery);
      recovery.should.have.property('id');
      recovery.should.have.property('tx');
    }));

    it('should error when the backup key is unfunded (cannot pay gas)', co(function *() {
      recoveryNocks.nockEthRecovery();

      const basecoin = bitgo.coin('teth');
      const error = yield bitgo.getAsyncError(basecoin.recover({
        userKey: '{"iv":"VNvG6t3fHfxMcfvNuafYYA==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
        ':"ccm","adata":"","cipher":"aes","salt":"mc9pCk3H43w=","ct":"Qe4Z1evaXcrOMC\n' +
        'cQ/XMVVBO9M/99D1QQ6LxkG8z3fQtwwOVXM3/6doNrriprUqs+adpFC93KRcAaDroL1E6o17J2k\n' +
        'mcpXRd2CuXRFORZmZ/6QBfjKfCJ3aq0kEkDVv37gZNVT3aNtGkNSQdCEWKQLwd1++r5AkA="}\n',
        backupKey: '{"iv":"EjD7x0OJX9kNM/C3yEDvyQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
        ':"ccm","adata":"","cipher":"aes","salt":"Na9NvRRe3n8=","ct":"B/AtSLHolsdNLr\n' +
        '4Dlij4kQ0E6NyUUs6wo6T2HtPDAPO0hyhPPbh1OAYqIS7VlL9xmJRFC2zPxwRJvzf6OWC/m48HX\n' +
        'vgLoXYgahArhalzJVlRxcXUz4HOhozRWfv/eK3t5HJfm+25+WBOiW8YgSE7hVEYTbeBRD4="}',
        walletContractAddress: '0x22ff743216b58aeb3efc46985406b50112e9e176',
        walletPassphrase: TestV2BitGo.V2.TEST_RECOVERY_PASSCODE,
        recoveryDestination: '0xac05da78464520aa7c9d4c19bd7a440b111b3054'
      }));

      should.exist(error);
      error.message.should.equal('Backup key address 0xba6d9d82cf2920c544b834b72f4c6d11a3ef3de6 has balance 0. This address must have a balance of at least 0.01 ETH to perform recoveries');
    }));
  });
});
