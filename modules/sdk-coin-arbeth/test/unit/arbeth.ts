import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import {
  OfflineVaultTxInfo,
  runBasicCoinInfoTests,
  runExplainTransactionTests,
  runRecoveryTransactionTests,
  runSignTransactionTests,
  runTransactionVerificationTests,
} from '@bitgo/abstract-eth';

import { Arbeth, Tarbeth, TransactionBuilder } from '../../src';
import * as mockData from '../fixtures/arbeth';
import { getBuilder } from '../getBuilder';
import * as testData from '../resources';
import { bip32 } from '@bitgo/utxo-lib';
import { common } from '@bitgo/sdk-core';
import nock from 'nock';

nock.enableNetConnect();

describe('Arbitrum', () => {
  let bitgo: TestBitGoAPI;
  let basecoin;
  const coinTest = testData.COIN;
  const coinMain = coinTest.slice(1);

  describe('Basic Coin Info', () => {
    const bitgoKeyXprv =
      'xprv9s21ZrQH143K3tpWBHWe31sLoXNRQ9AvRYJgitkKxQ4ATFQMwvr7hHNqYRUnS7PsjzB7aK1VxqHLuNQjj1sckJ2Jwo2qxmsvejwECSpFMfC';
    const bitgoKey = bip32.fromBase58(bitgoKeyXprv);
    if (!bitgoKey.privateKey) {
      throw new Error('no privateKey');
    }
    const bitgoXpub = bitgoKey.neutered().toBase58();
    const env = 'test';
    bitgo = TestBitGo.decorate(BitGoAPI, { env });
    common.Environments[env].hsmXpub = bitgoXpub;
    bitgo = TestBitGo.decorate(BitGoAPI, { env });
    bitgo.safeRegister(coinMain, Arbeth.createInstance);
    bitgo.safeRegister(coinTest, Tarbeth.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin(coinTest);
    runBasicCoinInfoTests('Arbeth', bitgo, Arbeth, Tarbeth, testData);
  });

  describe('Explain transaction:', () => {
    const bitgoKeyXprv =
      'xprv9s21ZrQH143K3tpWBHWe31sLoXNRQ9AvRYJgitkKxQ4ATFQMwvr7hHNqYRUnS7PsjzB7aK1VxqHLuNQjj1sckJ2Jwo2qxmsvejwECSpFMfC';
    const bitgoKey = bip32.fromBase58(bitgoKeyXprv);
    if (!bitgoKey.privateKey) {
      throw new Error('no privateKey');
    }
    const bitgoXpub = bitgoKey.neutered().toBase58();
    const env = 'test';
    bitgo = TestBitGo.decorate(BitGoAPI, { env });
    common.Environments[env].hsmXpub = bitgoXpub;
    bitgo = TestBitGo.decorate(BitGoAPI, { env });
    bitgo.safeRegister(coinMain, Arbeth.createInstance);
    bitgo.safeRegister(coinTest, Tarbeth.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin(coinTest);
    const txBuilder: TransactionBuilder = getBuilder(coinTest) as TransactionBuilder;
    runExplainTransactionTests('Arbeth', txBuilder, basecoin, testData);
  });

  describe('Sign Transaction', () => {
    const bitgoKeyXprv =
      'xprv9s21ZrQH143K3tpWBHWe31sLoXNRQ9AvRYJgitkKxQ4ATFQMwvr7hHNqYRUnS7PsjzB7aK1VxqHLuNQjj1sckJ2Jwo2qxmsvejwECSpFMfC';
    const bitgoKey = bip32.fromBase58(bitgoKeyXprv);
    if (!bitgoKey.privateKey) {
      throw new Error('no privateKey');
    }
    const bitgoXpub = bitgoKey.neutered().toBase58();
    const env = 'test';
    bitgo = TestBitGo.decorate(BitGoAPI, { env });
    common.Environments[env].hsmXpub = bitgoXpub;
    bitgo = TestBitGo.decorate(BitGoAPI, { env });
    bitgo.safeRegister(coinMain, Arbeth.createInstance);
    bitgo.safeRegister(coinTest, Tarbeth.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin(coinTest);
    const builder = getBuilder(coinTest) as TransactionBuilder;
    runSignTransactionTests('Arbeth', builder, basecoin, testData);
  });

  describe('Transaction Verification', () => {
    const bitgoKeyXprv =
      'xprv9s21ZrQH143K3tpWBHWe31sLoXNRQ9AvRYJgitkKxQ4ATFQMwvr7hHNqYRUnS7PsjzB7aK1VxqHLuNQjj1sckJ2Jwo2qxmsvejwECSpFMfC';
    const bitgoKey = bip32.fromBase58(bitgoKeyXprv);
    if (!bitgoKey.privateKey) {
      throw new Error('no privateKey');
    }
    const bitgoXpub = bitgoKey.neutered().toBase58();
    const env = 'test';
    bitgo = TestBitGo.decorate(BitGoAPI, { env });
    common.Environments[env].hsmXpub = bitgoXpub;
    bitgo = TestBitGo.decorate(BitGoAPI, { env });
    bitgo.safeRegister(coinMain, Arbeth.createInstance);
    bitgo.safeRegister(coinTest, Tarbeth.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin(coinTest);
    runTransactionVerificationTests('Arbeth', bitgo, basecoin, testData);
  });

  describe('Recover transaction:', () => {
    const bitgoKeyXprv =
      'xprv9s21ZrQH143K3tpWBHWe31sLoXNRQ9AvRYJgitkKxQ4ATFQMwvr7hHNqYRUnS7PsjzB7aK1VxqHLuNQjj1sckJ2Jwo2qxmsvejwECSpFMfC';
    const bitgoKey = bip32.fromBase58(bitgoKeyXprv);
    if (!bitgoKey.privateKey) {
      throw new Error('no privateKey');
    }
    const bitgoXpub = bitgoKey.neutered().toBase58();
    const env = 'test';
    bitgo = TestBitGo.decorate(BitGoAPI, { env });
    common.Environments[env].hsmXpub = bitgoXpub;
    bitgo = TestBitGo.decorate(BitGoAPI, { env });
    bitgo.safeRegister(coinMain, Arbeth.createInstance);
    bitgo.safeRegister(coinTest, Tarbeth.createInstance);
    bitgo.initializeTestVars();
    const txBuilder = getBuilder(coinTest) as TransactionBuilder;
    const minBalance = 10000000;
    const baseUrl = testData.BASE_URL;
    const coin = testData.COIN;
    const userXpub =
      'xpub661MyMwAqRbcEeTc8789MK5PUGEYiPG4F4V17n2Rd2LoTATA1XoCnJT5FAYAShQxSxtFjpo5NHmcWwTp2LiWGBMwpUcAA3HywhxivgYfq7q';
    const backupXpub =
      'xpub661MyMwAqRbcFZX15xpZf4ERCGHiVSJm8r5C4yh1yXV2GrdZCUPYo4WQr6tN9oUywKXsgSHo7Risf9r22GH5joVD2hEEEhqnSCvK8qy11wW';
    runRecoveryTransactionTests('Arbeth', txBuilder, bitgo, testData, mockData);

    it('should throw an error in case of no funds to recover', async () => {
      const walletContractAddress = TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS as string;
      const backupKeyAddress = '0x4f2c4830cc37f2785c646f89ded8a919219fa0e9';
      nock(baseUrl)
        .get('/api')
        .twice()
        .query(mockData.getTxListRequest(backupKeyAddress))
        .reply(200, mockData.getTxListResponse);
      nock(baseUrl)
        .get('/api')
        .query(mockData.getBalanceRequest(walletContractAddress))
        .reply(200, mockData.getZeroBalanceResponse);
      nock(baseUrl)
        .get('/api')
        .query(mockData.getBalanceRequest(backupKeyAddress))
        .reply(200, mockData.getBalanceResponse);
      nock(baseUrl).get('/api').query(mockData.getContractCallRequest).reply(200, mockData.getContractCallResponse);
      const basecoin: any = bitgo.coin(coin);
      try {
        (await basecoin.recover({
          userKey: userXpub,
          backupKey: backupXpub,
          walletContractAddress: walletContractAddress,
          recoveryDestination: TestBitGo.V2.TEST_ERC20_TOKEN_RECIPIENT as string,
          eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
          gasLimit: 500000,
        })) as OfflineVaultTxInfo;
      } catch (e) {
        e.message.should.equal('Wallet does not have enough funds to recover');
      }
    });

    it('should throw an error in case fee address is having less funds than required', async () => {
      const walletContractAddress = TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS as string;
      const backupKeyAddress = '0x4f2c4830cc37f2785c646f89ded8a919219fa0e9';
      nock(baseUrl)
        .get('/api')
        .twice()
        .query(mockData.getTxListRequest(backupKeyAddress))
        .reply(200, mockData.getTxListResponse);
      nock(baseUrl)
        .get('/api')
        .query(mockData.getBalanceRequest(walletContractAddress))
        .reply(200, mockData.getBalanceResponse);
      nock(baseUrl)
        .get('/api')
        .query(mockData.getBalanceRequest(backupKeyAddress))
        .reply(200, mockData.getFeeAddressLowBalanceResponse);
      nock(baseUrl).get('/api').query(mockData.getContractCallRequest).reply(200, mockData.getContractCallResponse);
      const basecoin: any = bitgo.coin(coin);
      try {
        (await basecoin.recover({
          userKey: userXpub,
          backupKey: backupXpub,
          walletContractAddress: walletContractAddress,
          recoveryDestination: TestBitGo.V2.TEST_ERC20_TOKEN_RECIPIENT as string,
          eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
          gasLimit: 500000,
        })) as OfflineVaultTxInfo;
      } catch (e) {
        e.message.should.equal(
          `Backup key address 0x4f2c4830cc37f2785c646f89ded8a919219fa0e9 has balance 100000 Gwei.This address must have a balance of at least ${minBalance} Gwei to perform recoveries. Try sending some funds to this address then retry.`
        );
      }
    });
  });
});
