import { BitGoAPI } from '@bitgo/sdk-api';
import { common, Recipient, ECDSAMethodTypes, Wallet } from '@bitgo/sdk-core';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { bip32 } from '@bitgo/utxo-lib';
import * as should from 'should';
import { Polygon, Tpolygon, TransactionBuilder } from '../../src';
import { getBuilder } from '../getBuilder';
import * as mockData from '../fixtures/polygon';
import {
  OfflineVaultTxInfo,
  runExplainTransactionTests,
  runRecoveryTransactionTests,
  runSignTransactionTests,
  runTransactionVerificationTests,
} from '@bitgo/abstract-eth';
import * as testData from '../resources';
import nock from 'nock';
import * as sjcl from '@bitgo/sjcl';
import secp256k1 from 'secp256k1';

nock.enableNetConnect();

describe('Polygon', () => {
  let bitgo: TestBitGoAPI;
  let basecoin;
  const coinTest = testData.COIN;
  const coinMain = coinTest.slice(1);

  describe('Instantiate', () => {
    it('should instantiate the coin', function () {
      let localBasecoin = bitgo.coin('tpolygon');
      localBasecoin.should.be.an.instanceof(Tpolygon);

      localBasecoin = bitgo.coin('polygon');
      localBasecoin.should.be.an.instanceof(Polygon);
    });
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
    bitgo.safeRegister(coinMain, Polygon.createInstance);
    bitgo.safeRegister(coinTest, Tpolygon.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin(coinTest);
    const txBuilder: TransactionBuilder = getBuilder(coinTest) as TransactionBuilder;
    runExplainTransactionTests('Polygon', txBuilder, basecoin, testData);
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
    bitgo.safeRegister(coinMain, Polygon.createInstance);
    bitgo.safeRegister(coinTest, Tpolygon.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin(coinTest);
    const builder = getBuilder(coinTest) as TransactionBuilder;
    runSignTransactionTests('Polygon', builder, basecoin, testData);
  });

  describe('Transaction Verification', () => {
    const hopContractAddress = '0x47ce7cc86efefef19f8fb516b11735d183da8635';
    const hopDestinationAddress = '0x9c7e8ce6825bD48278B3Ab59228EE26f8BE7925b';
    const hopTx =
      '0xf86b808504a817c8ff8252ff949c7e8ce6825bd48278b3ab59228ee26f8be7925b87038d7ea4c68000801ca011bc22c664570133dfca4f08a0b8d02339cf467046d6a4152f04f368d0eaf99ea01d6dc5cf0c897c8d4c3e1df53d0d042784c424536a4cc5b802552b7d64fee8b5';
    const hopTxid = '0x4af65143bc77da2b50f35b3d13cacb4db18f026bf84bc0743550bc57b9b53351';
    const userReqSig =
      '0x404db307f6147f0d8cd338c34c13906ef46a6faa7e0e119d5194ef05aec16e6f3d710f9b7901460f97e924066b62efd74443bd34402c6d40b49c203a559ff2c8';

    const bitgoKeyXprv =
      'xprv9s21ZrQH143K3tpWBHWe31sLoXNRQ9AvRYJgitkKxQ4ATFQMwvr7hHNqYRUnS7PsjzB7aK1VxqHLuNQjj1sckJ2Jwo2qxmsvejwECSpFMfC';
    const bitgoKey = bip32.fromBase58(bitgoKeyXprv);
    if (!bitgoKey.privateKey) {
      throw new Error('no privateKey');
    }
    const bitgoXpub = bitgoKey.neutered().toBase58();
    const hopTxBitgoSignature =
      '0xaa' +
      Buffer.from(secp256k1.ecdsaSign(Buffer.from(hopTxid.slice(2), 'hex'), bitgoKey.privateKey).signature).toString(
        'hex'
      );

    const env = 'test';
    const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env });
    common.Environments[env].hsmXpub = bitgoXpub;
    bitgo.safeRegister('polygon', Polygon.createInstance);
    bitgo.safeRegister('tpolygon', Tpolygon.createInstance);
    bitgo.initializeTestVars();
    const basecoin: any = bitgo.coin('tpolygon');

    runTransactionVerificationTests('Polygon', bitgo, basecoin, testData);

    it('should verify a hop txPrebuild from the bitgo server that matches the client txParams', async function () {
      const wallet = new Wallet(bitgo, basecoin, {});

      const txParams = {
        recipients: [{ amount: 1000000000000000, address: hopDestinationAddress }],
        wallet: wallet,
        walletPassphrase: 'fakeWalletPassphrase',
        hop: true,
      };

      const txPrebuild = {
        recipients: [{ amount: '5000000000000000', address: hopContractAddress }],
        nextContractSequenceId: 0,
        gasPrice: 20000000000,
        gasLimit: 500000,
        isBatch: false,
        coin: 'tpolygon',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
        hopTransaction: {
          tx: hopTx,
          id: hopTxid,
          signature: hopTxBitgoSignature,
          paymentId: '2773928196',
          gasPrice: 20000000000,
          gasLimit: 500000,
          amount: '1000000000000000',
          recipient: hopDestinationAddress,
          nonce: 0,
          userReqSig: userReqSig,
          gasPriceMax: 500000000000,
        },
      };

      const verification = {};

      const isTransactionVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, wallet, verification });
      isTransactionVerified.should.equal(true);
    });
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
    bitgo.safeRegister(coinMain, Polygon.createInstance);
    bitgo.safeRegister(coinTest, Tpolygon.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin(coinTest);
    const txBuilder = getBuilder(coinTest) as TransactionBuilder;
    const baseUrl = testData.BASE_URL;
    runRecoveryTransactionTests('Polygon', txBuilder, bitgo, testData, mockData);

    xit('should construct a recovery tx with TSS', async function () {
      const backupKeyAddress = '0xe7406dc43d13f698fb41a345c7783d39a4c2d191';
      nock(baseUrl)
        .get('/api')
        .query(mockData.getTxListRequest(backupKeyAddress))
        .reply(200, mockData.getTxListResponse);
      nock(baseUrl)
        .get('/api')
        .query(mockData.getBalanceRequest(backupKeyAddress))
        .reply(200, mockData.getBalanceResponse);

      const basecoin = bitgo.coin('tpolygon') as Polygon;
      const userKey = mockData.keyShares.userKeyShare;
      const backupKey = mockData.keyShares.backupKeyShare;
      const bitgoKey = mockData.keyShares.bitgoKeyShare;

      const userSigningMaterial: ECDSAMethodTypes.SigningMaterial = {
        pShare: userKey.pShare,
        backupNShare: backupKey.nShares[1],
        bitgoNShare: bitgoKey.nShares[1],
      };

      const backupSigningMaterial: ECDSAMethodTypes.SigningMaterial = {
        pShare: backupKey.pShare,
        userNShare: userKey.nShares[2],
        bitgoNShare: bitgoKey.nShares[2],
      };

      const encryptedBackupSigningMaterial = sjcl.encrypt(
        TestBitGo.V2.TEST_RECOVERY_PASSCODE,
        JSON.stringify(backupSigningMaterial)
      );
      const encryptedUserSigningMaterial = sjcl.encrypt(
        TestBitGo.V2.TEST_RECOVERY_PASSCODE,
        JSON.stringify(userSigningMaterial)
      );

      const recoveryParams = {
        userKey: encryptedUserSigningMaterial,
        backupKey: encryptedBackupSigningMaterial,
        walletContractAddress: '0xe7406dc43d13f698fb41a345c7783d39a4c2d191',
        recoveryDestination: '0xac05da78464520aa7c9d4c19bd7a440b111b3054',
        walletPassphrase: TestBitGo.V2.TEST_RECOVERY_PASSCODE,
        isTss: true,
      };

      const recovery = await basecoin.recover(recoveryParams);
      // id and tx will always be different because of expireTime
      should.exist(recovery);
      recovery.should.have.property('id');
      recovery.should.have.property('tx');
    });

    it('should construct an unsigned sweep tx with TSS', async function () {
      const backupKeyAddress = '0xe7406dc43d13f698fb41a345c7783d39a4c2d191';
      nock(baseUrl)
        .get('/api')
        .query(mockData.getTxListRequest(backupKeyAddress))
        .reply(200, mockData.getTxListResponse);
      nock(baseUrl)
        .get('/api')
        .query(mockData.getBalanceRequest(backupKeyAddress))
        .reply(200, mockData.getBalanceResponse);

      const basecoin = bitgo.coin('tpolygon') as Polygon;

      const userKey = '03f8606a595917de4cf2244e27b7fba172505469392ad385d2dd2b3588a6bb878c';
      const backupKey = '03f8606a595917de4cf2244e27b7fba172505469392ad385d2dd2b3588a6bb878c';

      const recoveryParams = {
        userKey: userKey,
        backupKey: backupKey,
        walletContractAddress: '0xe7406dc43d13f698fb41a345c7783d39a4c2d191',
        recoveryDestination: '0xac05da78464520aa7c9d4c19bd7a440b111b3054',
        walletPassphrase: TestBitGo.V2.TEST_RECOVERY_PASSCODE,
        isTss: true,
        gasPrice: 20000000000,
        gasLimit: 500000,
        replayProtectionOptions: {
          chain: 80002,
          hardfork: 'london',
        },
      };

      const transaction = (await basecoin.recover(recoveryParams)) as OfflineVaultTxInfo;
      should.exist(transaction);
      transaction.should.have.property('tx');
      transaction.should.have.property('expireTime');
      transaction.should.have.property('gasLimit');
      transaction.gasLimit.should.equal('500000');
      transaction.should.have.property('gasPrice');
      transaction.gasPrice.should.equal('20000000000');
      transaction.should.have.property('recipient');
      const recipient = (transaction as any).recipient as Recipient;
      recipient.should.have.property('address');
      recipient.address.should.equal('0xac05da78464520aa7c9d4c19bd7a440b111b3054');
      recipient.should.have.property('amount');
      recipient.amount.should.equal('9989999999999999928');
    });
  });

  describe('Evm Based Cross Chain Recovery transaction:', function () {
    const baseUrl = 'https://api-amoy.polygonscan.com';
    const userXpub =
      'xpub661MyMwAqRbcEeTc8789MK5PUGEYiPG4F4V17n2Rd2LoTATA1XoCnJT5FAYAShQxSxtFjpo5NHmcWwTp2LiWGBMwpUcAA3HywhxivgYfq7q';
    const bitgoFeeAddress = '0x33a42faea3c6e87021347e51700b48aaf49aa1e7';
    const destinationAddress = '0xd5adde17fed8baed3f32b84af05b8f2816f7b560';
    const bitgoDestinationAddress = '0xe5986ce4490deb67d2950562ceb930ddf9be7a14';

    after(function () {
      nock.cleanAll();
    });

    it('should generate an unsigned recovery txn for cold wallet', async function () {
      const walletContractAddress = TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS as string;
      const basecoin = bitgo.coin('tpolygon') as Polygon;
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
      })) as OfflineVaultTxInfo;

      should.exist(transaction);
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

      const basecoin = bitgo.coin('tpolygon') as Polygon;
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
    });

    it('should generate an unsigned recovery txn for hot wallet', async function () {
      const userKey =
        '{"iv":"VFZ3jvXhxo1Z+Yaf2MtZnA==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
        ':"ccm","adata":"","cipher":"aes","salt":"p+fkHuLa/8k=","ct":"hYG7pvljLIgCjZ\n' +
        '53PBlCde5KZRmlUKKHLtDMk+HJfuU46hW+x+C9WsIAO4gFPnTCvFVmQ8x7czCtcNFub5AO2otOG\n' +
        'OsX4GE2gXOEmCl1TpWwwNhm7yMUjGJUpgW6ZZgXSXdDitSKi4V/hk78SGSzjFOBSPYRa6I="}\n';
      const walletContractAddress = TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS as string;
      const walletPassphrase = TestBitGo.V2.TEST_RECOVERY_PASSCODE as string;

      const basecoin = bitgo.coin('tpolygon') as Polygon;
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

    it('should generate an unsigned recovery txn of a token for cold wallet ', async function () {
      const walletContractAddress = TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS as string;
      const tokenContractAddress = '0x326c977e6efc84e512bb9c30f76e30c160ed06fb'; // tpolygon-link contract token address

      const basecoin = bitgo.coin('tpolygon') as Polygon;
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
      })) as OfflineVaultTxInfo;

      should.exist(transaction);
      transaction.should.have.property('txHex');

      const txBuilder = getBuilder('tpolygon') as TransactionBuilder;
      txBuilder.from(transaction.txHex);
      const rebuiltTx = await txBuilder.build();
      const rebuiltTxJson = rebuiltTx.toJson();
      rebuiltTxJson.should.have.property('data');
      rebuiltTxJson.data.should.startWith('0x0dcd7a6c'); // sendMultiSigToken func

      transaction.should.have.property('userKey');
      transaction.should.have.property('coin');
      transaction.coin.should.equal('tpolygon:link');
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
      const tokenContractAddress = '0x326c977e6efc84e512bb9c30f76e30c160ed06fb'; // tpolygon-link contract token address

      const basecoin = bitgo.coin('tpolygon') as Polygon;
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
      })) as OfflineVaultTxInfo;

      should.exist(transaction);
      transaction.should.have.property('txHex');

      const txBuilder = getBuilder('tpolygon') as TransactionBuilder;
      txBuilder.from(transaction.txHex);
      const rebuiltTx = await txBuilder.build();
      const rebuiltTxJson = rebuiltTx.toJson();
      rebuiltTxJson.should.have.property('data');
      rebuiltTxJson.data.should.startWith('0x0dcd7a6c'); // sendMultiSigToken func

      transaction.should.have.property('coin');
      transaction.coin.should.equal('tpolygon:link');
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
      const walletPassphrase = TestBitGo.V2.TEST_RECOVERY_PASSCODE as string;
      const tokenContractAddress = '0x326c977e6efc84e512bb9c30f76e30c160ed06fb'; // tpolygon-link contract token address

      const basecoin = bitgo.coin('tpolygon') as Polygon;
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

      const txBuilder = getBuilder('tpolygon') as TransactionBuilder;
      txBuilder.from(transaction.txHex);
      const rebuiltTx = await txBuilder.build();
      const rebuiltTxJson = rebuiltTx.toJson();
      rebuiltTxJson.should.have.property('data');
      rebuiltTxJson.data.should.startWith('0x0dcd7a6c'); // sendMultiSigToken func

      transaction.should.have.property('coin');
      transaction.coin.should.equal('tpolygon:link');
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
