import * as should from 'should';
import { bip32 } from '@bitgo/utxo-lib';
import nock from 'nock';
import { common } from '@bitgo/sdk-core';
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

import { Opeth, Topeth, TransactionBuilder } from '../../src';
import * as mockData from '../fixtures/opeth';
import { getBuilder } from '../getBuilder';
import * as testData from '../resources';

nock.enableNetConnect();

describe('Optimism', function () {
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
    bitgo.safeRegister(coinMain, Opeth.createInstance);
    bitgo.safeRegister(coinTest, Topeth.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin(coinTest);
    runBasicCoinInfoTests('Opeth', bitgo, Opeth, Topeth, testData);
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
    bitgo.safeRegister(coinMain, Opeth.createInstance);
    bitgo.safeRegister(coinTest, Topeth.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin(coinTest);
    const txBuilder: TransactionBuilder = getBuilder(coinTest) as TransactionBuilder;
    runExplainTransactionTests('Opeth', txBuilder, basecoin, testData);
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
    bitgo.safeRegister(coinMain, Opeth.createInstance);
    bitgo.safeRegister(coinTest, Topeth.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin(coinTest);
    const builder = getBuilder(coinTest) as TransactionBuilder;
    runSignTransactionTests('Opeth', builder, basecoin, testData);
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
    bitgo.safeRegister(coinMain, Opeth.createInstance);
    bitgo.safeRegister(coinTest, Topeth.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin(coinTest);
    runTransactionVerificationTests('Opeth', bitgo, basecoin, testData);
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
    bitgo.safeRegister(coinMain, Opeth.createInstance);
    bitgo.safeRegister(coinTest, Topeth.createInstance);
    bitgo.initializeTestVars();
    const baseUrl = testData.BASE_URL;
    const coin = testData.COIN;
    const userXpub =
      'xpub661MyMwAqRbcEeTc8789MK5PUGEYiPG4F4V17n2Rd2LoTATA1XoCnJT5FAYAShQxSxtFjpo5NHmcWwTp2LiWGBMwpUcAA3HywhxivgYfq7q';
    const backupXpub =
      'xpub661MyMwAqRbcFZX15xpZf4ERCGHiVSJm8r5C4yh1yXV2GrdZCUPYo4WQr6tN9oUywKXsgSHo7Risf9r22GH5joVD2hEEEhqnSCvK8qy11wW';
    const txBuilder = getBuilder(coinTest) as TransactionBuilder;
    const minBalance = 11000000;
    runRecoveryTransactionTests('Opeth', txBuilder, bitgo, testData, mockData);

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

  describe('Evm Based Cross Chain Recovery transaction:', () => {
    const baseUrl = 'https://api-sepolia-optimistic.etherscan.io';
    const bitgoFeeAddress = '0x33a42faea3c6e87021347e51700b48aaf49aa1e7';
    const destinationAddress = '0xd5adde17fed8baed3f32b84af05b8f2816f7b560';
    const bitgoDestinationAddress = '0xe5986ce4490deb67d2950562ceb930ddf9be7a14';

    after(function () {
      nock.cleanAll();
    });

    it('should generate an half signed recovery txn for hot wallet', async function () {
      const userKey =
        '{"iv":"VFZ3jvXhxo1Z+Yaf2MtZnA==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
        ':"ccm","adata":"","cipher":"aes","salt":"p+fkHuLa/8k=","ct":"hYG7pvljLIgCjZ\n' +
        '53PBlCde5KZRmlUKKHLtDMk+HJfuU46hW+x+C9WsIAO4gFPnTCvFVmQ8x7czCtcNFub5AO2otOG\n' +
        'OsX4GE2gXOEmCl1TpWwwNhm7yMUjGJUpgW6ZZgXSXdDitSKi4V/hk78SGSzjFOBSPYRa6I="}\n';
      const walletContractAddress = TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS as string;
      const bitgoFeeAddress = '0x33a42faea3c6e87021347e51700b48aaf49aa1e7';
      const destinationAddress = '0xd5adde17fed8baed3f32b84af05b8f2816f7b560';
      const bitgoDestinationAddress = '0xE5986CE4490Deb67d2950562Ceb930Ddf9be7a14';
      const walletPassphrase = TestBitGo.V2.TEST_RECOVERY_PASSCODE as string;

      const basecoin = bitgo.coin(coinTest) as Opeth;
      nock(baseUrl)
        .get('/api')
        .query(mockData.getTxListRequest(bitgoFeeAddress))
        .reply(200, mockData.getTxListResponse);
      nock(baseUrl)
        .get('/api')
        .query(mockData.getBalanceRequest(bitgoFeeAddress))
        .reply(200, mockData.getBalanceResponse);
      nock(baseUrl)
        .get('/api')
        .query(mockData.getBalanceRequest(walletContractAddress))
        .reply(200, mockData.getBalanceResponse);
      nock(baseUrl).get('/api').query(mockData.getContractCallRequest).reply(200, mockData.getContractCallResponse);

      const transaction = (await basecoin.recover({
        userKey: userKey,
        backupKey: '',
        walletPassphrase: walletPassphrase,
        walletContractAddress: walletContractAddress,
        bitgoFeeAddress: bitgoFeeAddress,
        recoveryDestination: destinationAddress,
        eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
        gasLimit: 500000,
        bitgoDestinationAddress: bitgoDestinationAddress,
      })) as OfflineVaultTxInfo;

      should.exist(transaction);
      transaction.should.have.property('txHex');
      transaction.should.have.property('coin');
      transaction.should.have.property('contractSequenceId');
      transaction.should.have.property('expireTime');
      transaction.should.have.property('gasLimit');
      transaction.gasLimit.should.equal('500000');
      transaction.should.have.property('isEvmBasedCrossChainRecovery');
      transaction.isEvmBasedCrossChainRecovery?.should.equal(true);
      transaction.should.have.property('walletContractAddress');
      transaction.walletContractAddress.should.equal(TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS);
      transaction.should.have.property('recipients');
      const recipient = transaction.recipients[0];
      recipient.should.have.property('address');
      recipient.address.should.equal(destinationAddress);
      recipient.should.have.property('amount');
      recipient.amount.should.equal('9999999999999999928');
      transaction.should.have.property('feesUsed');
      transaction.feesUsed?.gasLimit.should.equal('500000');
      transaction.should.have.property('halfSigned');
      transaction.halfSigned?.should.have.property('txHex');
      transaction.halfSigned?.should.have.property('recipients');
    });

    it('should generate an half signed recovery txn of an unsupported token for hot wallet', async function () {
      const userKey =
        '{"iv":"VFZ3jvXhxo1Z+Yaf2MtZnA==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
        ':"ccm","adata":"","cipher":"aes","salt":"p+fkHuLa/8k=","ct":"hYG7pvljLIgCjZ\n' +
        '53PBlCde5KZRmlUKKHLtDMk+HJfuU46hW+x+C9WsIAO4gFPnTCvFVmQ8x7czCtcNFub5AO2otOG\n' +
        'OsX4GE2gXOEmCl1TpWwwNhm7yMUjGJUpgW6ZZgXSXdDitSKi4V/hk78SGSzjFOBSPYRa6I="}\n';
      const walletContractAddress = TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS as string;
      const walletPassphrase = TestBitGo.V2.TEST_RECOVERY_PASSCODE as string;
      const tokenContractAddress = '0xe4ab69c077896252fafbd49efd26b5d171a32410'; // topeth-link contract token address

      const basecoin = bitgo.coin(coinTest) as Opeth;
      nock(baseUrl)
        .get('/api')
        .query(mockData.getTxListRequest(bitgoFeeAddress))
        .reply(200, mockData.getTxListResponse);
      nock(baseUrl)
        .get('/api')
        .query(mockData.getBalanceRequest(bitgoFeeAddress))
        .reply(200, mockData.getBalanceResponse);
      nock(baseUrl)
        .get('/api')
        .query(mockData.getTokenBalanceRequest(tokenContractAddress, walletContractAddress))
        .reply(200, mockData.getBalanceResponse);
      nock(baseUrl).get('/api').query(mockData.getContractCallRequest).reply(200, mockData.getContractCallResponse);

      const transaction = (await basecoin.recover({
        userKey: userKey,
        backupKey: '',
        walletPassphrase: walletPassphrase,
        walletContractAddress: walletContractAddress,
        bitgoFeeAddress: bitgoFeeAddress,
        recoveryDestination: destinationAddress,
        eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
        gasLimit: 500000,
        bitgoDestinationAddress: bitgoDestinationAddress,
        tokenContractAddress: tokenContractAddress,
      })) as OfflineVaultTxInfo;

      should.exist(transaction);
      transaction.should.have.property('txHex');
      const txBuilder = getBuilder(coinTest) as TransactionBuilder;
      txBuilder.from(transaction.txHex);
      const rebuiltTx = await txBuilder.build();
      const rebuiltTxJson = rebuiltTx.toJson();
      rebuiltTxJson.should.have.property('data');
      rebuiltTxJson.data.should.startWith('0x0dcd7a6c'); // sendMultiSigToken func
      transaction.should.have.property('coin');
      transaction.coin.should.equal(coinTest);
      transaction.should.have.property('contractSequenceId');
      transaction.should.have.property('expireTime');
      transaction.should.have.property('gasLimit');
      transaction.gasLimit.should.equal('500000');
      transaction.should.have.property('isEvmBasedCrossChainRecovery');
      transaction.isEvmBasedCrossChainRecovery?.should.equal(true);
      transaction.should.have.property('walletContractAddress');
      transaction.walletContractAddress.should.equal(TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS);
      transaction.should.have.property('recipients');
      const recipient = transaction.recipients[0];
      recipient.should.have.property('address');
      recipient.address.should.equal(destinationAddress);
      recipient.should.have.property('amount');
      recipient.amount.should.equal('9999999999999999928');
      transaction.should.have.property('feesUsed');
      transaction.feesUsed?.gasLimit.should.equal('500000');
      transaction.should.have.property('halfSigned');
      transaction.halfSigned?.should.have.property('txHex');
      transaction.halfSigned?.should.have.property('recipients');
    });
  });
});
