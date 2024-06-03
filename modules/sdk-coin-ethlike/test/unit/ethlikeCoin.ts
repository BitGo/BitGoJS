import assert from 'assert';
import { BitGoAPI } from '@bitgo/sdk-api';
import { common, FullySignedTransaction, HalfSignedTransaction, TransactionType } from '@bitgo/sdk-core';
import { OfflineVaultTxInfo } from '@bitgo/abstract-eth';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { bip32 } from '@bitgo/utxo-lib';
import nock from 'nock';

import { EthLikeCoin, TethLikeCoin, EthLikeTransactionBuilder } from '../../src';
import { getBuilder } from '../getBuilder';
import { baseChainCommon } from '../resources';
import * as mockData from '../fixtures/ethlikeCoin';

nock.enableNetConnect();

describe('EthLikeCoin', function () {
  let bitgo: TestBitGoAPI;
  const coinName = 'tbaseeth';
  let basecoin: TethLikeCoin;

  before(function () {
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
    bitgo.safeRegister('baseeth', EthLikeCoin.createInstance);
    bitgo.safeRegister('tbaseeth', TethLikeCoin.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tbaseeth') as TethLikeCoin;
  });

  after(function () {
    nock.cleanAll();
  });

  it('should instantiate a coin', function () {
    let coin = bitgo.coin('tbaseeth');
    coin.should.be.an.instanceof(TethLikeCoin);
    coin = bitgo.coin('baseeth');
    coin.should.be.an.instanceof(EthLikeCoin);
  });

  it('should build unsigned transaction', async function () {
    const expireTime = Math.floor(new Date().getTime() / 1000);
    const txBuilder = getBuilder(coinName, baseChainCommon) as EthLikeTransactionBuilder;
    txBuilder.type(TransactionType.Send);
    txBuilder.fee({
      fee: '1000000000',
      gasLimit: '100000',
    });
    txBuilder.counter(1);
    txBuilder.contract('0x2c2b9c9a4a25e24b174f26114e8926a9f2128fe4');

    const transferBuilder = txBuilder.transfer();
    transferBuilder
      .coin(coinName)
      .expirationTime(expireTime)
      .amount('1000000000000000000')
      .to('0x2c2b9c9a4a25e24b174f26114e8926a9f2128fe4')
      .contractSequenceId(1);

    const tx = await txBuilder.build();
    const txJson = tx.toJson();
    txJson.gasLimit.should.equal('100000');
    txJson.gasPrice.should.equal('1000000000');
    txJson.chainId.should.equal('0x14a34');
  });

  it('should sign a transaction', async function () {
    const account_1 = {
      address: '0x8Ce59c2d1702844F8EdED451AA103961bC37B4e8',
      owner_1: '4ee089aceabf3ddbf748db79b1066c33b7d3ea1ab3eb7e325121bba2bff2f5ca',
      owner_2: '5c7e4efff7304d4dfff6d5f1591844ec6f2adfa6a47e9fece6a3c1a4d755f1e3',
      owner_3: '4421ab25dd91e1a3180d03d57c323a7886dcc313d3b3a4b4256a5791572bf597',
    };
    const expireTime = Math.floor(new Date().getTime() / 1000);
    const txBuilder = getBuilder(coinName, baseChainCommon) as EthLikeTransactionBuilder;
    txBuilder.type(TransactionType.Send);
    txBuilder.fee({
      fee: '1000000000',
      gasLimit: '100000',
    });
    txBuilder.counter(1);
    txBuilder.contract(account_1.address);

    const transferBuilder = txBuilder.transfer();
    transferBuilder
      .coin(coinName)
      .expirationTime(expireTime)
      .amount('1000000000000000000')
      .to('0x2c2b9c9a4a25e24b174f26114e8926a9f2128fe4')
      .contractSequenceId(1);

    const unsignedTx = await txBuilder.build();
    const unsignedTxHex = unsignedTx.toBroadcastFormat();
    const halfSignedTx = (await basecoin.signTransaction({
      txPrebuild: {
        txHex: unsignedTxHex,
      },
      prv: account_1.owner_1,
      common: baseChainCommon,
    })) as HalfSignedTransaction;
    transferBuilder.key(account_1.owner_1);
    const halfSignedTxBuilder = await txBuilder.build();
    const halfSignedTxHexBuilder = halfSignedTxBuilder.toBroadcastFormat();
    halfSignedTxHexBuilder.should.equal(halfSignedTx.halfSigned.txHex);

    // Sign with the second key

    const fullSignedTxn = (await basecoin.signTransaction({
      txPrebuild: {
        halfSigned: {
          txHex: halfSignedTxHexBuilder,
          expireTime: expireTime,
          contractSequenceId: 1,
          signature: '',
        },
      },
      prv: account_1.owner_2,
      common: baseChainCommon,
      isLastSignature: true,
    })) as FullySignedTransaction;

    assert(fullSignedTxn.txHex);
  });

  describe('Recovery', function () {
    const baseUrl = 'https://api-sepolia.basescan.org/';
    const userXpub =
      'xpub661MyMwAqRbcEeTc8789MK5PUGEYiPG4F4V17n2Rd2LoTATA1XoCnJT5FAYAShQxSxtFjpo5NHmcWwTp2LiWGBMwpUcAA3HywhxivgYfq7q';
    const backupXpub =
      'xpub661MyMwAqRbcFZX15xpZf4ERCGHiVSJm8r5C4yh1yXV2GrdZCUPYo4WQr6tN9oUywKXsgSHo7Risf9r22GH5joVD2hEEEhqnSCvK8qy11wW';

    it('should generate an unsigned sweep transaction', async function () {
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
        .reply(200, mockData.getBalanceResponse);

      nock(baseUrl).get('/api').query(mockData.getContractCallRequest).reply(200, mockData.getContractCallResponse);

      const baseCoin = bitgo.coin('tbaseeth') as TethLikeCoin;
      const transaction = (await baseCoin.recover({
        userKey: userXpub,
        backupKey: backupXpub,
        walletContractAddress: walletContractAddress,
        recoveryDestination: TestBitGo.V2.TEST_ERC20_TOKEN_RECIPIENT as string,
        eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
        gasLimit: 500000,
        common: baseChainCommon,
      })) as OfflineVaultTxInfo;
      assert(transaction.txHex);
      assert(transaction.contractSequenceId);
      assert.strictEqual(transaction.gasLimit, '500000');
    });
  });

  describe('Evm Based Cross Chain Recovery transaction:', function () {
    const baseUrl = 'https://api-sepolia.basescan.org/';
    const userXpub =
      'xpub661MyMwAqRbcEeTc8789MK5PUGEYiPG4F4V17n2Rd2LoTATA1XoCnJT5FAYAShQxSxtFjpo5NHmcWwTp2LiWGBMwpUcAA3HywhxivgYfq7q';

    it('should generate an unsigned recovery txn for cold wallet', async function () {
      const walletContractAddress = TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS as string;
      const bitgoFeeAddress = '0x33a42faea3c6e87021347e51700b48aaf49aa1e7';
      const destinationAddress = '0xd5adde17fed8baed3f32b84af05b8f2816f7b560';
      const bitgoDestinationAddress = '0xE5986CE4490Deb67d2950562Ceb930Ddf9be7a14';

      const basecoin = bitgo.coin('tbaseeth') as TethLikeCoin;
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
        userKey: userXpub,
        backupKey: '',
        walletContractAddress: walletContractAddress,
        bitgoFeeAddress: bitgoFeeAddress,
        recoveryDestination: destinationAddress,
        eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
        gasLimit: 500000,
        bitgoDestinationAddress: bitgoDestinationAddress,
        common: baseChainCommon,
      })) as OfflineVaultTxInfo;

      assert(transaction);
      transaction.should.have.property('txHex');
      transaction.should.have.property('userKey');
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
    });

    it('should generate an unsigned recovery txn for custody wallet', async function () {
      const walletContractAddress = TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS as string;
      const bitgoFeeAddress = '0x33a42faea3c6e87021347e51700b48aaf49aa1e7';
      const destinationAddress = '0xd5adde17fed8baed3f32b84af05b8f2816f7b560';
      const bitgoDestinationAddress = '0xE5986CE4490Deb67d2950562Ceb930Ddf9be7a14';

      const basecoin = bitgo.coin('tbaseeth') as TethLikeCoin;
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
        userKey: '',
        backupKey: '',
        walletContractAddress: walletContractAddress,
        bitgoFeeAddress: bitgoFeeAddress,
        recoveryDestination: destinationAddress,
        eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
        gasLimit: 500000,
        bitgoDestinationAddress: bitgoDestinationAddress,
        common: baseChainCommon,
      })) as OfflineVaultTxInfo;

      assert(transaction);
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
    });

    it('should generate an unsigned recovery txn for hot wallet', async function () {
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

      const basecoin = bitgo.coin('tbaseeth') as TethLikeCoin;
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
        common: baseChainCommon,
      })) as OfflineVaultTxInfo;

      assert(transaction);
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

    it('should generate an unsigned recovery txn of a token for cold wallet ', async function () {
      const walletContractAddress = TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS as string;
      const bitgoFeeAddress = '0x33a42faea3c6e87021347e51700b48aaf49aa1e7';
      const destinationAddress = '0xd5adde17fed8baed3f32b84af05b8f2816f7b560';
      const bitgoDestinationAddress = '0xE5986CE4490Deb67d2950562Ceb930Ddf9be7a14';
      const tokenContractAddress = '0x326c977e6efc84e512bb9c30f76e30c160ed06fb';

      const basecoin = bitgo.coin('tbaseeth') as TethLikeCoin;
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
        userKey: userXpub,
        backupKey: '',
        walletContractAddress: walletContractAddress,
        bitgoFeeAddress: bitgoFeeAddress,
        recoveryDestination: destinationAddress,
        eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
        gasLimit: 500000,
        bitgoDestinationAddress: bitgoDestinationAddress,
        tokenContractAddress: tokenContractAddress,
        common: baseChainCommon,
      })) as OfflineVaultTxInfo;

      assert(transaction);
      transaction.should.have.property('txHex');
      transaction.should.have.property('userKey');
      transaction.should.have.property('coin');
      transaction.coin.should.equal('tbaseeth');
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
    });

    it('should generate an unsigned recovery txn of a token for custody wallet', async function () {
      const walletContractAddress = TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS as string;
      const bitgoFeeAddress = '0x33a42faea3c6e87021347e51700b48aaf49aa1e7';
      const destinationAddress = '0xd5adde17fed8baed3f32b84af05b8f2816f7b560';
      const bitgoDestinationAddress = '0xE5986CE4490Deb67d2950562Ceb930Ddf9be7a14';
      const tokenContractAddress = '0x326c977e6efc84e512bb9c30f76e30c160ed06fb'; // unsupported token contract address

      const basecoin = bitgo.coin('tbaseeth') as TethLikeCoin;
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
        userKey: '',
        backupKey: '',
        walletContractAddress: walletContractAddress,
        bitgoFeeAddress: bitgoFeeAddress,
        recoveryDestination: destinationAddress,
        eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
        gasLimit: 500000,
        bitgoDestinationAddress: bitgoDestinationAddress,
        tokenContractAddress: tokenContractAddress,
        common: baseChainCommon,
      })) as OfflineVaultTxInfo;

      assert(transaction);
      transaction.should.have.property('txHex');
      transaction.should.have.property('coin');
      transaction.coin.should.equal('tbaseeth');
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
    });

    it('should generate an unsigned recovery txn of a token for hot wallet', async function () {
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
      const tokenContractAddress = '0x326c977e6efc84e512bb9c30f76e30c160ed06fb'; // unsupported contract token address

      const basecoin = bitgo.coin('tbaseeth') as TethLikeCoin;
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
        common: baseChainCommon,
      })) as OfflineVaultTxInfo;

      assert(transaction);
      transaction.should.have.property('txHex');
      transaction.should.have.property('coin');
      transaction.coin.should.equal('tbaseeth');
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
